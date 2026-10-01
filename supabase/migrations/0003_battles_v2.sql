-- Mantis — 0003: server-authoritative battles
-- Run once in the Supabase SQL editor, after 0001 and 0002. Safe to re-run.
--
-- What this adds:
--   • Answers + ratings are decided on the server. Clients never receive a
--     question's correct option before answering, and can no longer write their
--     own rating (battle_profiles stats are only changed by functions below).
--   • Battle kinds: 'live' (matchmade 1v1), 'bot' (practice, never rated) and
--     'challenge' (Wordle-style: host plays a set, shares single-use links).
--     Live + challenge can be rated or friendly.
--   • Guests: Supabase anonymous users get a pseudonymous guest battle profile.
--     On sign-up / log-in their battles + rating are merged via a secret.
--   • Question curation columns + per-question answer stats (for calibrating
--     difficulty from real play later).
--
-- Mode rules mirror lib/config/battle-modes.ts — keep both in sync.
-- Rank thresholds mirror lib/config/ranks.ts; difficulty mix mirrors
-- lib/config/difficulty.ts.

create extension if not exists pgcrypto with schema extensions;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Questions: curation + stats + random sampling key; hide answers
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.questions
  add column if not exists review_status text not null default 'unreviewed',
  add column if not exists flags text[] not null default '{}',
  add column if not exists times_answered integer not null default 0,
  add column if not exists times_correct integer not null default 0,
  add column if not exists rand double precision not null default random();

alter table public.questions drop constraint if exists questions_review_status_chk;
alter table public.questions add constraint questions_review_status_chk
  check (review_status in ('unreviewed', 'ok', 'flagged', 'retired'));

-- Battle-eligible = active and not flagged/retired.
create index if not exists questions_pick_subject_idx
  on public.questions (subject, difficulty, rand)
  where is_active and review_status in ('unreviewed', 'ok');
create index if not exists questions_pick_group_idx
  on public.questions (subject_group, difficulty, rand)
  where is_active and review_status in ('unreviewed', 'ok');
create index if not exists questions_pick_all_idx
  on public.questions (difficulty, rand)
  where is_active and review_status in ('unreviewed', 'ok');

-- Correct answers + explanations are only served through functions (battle
-- answer checks, review after a battle). Everything else stays browsable.
revoke select on public.questions from anon, authenticated;
grant select (id, source, question, option_a, option_b, option_c, option_d, subject,
              subject_group, topic, subtopic, difficulty, is_active, created_at)
  on public.questions to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Battle profiles: guests + lock down stats
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.battle_profiles
  add column if not exists is_guest boolean not null default false;

-- Players may only rename / change avatar. Rating, games, wins etc. are written
-- exclusively by the security-definer functions below.
revoke insert, update on public.battle_profiles from authenticated;
grant update (battle_username, avatar_key) on public.battle_profiles to authenticated;

-- Leaderboards never list guests.
create or replace view public.leaderboard_battle as
  select battle_username, avatar_key, rating, rank_key, country, state, college
  from public.battle_profiles
  where not is_guest;
grant select on public.leaderboard_battle to anon, authenticated;

-- Anonymous (guest) sessions use the `authenticated` role, so block them from
-- writing account-only data. Restrictive policies AND with the existing ones.
do $$
declare
  t text;
  op text;
begin
  foreach t in array array['profiles', 'follows', 'decks', 'cards', 'deck_saves', 'card_reviews'] loop
    foreach op in array array['insert', 'update', 'delete'] loop
      execute format('drop policy if exists %I on public.%I', 'no_guest_' || op, t);
      if op = 'insert' then
        execute format(
          'create policy %I on public.%I as restrictive for insert to authenticated
             with check (not coalesce((auth.jwt() ->> ''is_anonymous'')::boolean, false))',
          'no_guest_' || op, t);
      else
        execute format(
          'create policy %I on public.%I as restrictive for %s to authenticated
             using (not coalesce((auth.jwt() ->> ''is_anonymous'')::boolean, false))',
          'no_guest_' || op, t, op);
      end if;
    end loop;
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Bots (practice opponents + matchmaking fallback). Always labelled as bots.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.bots (
  id text primary key,
  name text not null,
  rank_key text not null,
  rating integer not null,
  blurb text not null,
  sort integer not null
);

alter table public.bots enable row level security;
drop policy if exists "Bots are public" on public.bots;
create policy "Bots are public" on public.bots for select using (true);
grant select on public.bots to anon, authenticated;

insert into public.bots (id, name, rank_key, rating, blurb, sort) values
  ('pip',    'Pip',    'intern',     800,  'Just starting out. Slow, and often wrong.',            1),
  ('nova',   'Nova',   'intern',     900,  'Knows the basics. Still guesses a lot.',                2),
  ('atlas',  'Atlas',  'resident',   1050, 'Steady on common facts.',                               3),
  ('juno',   'Juno',   'resident',   1150, 'Solid fundamentals, average speed.',                    4),
  ('orion',  'Orion',  'registrar',  1300, 'Quick and usually right.',                              5),
  ('vega',   'Vega',   'registrar',  1400, 'Rarely misses a high-yield question.',                  6),
  ('kepler', 'Kepler', 'specialist', 1550, 'Fast and accurate.',                                    7),
  ('lyra',   'Lyra',   'specialist', 1700, 'Hard to beat on tricky distractors.',                   8),
  ('sage',   'Sage',   'consultant', 1850, 'Topper level.',                                         9),
  ('apex',   'Apex',   'consultant', 2050, 'Near-perfect and very fast. Good luck.',                10)
on conflict (id) do update set
  name = excluded.name, rank_key = excluded.rank_key, rating = excluded.rating,
  blurb = excluded.blurb, sort = excluded.sort;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Battle tables (no direct client access — functions only)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.battles (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('live', 'bot', 'challenge')),
  rated boolean not null default false,
  mode text not null check (mode in ('rapid', 'blitz', 'marathon')),
  category_id text not null,
  question_ids uuid[] not null,
  bot_id text references public.bots (id),
  created_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'finished')),
  created_at timestamptz not null default now(),
  -- live: hard end of the match. challenge: when its links expire (set once the host finishes).
  deadline_at timestamptz,
  settled_at timestamptz,
  check (kind <> 'bot' or not rated)
);

create table if not exists public.battle_players (
  battle_id uuid not null references public.battles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('host', 'opponent', 'challenger')),
  rating_before integer not null,
  rating_after integer,
  rating_delta integer,
  -- challenge only: rating change applied to the host by this challenger's result
  host_delta integer,
  score integer not null default 0,
  answered integer not null default 0,
  total_ms bigint not null default 0,
  current_index integer not null default 0,
  served_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  outcome text check (outcome in ('win', 'loss', 'draw')),
  joined_at timestamptz not null default now(),
  primary key (battle_id, user_id)
);
create index if not exists battle_players_user_idx on public.battle_players (user_id, joined_at desc);

create table if not exists public.battle_answers (
  battle_id uuid not null,
  user_id uuid not null,
  q_index integer not null,
  question_id uuid not null references public.questions (id),
  selected text check (selected in ('A', 'B', 'C', 'D')),
  correct boolean not null,
  response_ms integer not null,
  answered_at timestamptz not null default now(),
  primary key (battle_id, user_id, q_index),
  foreign key (battle_id, user_id) references public.battle_players (battle_id, user_id)
    on delete cascade on update cascade
);

create table if not exists public.battle_bot_answers (
  battle_id uuid not null references public.battles (id) on delete cascade,
  q_index integer not null,
  selected text not null check (selected in ('A', 'B', 'C', 'D')),
  correct boolean not null,
  response_ms integer not null,
  primary key (battle_id, q_index)
);

create table if not exists public.challenge_links (
  token text primary key,
  battle_id uuid not null references public.battles (id) on delete cascade,
  created_at timestamptz not null default now(),
  claimed_by uuid references auth.users (id) on delete set null,
  claimed_at timestamptz
);
create index if not exists challenge_links_battle_idx on public.challenge_links (battle_id);

create table if not exists public.match_queue (
  user_id uuid primary key references auth.users (id) on delete cascade,
  mode text not null,
  category_id text not null,
  rated boolean not null,
  rating integer not null,
  enqueued_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  matched_battle_id uuid references public.battles (id) on delete set null
);

create table if not exists public.guest_merge_secrets (
  guest_user_id uuid primary key references auth.users (id) on delete cascade,
  secret_hash text not null,
  created_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array['battles', 'battle_players', 'battle_answers', 'battle_bot_answers',
                           'challenge_links', 'match_queue', 'guest_merge_secrets'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Internal helpers (not callable by clients)
-- ─────────────────────────────────────────────────────────────────────────────

-- Mode rules. q_count for rapid is the size of the pool served one by one.
create or replace function public._mode_cfg(
  p_mode text,
  out q_count integer,
  out per_q_sec integer,
  out limit_sec integer
)
language sql immutable as $$
  select
    case p_mode when 'rapid' then 120 when 'blitz' then 15 when 'marathon' then 30 end,
    case p_mode when 'blitz' then 20 end,
    case p_mode when 'rapid' then 300 when 'blitz' then 15 * 20 when 'marathon' then 45 * 60 end
$$;

create or replace function public._category_predicate(p_category text)
returns text
language plpgsql immutable as $$
begin
  if p_category = 'all' then
    return 'true';
  elsif p_category in ('pre-clinical', 'para-clinical', 'clinical') then
    return format('subject_group = %L', p_category);
  elsif p_category in ('anatomy', 'physiology', 'biochemistry', 'pathology', 'pharmacology',
                       'microbiology', 'fmt', 'psm', 'medicine', 'surgery', 'obgyn', 'pediatrics',
                       'ent', 'ophthalmology', 'orthopedics', 'dermatology', 'psychiatry',
                       'radiology', 'anaesthesia') then
    return format('subject = %L', p_category);
  end if;
  return null;
end;
$$;

create or replace function public._rank_key(p_rating integer)
returns text
language sql immutable as $$
  select case
    when p_rating >= 1800 then 'consultant'
    when p_rating >= 1500 then 'specialist'
    when p_rating >= 1250 then 'registrar'
    when p_rating >= 1000 then 'resident'
    else 'intern'
  end
$$;

-- Elo with the K-factor schedule from features/battle/elo.ts; floor 750.
create or replace function public._elo(p_rating integer, p_opp integer, p_score numeric, p_games integer)
returns integer
language sql immutable as $$
  select greatest(750, p_rating + round(
    (case when p_games < 30 then 40 when p_rating < 1600 then 24 else 12 end)
    * (p_score - 1 / (1 + power(10, (p_opp - p_rating) / 400.0)))
  )::integer)
$$;

-- Picks p_count battle-eligible question ids with a rating-based difficulty mix,
-- sampled in small chunks from random points of the `rand` ordering.
create or replace function public._pick_questions(p_category text, p_count integer, p_rating integer)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pred text := public._category_predicate(p_category);
  v_mix numeric[];
  v_diffs text[] := array['easy', 'medium', 'hard'];
  v_want integer[];
  v_picked uuid[] := '{}';
  v_chunk uuid[];
  v_need integer;
  v_r double precision;
  v_size integer := case when p_count > 30 then 10 else 5 end;
  v_guard integer;
  i integer;
  v_where text;
  v_sql_ge text;
  v_sql_lt text;
begin
  if v_pred is null then
    raise exception 'invalid_category';
  end if;

  v_mix := case
    when p_rating < 1000 then array[0.6, 0.3, 0.1]
    when p_rating < 1300 then array[0.45, 0.4, 0.15]
    when p_rating < 1600 then array[0.3, 0.45, 0.25]
    when p_rating < 1900 then array[0.2, 0.45, 0.35]
    else array[0.1, 0.45, 0.45]
  end;
  v_want := array[round(p_count * v_mix[1])::integer, round(p_count * v_mix[2])::integer, 0];
  v_want[3] := greatest(0, p_count - v_want[1] - v_want[2]);

  -- Per-difficulty quota, then top up from any difficulty (the bank is not yet
  -- evenly labelled, so some buckets can be thin or empty). Predicates are
  -- inlined (all values are validated/constant) so the partial indexes apply.
  for i in 1..4 loop
    v_need := case when i <= 3 then v_want[i] else p_count - cardinality(v_picked) end;
    v_where := format('is_active and review_status in (''unreviewed'', ''ok'') and %s%s',
                      v_pred, case when i <= 3 then format(' and difficulty = %L', v_diffs[i]) else '' end);
    v_sql_ge := format('select coalesce(array_agg(id), ''{}'') from (select id from public.questions
                          where %s and rand >= $1 and not (id = any($2)) order by rand limit $3) s', v_where);
    v_sql_lt := format('select coalesce(array_agg(id), ''{}'') from (select id from public.questions
                          where %s and rand < $1 and not (id = any($2)) order by rand limit $3) s', v_where);
    v_guard := 0;
    while v_need > 0 and v_guard < 60 loop
      v_guard := v_guard + 1;
      v_r := random();
      execute v_sql_ge into v_chunk using v_r, v_picked, least(v_need, v_size);
      if cardinality(v_chunk) = 0 then
        execute v_sql_lt into v_chunk using v_r, v_picked, least(v_need, v_size);
      end if;
      exit when cardinality(v_chunk) = 0;
      v_picked := v_picked || v_chunk;
      v_need := v_need - cardinality(v_chunk);
    end loop;
  end loop;

  if cardinality(v_picked) < least(p_count, 5) then
    raise exception 'not_enough_questions';
  end if;

  select array_agg(x order by random()) into v_picked from unnest(v_picked) x;
  return v_picked;
end;
$$;

-- Caller's battle profile (locked), or an error.
create or replace function public._me()
returns public.battle_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.battle_profiles;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  select * into v from public.battle_profiles where user_id = auth.uid();
  if not found then
    raise exception 'no_battle_profile';
  end if;
  return v;
end;
$$;

-- Applies a rated result to a profile; returns the rating change.
create or replace function public._apply_rating(p_user uuid, p_opp_rating integer, p_outcome text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.battle_profiles;
  v_new integer;
begin
  select * into v from public.battle_profiles where user_id = p_user for update;
  if not found then
    return 0;
  end if;
  v_new := public._elo(v.rating, p_opp_rating,
                       case p_outcome when 'win' then 1 when 'draw' then 0.5 else 0 end, v.games);
  update public.battle_profiles set
    rating = v_new,
    highest_rating = greatest(highest_rating, v_new),
    games = games + 1,
    wins = wins + (p_outcome = 'win')::integer,
    losses = losses + (p_outcome = 'loss')::integer,
    current_streak = case when p_outcome = 'win' then current_streak + 1 else 0 end,
    rank_key = public._rank_key(v_new),
    updated_at = now()
  where user_id = p_user;
  return v_new - v.rating;
end;
$$;

-- Current rating of a player (for pairing ratings at settlement time).
create or replace function public._rating_of(p_user uuid)
returns integer
language sql stable security definer set search_path = public as $$
  select rating from public.battle_profiles where user_id = p_user
$$;

create or replace function public._outcome(p_score integer, p_opp_score integer)
returns text
language sql immutable as $$
  select case when p_score > p_opp_score then 'win' when p_score < p_opp_score then 'loss' else 'draw' end
$$;

-- Per-player time cap (plus a small grace for an in-flight answer).
create or replace function public._player_deadline(p_battle public.battles, p_player public.battle_players)
returns timestamptz
language sql stable as $$
  select p_player.started_at
         + make_interval(secs => (public._mode_cfg(p_battle.mode)).limit_sec + 5)
$$;

-- Bot's precomputed answer sheet for a battle.
create or replace function public._generate_bot_answers(p_battle uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.battles;
  v_bot_rating integer;
  v_per_q integer;
  v_ceiling integer;
  v_base double precision;
  q record;
  v_qr integer;
  v_p double precision;
  v_correct boolean;
  v_sel text;
  v_ms integer;
begin
  select * into b from public.battles where id = p_battle;
  select rating into v_bot_rating from public.bots where id = b.bot_id;
  v_per_q := (public._mode_cfg(b.mode)).per_q_sec;
  v_ceiling := coalesce(v_per_q * 1000 - 800, 25000);
  v_base := 1700 + greatest(0.15, least(1.0, (2300 - v_bot_rating) / 1600.0)) * 7500;

  for q in
    select (t.ord - 1)::integer as idx, qq.difficulty, qq.correct_option::text as correct_option
    from unnest(b.question_ids) with ordinality as t(qid, ord)
    join public.questions qq on qq.id = t.qid
  loop
    -- P(correct) = P(knows it) + P(guesses right among 4).
    v_qr := case q.difficulty when 'easy' then 800 when 'medium' then 1100 else 1400 end;
    v_p := 1 / (1 + power(10, (v_qr - v_bot_rating) / 400.0));
    v_p := v_p + (1 - v_p) * 0.25;
    v_correct := random() < v_p;
    if v_correct then
      v_sel := q.correct_option;
    else
      select o into v_sel from unnest(array['A', 'B', 'C', 'D']) o
      where o <> q.correct_option order by random() limit 1;
    end if;
    v_ms := round(v_base + (random() - 0.5) * v_base * 0.35
                  + case when v_correct then 0 else 800 + random() * 1200 end)::integer;
    v_ms := greatest(1400, least(v_ceiling, v_ms));
    insert into public.battle_bot_answers (battle_id, q_index, selected, correct, response_ms)
    values (p_battle, q.idx, v_sel, v_correct, v_ms)
    on conflict do nothing;
  end loop;
end;
$$;

-- Settles whatever can be settled for a battle. Idempotent. Always lock the
-- battle row before player rows (every caller follows this order).
create or replace function public._try_settle(p_battle uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.battles;
  p public.battle_players;
  a public.battle_players;
  h public.battle_players;
  c record;
  v_bot_score integer;
  v_out_a text;
  v_out_b text;
  v_rating_a integer;
  v_rating_b integer;
  v_delta_a integer;
  v_delta_b integer;
begin
  select * into b from public.battles where id = p_battle for update;
  if not found then
    return;
  end if;

  -- Time out players who started but ran past their own cap.
  update public.battle_players bp set finished_at = now(), served_at = null
  where bp.battle_id = b.id and bp.finished_at is null and bp.started_at is not null
    and now() > public._player_deadline(b, bp);

  if b.kind = 'bot' then
    if b.settled_at is not null then
      return;
    end if;
    select * into p from public.battle_players where battle_id = b.id and role = 'host';
    if p.finished_at is null then
      return;
    end if;
    -- The bot only "played" the questions the human reached.
    select count(*) filter (where correct) into v_bot_score
    from public.battle_bot_answers where battle_id = b.id and q_index < p.answered;
    update public.battle_players set outcome = public._outcome(p.score, v_bot_score),
      rating_after = rating_before, rating_delta = 0
    where battle_id = b.id and user_id = p.user_id;
    update public.battles set status = 'finished', settled_at = now() where id = b.id;

  elsif b.kind = 'live' then
    if b.settled_at is not null then
      return;
    end if;
    if now() > b.deadline_at then
      update public.battle_players set finished_at = coalesce(finished_at, now()), served_at = null
      where battle_id = b.id and finished_at is null;
    end if;
    if exists (select 1 from public.battle_players where battle_id = b.id and finished_at is null) then
      return;
    end if;
    select * into a from public.battle_players where battle_id = b.id and role = 'host';
    select * into p from public.battle_players where battle_id = b.id and role = 'opponent';
    v_out_a := public._outcome(a.score, p.score);
    v_out_b := public._outcome(p.score, a.score);
    v_delta_a := 0;
    v_delta_b := 0;
    if b.rated then
      v_rating_a := public._rating_of(a.user_id);
      v_rating_b := public._rating_of(p.user_id);
      v_delta_a := public._apply_rating(a.user_id, v_rating_b, v_out_a);
      v_delta_b := public._apply_rating(p.user_id, v_rating_a, v_out_b);
    end if;
    update public.battle_players set outcome = v_out_a,
      rating_delta = v_delta_a, rating_after = rating_before + v_delta_a
    where battle_id = b.id and user_id = a.user_id;
    update public.battle_players set outcome = v_out_b,
      rating_delta = v_delta_b, rating_after = rating_before + v_delta_b
    where battle_id = b.id and user_id = p.user_id;
    update public.battles set status = 'finished', settled_at = now() where id = b.id;

  else -- challenge: settle each finished challenger against the host, once.
    select * into h from public.battle_players where battle_id = b.id and role = 'host';
    if h.user_id is null or h.finished_at is null then
      return;
    end if;
    if b.deadline_at is null then
      update public.battles set deadline_at = h.finished_at + interval '24 hours' where id = b.id;
    end if;
    for c in
      select * from public.battle_players
      where battle_id = b.id and role = 'challenger' and finished_at is not null and outcome is null
      order by finished_at
    loop
      v_out_b := public._outcome(c.score, h.score);
      v_out_a := public._outcome(h.score, c.score);
      v_delta_a := 0;
      v_delta_b := 0;
      if b.rated then
        v_rating_a := public._rating_of(h.user_id);
        v_rating_b := public._rating_of(c.user_id);
        v_delta_b := public._apply_rating(c.user_id, v_rating_a, v_out_b);
        v_delta_a := public._apply_rating(h.user_id, v_rating_b, v_out_a);
      end if;
      update public.battle_players set outcome = v_out_b,
        rating_delta = v_delta_b, rating_after = rating_before + v_delta_b, host_delta = v_delta_a
      where battle_id = b.id and user_id = c.user_id;
    end loop;
    -- Host's running total across all challengers.
    update public.battle_players hp set
      rating_delta = x.total, rating_after = hp.rating_before + x.total
    from (select coalesce(sum(host_delta), 0)::integer as total from public.battle_players
          where battle_id = b.id and role = 'challenger') x
    where hp.battle_id = b.id and hp.role = 'host';
  end if;
end;
$$;

-- JSON for the question a player is currently on (no answer key).
create or replace function public._serve(p_battle public.battles, p_player public.battle_players)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  q public.questions;
  v_bot_ms integer;
begin
  if p_player.started_at is null or p_player.served_at is null
     or p_player.finished_at is not null
     or p_player.current_index >= cardinality(p_battle.question_ids) then
    return null;
  end if;
  select * into q from public.questions where id = p_battle.question_ids[p_player.current_index + 1];
  if p_battle.kind = 'bot' then
    select response_ms into v_bot_ms from public.battle_bot_answers
    where battle_id = p_battle.id and q_index = p_player.current_index;
  end if;
  return jsonb_build_object(
    'index', p_player.current_index,
    'question', q.question,
    'options', jsonb_build_object('A', q.option_a, 'B', q.option_b, 'C', q.option_c, 'D', q.option_d),
    'subject', q.subject,
    'difficulty', q.difficulty,
    'served_at', p_player.served_at,
    'bot_ms', v_bot_ms
  );
end;
$$;

-- Public, privacy-safe identity of a player.
create or replace function public._identity(p_user uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('username', battle_username, 'avatar_key', avatar_key,
                            'rating', rating, 'is_guest', is_guest, 'is_bot', false)
  from public.battle_profiles where user_id = p_user
$$;

create or replace function public._bot_identity(p_bot text)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('username', name, 'avatar_key', 'bot', 'rating', rating,
                            'is_guest', false, 'is_bot', true, 'bot_id', id)
  from public.bots where id = p_bot
$$;

-- Full battle state as seen by the calling player.
create or replace function public._state(p_battle uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.battles;
  me public.battle_players;
  v_cfg record;
  v_players jsonb;
  v_bot jsonb;
begin
  select * into b from public.battles where id = p_battle;
  select * into me from public.battle_players where battle_id = p_battle and user_id = auth.uid();
  v_cfg := public._mode_cfg(b.mode);

  select coalesce(jsonb_agg(
      coalesce(public._identity(bp.user_id), '{}'::jsonb) || jsonb_build_object(
        'me', bp.user_id = auth.uid(),
        'role', bp.role,
        'rating_before', bp.rating_before,
        'rating_delta', bp.rating_delta,
        'host_delta', bp.host_delta,
        'score', bp.score,
        'answered', bp.answered,
        'total_ms', bp.total_ms,
        'started', bp.started_at is not null,
        'finished', bp.finished_at is not null,
        'outcome', bp.outcome)
      order by (bp.role = 'host') desc, bp.score desc, bp.total_ms), '[]'::jsonb)
  into v_players
  from public.battle_players bp
  where bp.battle_id = b.id
    -- Challengers see the host + finished challengers; the host sees everyone.
    and (b.kind <> 'challenge' or bp.user_id = auth.uid() or bp.role = 'host'
         or bp.finished_at is not null or me.role = 'host');

  if b.kind = 'bot' then
    v_bot := public._bot_identity(b.bot_id) || jsonb_build_object(
      'score', (select count(*) filter (where correct) from public.battle_bot_answers
                where battle_id = b.id and q_index < me.answered),
      'answered', me.answered);
  end if;

  return jsonb_build_object(
    'battle_id', b.id,
    'kind', b.kind,
    'rated', b.rated,
    'mode', b.mode,
    'category_id', b.category_id,
    'status', b.status,
    'total_questions', case when b.mode = 'rapid' then null else cardinality(b.question_ids) end,
    'per_q_sec', v_cfg.per_q_sec,
    'limit_sec', v_cfg.limit_sec,
    -- When the caller's run ends (null = no overall clock, or not started).
    'ends_at', case when me.started_at is null or b.mode = 'marathon' and b.kind <> 'live' then null
                    when b.kind = 'live' then least(me.started_at + make_interval(secs => v_cfg.limit_sec), b.deadline_at)
                    else me.started_at + make_interval(secs => v_cfg.limit_sec) end,
    'link_expires_at', case when b.kind = 'challenge' then b.deadline_at end,
    'server_now', now(),
    'me', jsonb_build_object('role', me.role, 'score', me.score, 'answered', me.answered,
                             'index', me.current_index, 'started', me.started_at is not null,
                             'finished', me.finished_at is not null, 'outcome', me.outcome,
                             'rating_before', me.rating_before, 'rating_delta', me.rating_delta),
    'players', v_players,
    'bot', v_bot,
    'question', public._serve(b, me)
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Client-callable functions
-- ─────────────────────────────────────────────────────────────────────────────

-- Returns the caller's battle profile, creating one if needed. Guests get a
-- pseudonymous Guest-<word>-<n> name and a fresh merge secret on every call
-- (store it; pass it to merge_guest after signing in to keep their games).
create or replace function public.ensure_battle_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_anon boolean := coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
  v public.battle_profiles;
  v_words text[] := array['Scalpel', 'Stetho', 'Suture', 'Pulse', 'Reflex', 'Synapse', 'Neuron',
                          'Platelet', 'Retina', 'Cortex', 'Atrium', 'Femur', 'Vagus', 'Enzyme'];
  v_name text;
  v_secret text;
  i integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v from public.battle_profiles where user_id = v_uid;
  if not found then
    for i in 1..20 loop
      v_name := case when v_anon then 'Guest-' else 'Doc-' end
                || v_words[1 + floor(random() * array_length(v_words, 1))::integer]
                || '-' || lpad(floor(random() * 10000)::integer::text, 4, '0');
      begin
        insert into public.battle_profiles (user_id, battle_username, avatar_key, is_guest)
        values (v_uid, v_name, 'default', v_anon)
        returning * into v;
        exit;
      exception when unique_violation then
        -- name taken, try another
      end;
    end loop;
    if v.user_id is null then
      raise exception 'could_not_create_profile';
    end if;
  end if;

  if v.is_guest then
    v_secret := encode(extensions.gen_random_bytes(24), 'hex');
    insert into public.guest_merge_secrets (guest_user_id, secret_hash)
    values (v_uid, encode(extensions.digest(v_secret, 'sha256'), 'hex'))
    on conflict (guest_user_id) do update set secret_hash = excluded.secret_hash, created_at = now();
  end if;

  return jsonb_build_object(
    'username', v.battle_username, 'avatar_key', v.avatar_key, 'rating', v.rating,
    'highest_rating', v.highest_rating, 'games', v.games, 'wins', v.wins, 'losses', v.losses,
    'current_streak', v.current_streak, 'rank_key', v.rank_key, 'is_guest', v.is_guest,
    'merge_secret', v_secret);
end;
$$;

-- Moves a guest's battles (and, for a fresh account, their rating) into the
-- signed-in account. Called after sign-up / log-in with the stored secret.
create or replace function public.merge_guest(p_secret text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_guest uuid;
  g public.battle_profiles;
  u public.battle_profiles;
  v_adopted boolean := false;
begin
  if v_uid is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'sign_in_required';
  end if;

  select guest_user_id into v_guest from public.guest_merge_secrets
  where secret_hash = encode(extensions.digest(p_secret, 'sha256'), 'hex');
  if not found or v_guest = v_uid then
    return jsonb_build_object('merged', false);
  end if;

  select * into g from public.battle_profiles where user_id = v_guest and is_guest for update;
  select * into u from public.battle_profiles where user_id = v_uid for update;

  -- Battles both identities were in (e.g. a self-challenge) stay with the account.
  delete from public.battle_players
  where user_id = v_guest
    and battle_id in (select battle_id from public.battle_players where user_id = v_uid);
  update public.battle_players set user_id = v_uid where user_id = v_guest; -- answers cascade
  update public.battles set created_by = v_uid where created_by = v_guest;
  update public.challenge_links set claimed_by = v_uid where claimed_by = v_guest;
  delete from public.match_queue where user_id = v_guest;

  if g.user_id is not null then
    if u.user_id is null then
      -- Account had no battle identity yet: adopt the guest one (rename later).
      update public.battle_profiles set user_id = v_uid, is_guest = false where user_id = v_guest;
      v_adopted := true;
    elsif u.games = 0 then
      update public.battle_profiles set
        rating = g.rating, highest_rating = greatest(u.highest_rating, g.highest_rating),
        games = g.games, wins = g.wins, losses = g.losses, current_streak = g.current_streak,
        rank_key = g.rank_key, updated_at = now()
      where user_id = v_uid;
      delete from public.battle_profiles where user_id = v_guest;
      v_adopted := true;
    else
      -- Established account keeps its own rating; only the history moves.
      delete from public.battle_profiles where user_id = v_guest;
    end if;
  end if;

  delete from public.guest_merge_secrets where guest_user_id = v_guest;
  return jsonb_build_object('merged', true, 'rating_adopted', v_adopted);
end;
$$;

-- Practice vs a chosen bot (never rated).
create or replace function public.battle_create_bot(p_bot text, p_mode text, p_category text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.battle_profiles := public._me();
  v_bot public.bots;
  v_id uuid;
begin
  select * into v_bot from public.bots where id = p_bot;
  if not found then
    raise exception 'invalid_bot';
  end if;
  if p_mode not in ('rapid', 'blitz', 'marathon') then
    raise exception 'invalid_mode';
  end if;

  insert into public.battles (kind, rated, mode, category_id, question_ids, bot_id, created_by)
  values ('bot', false, p_mode, p_category,
          public._pick_questions(p_category, (public._mode_cfg(p_mode)).q_count, (me.rating + v_bot.rating) / 2),
          p_bot, me.user_id)
  returning id into v_id;
  insert into public.battle_players (battle_id, user_id, role, rating_before)
  values (v_id, me.user_id, 'host', me.rating);
  perform public._generate_bot_answers(v_id);
  return v_id;
end;
$$;

-- Wordle-style challenge: the host plays first, then shares single-use links.
create or replace function public.challenge_create(p_mode text, p_category text, p_rated boolean)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.battle_profiles := public._me();
  v_id uuid;
begin
  if p_mode not in ('rapid', 'blitz', 'marathon') then
    raise exception 'invalid_mode';
  end if;
  insert into public.battles (kind, rated, mode, category_id, question_ids, created_by)
  values ('challenge', coalesce(p_rated, false), p_mode, p_category,
          public._pick_questions(p_category, (public._mode_cfg(p_mode)).q_count, me.rating), me.user_id)
  returning id into v_id;
  insert into public.battle_players (battle_id, user_id, role, rating_before)
  values (v_id, me.user_id, 'host', me.rating);
  return v_id;
end;
$$;

-- Starts (or resumes) the caller's run and returns the battle state with the
-- current question. Reloading never resets the question timer.
create or replace function public.battle_play(p_battle uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.battles;
  p public.battle_players;
begin
  perform public._try_settle(p_battle);
  select * into b from public.battles where id = p_battle for update;
  select * into p from public.battle_players
  where battle_id = p_battle and user_id = auth.uid() for update;
  if not found then
    raise exception 'not_a_player';
  end if;

  if p.finished_at is null then
    update public.battle_players set
      started_at = coalesce(started_at, now()),
      served_at = coalesce(served_at, now())
    where battle_id = p_battle and user_id = auth.uid();
  end if;
  return public._state(p_battle);
end;
$$;

-- Submits the answer for the current question (p_option null = timed out /
-- skipped). Returns the verdict, the opponent bot's answer for bot battles,
-- and the new state (whose question is shown after a short reveal pause).
create or replace function public.battle_answer(p_battle uuid, p_index integer, p_option text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.battles;
  p public.battle_players;
  q public.questions;
  v_cfg record;
  v_elapsed integer;
  v_sel text := upper(nullif(p_option, ''));
  v_correct boolean;
  v_done boolean;
  v_bot jsonb;
  v_reveal interval := interval '1500 milliseconds';
begin
  select * into b from public.battles where id = p_battle for update;
  select * into p from public.battle_players
  where battle_id = p_battle and user_id = auth.uid() for update;
  if not found then
    raise exception 'not_a_player';
  end if;
  if p.started_at is null then
    raise exception 'not_started';
  end if;

  -- Stale / duplicate submit (double tap, retry): just return the state.
  if p.finished_at is not null or p_index <> p.current_index then
    return jsonb_build_object('accepted', false, 'state', public._state(p_battle));
  end if;

  if now() > public._player_deadline(b, p) then
    update public.battle_players set finished_at = now(), served_at = null
    where battle_id = p_battle and user_id = auth.uid();
    perform public._try_settle(p_battle);
    return jsonb_build_object('accepted', false, 'state', public._state(p_battle));
  end if;

  v_cfg := public._mode_cfg(b.mode);
  v_elapsed := greatest(0, round(extract(epoch from (now() - p.served_at)) * 1000))::integer;
  if v_sel is not null and v_sel not in ('A', 'B', 'C', 'D') then
    v_sel := null;
  end if;
  if v_cfg.per_q_sec is not null then
    if v_elapsed > v_cfg.per_q_sec * 1000 + 2500 then
      v_sel := null; -- answered after the clock ran out
    end if;
    v_elapsed := least(v_elapsed, v_cfg.per_q_sec * 1000);
  end if;

  select * into q from public.questions where id = b.question_ids[p_index + 1];
  v_correct := v_sel is not null and v_sel = q.correct_option::text;

  insert into public.battle_answers (battle_id, user_id, q_index, question_id, selected, correct, response_ms)
  values (p_battle, auth.uid(), p_index, q.id, v_sel, v_correct, v_elapsed);

  if v_sel is not null then
    update public.questions set times_answered = times_answered + 1,
                                times_correct = times_correct + v_correct::integer
    where id = q.id;
  end if;

  v_done := p_index + 1 >= cardinality(b.question_ids);
  update public.battle_players set
    score = score + v_correct::integer,
    answered = answered + 1,
    total_ms = total_ms + v_elapsed,
    current_index = current_index + 1,
    served_at = case when v_done then null else now() + v_reveal end,
    finished_at = case when v_done then now() else null end
  where battle_id = p_battle and user_id = auth.uid();

  if b.kind = 'bot' then
    select jsonb_build_object('selected', selected, 'correct', correct, 'response_ms', response_ms)
    into v_bot from public.battle_bot_answers where battle_id = p_battle and q_index = p_index;
  end if;

  if v_done then
    perform public._try_settle(p_battle);
  end if;

  return jsonb_build_object(
    'accepted', true,
    'selected', v_sel,
    'correct', v_correct,
    'correct_option', q.correct_option,
    'response_ms', v_elapsed,
    'reveal_ms', extract(epoch from v_reveal) * 1000,
    'bot', v_bot,
    'state', public._state(p_battle));
end;
$$;

-- Ends the caller's run now (leave / Rapid timer ran out). Unanswered
-- questions count as not answered.
create or replace function public.battle_finish(p_battle uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1 from public.battles where id = p_battle for update;
  update public.battle_players set finished_at = coalesce(finished_at, now()), served_at = null,
                                   started_at = coalesce(started_at, now())
  where battle_id = p_battle and user_id = auth.uid();
  if not found then
    raise exception 'not_a_player';
  end if;
  perform public._try_settle(p_battle);
  return public._state(p_battle);
end;
$$;

-- Polled during live battles (opponent progress) and on result screens.
create or replace function public.battle_state(p_battle uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.battle_players where battle_id = p_battle and user_id = auth.uid()) then
    raise exception 'not_a_player';
  end if;
  perform public._try_settle(p_battle);
  return public._state(p_battle);
end;
$$;

-- Question-by-question review, available once the caller has finished.
create or replace function public.battle_review(p_battle uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.battles;
  me public.battle_players;
  v_other uuid;
begin
  select * into b from public.battles where id = p_battle;
  select * into me from public.battle_players where battle_id = p_battle and user_id = auth.uid();
  if not found then
    raise exception 'not_a_player';
  end if;
  if me.finished_at is null then
    raise exception 'not_finished';
  end if;

  -- Whose answers to show alongside: live → opponent; challenger → host.
  if b.kind = 'live' then
    select user_id into v_other from public.battle_players where battle_id = b.id and user_id <> auth.uid();
  elsif b.kind = 'challenge' and me.role = 'challenger' then
    select user_id into v_other from public.battle_players where battle_id = b.id and role = 'host';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'index', t.ord - 1,
      'question', q.question,
      'options', jsonb_build_object('A', q.option_a, 'B', q.option_b, 'C', q.option_c, 'D', q.option_d),
      'correct_option', q.correct_option,
      'explanation', q.explanation,
      'subject', q.subject,
      'difficulty', q.difficulty,
      'mine', (select jsonb_build_object('selected', selected, 'correct', correct, 'response_ms', response_ms)
               from public.battle_answers where battle_id = b.id and user_id = auth.uid() and q_index = t.ord - 1),
      'theirs', case
        when b.kind = 'bot' then
          (select jsonb_build_object('selected', selected, 'correct', correct, 'response_ms', response_ms)
           from public.battle_bot_answers where battle_id = b.id and q_index = t.ord - 1)
        when v_other is not null then
          (select jsonb_build_object('selected', selected, 'correct', correct, 'response_ms', response_ms)
           from public.battle_answers where battle_id = b.id and user_id = v_other and q_index = t.ord - 1)
      end
    ) order by t.ord)
    from unnest(b.question_ids) with ordinality as t(qid, ord)
    join public.questions q on q.id = t.qid
    -- Rapid serves from a big pool: only review what was reached.
    where t.ord - 1 < greatest(me.answered,
                               coalesce((select answered from public.battle_players
                                         where battle_id = b.id and user_id = v_other), 0))
  ), '[]'::jsonb);
end;
$$;

-- Host creates single-use links once they've finished their own run.
create or replace function public.challenge_links_create(p_battle uuid, p_count integer default 1)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.battles;
  h public.battle_players;
  v_existing integer;
  v_tokens text[] := '{}';
  v_token text;
  i integer;
begin
  perform public._try_settle(p_battle);
  select * into b from public.battles where id = p_battle;
  select * into h from public.battle_players where battle_id = p_battle and user_id = auth.uid() and role = 'host';
  if b.kind is distinct from 'challenge' or h.user_id is null then
    raise exception 'not_your_challenge';
  end if;
  if h.finished_at is null then
    raise exception 'finish_first';
  end if;
  if now() > b.deadline_at then
    raise exception 'expired';
  end if;
  select count(*) into v_existing from public.challenge_links where battle_id = p_battle;
  if v_existing + greatest(1, p_count) > 20 then
    raise exception 'too_many_links';
  end if;

  for i in 1..greatest(1, least(p_count, 20)) loop
    v_token := translate(encode(extensions.gen_random_bytes(9), 'base64'), '+/', '-_');
    insert into public.challenge_links (token, battle_id) values (v_token, p_battle);
    v_tokens := v_tokens || v_token;
  end loop;
  return jsonb_build_object('tokens', to_jsonb(v_tokens), 'expires_at', b.deadline_at);
end;
$$;

-- Host's view of their links: who played each one.
create or replace function public.challenge_links_list(p_battle uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.battle_players
                 where battle_id = p_battle and user_id = auth.uid() and role = 'host') then
    raise exception 'not_your_challenge';
  end if;
  perform public._try_settle(p_battle);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'token', l.token,
      'created_at', l.created_at,
      'claimed', l.claimed_by is not null,
      'player', case when l.claimed_by is not null then public._identity(l.claimed_by) end,
      'finished', bp.finished_at is not null,
      'score', bp.score,
      'outcome', bp.outcome
    ) order by l.created_at)
    from public.challenge_links l
    left join public.battle_players bp on bp.battle_id = l.battle_id and bp.user_id = l.claimed_by
    where l.battle_id = p_battle
  ), '[]'::jsonb);
end;
$$;

-- What someone opening a link sees before deciding to play. Works signed out.
create or replace function public.challenge_peek(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  l public.challenge_links;
  b public.battles;
  h public.battle_players;
  v_status text;
begin
  select * into l from public.challenge_links where token = p_token;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  select * into b from public.battles where id = l.battle_id;
  select * into h from public.battle_players where battle_id = b.id and role = 'host';

  v_status := case
    when auth.uid() is not null and l.claimed_by = auth.uid() then 'yours'
    when auth.uid() is not null and b.created_by = auth.uid() then 'own_challenge'
    when l.claimed_by is not null then 'used'
    when b.deadline_at is null or now() > b.deadline_at then 'expired'
    else 'open'
  end;

  return jsonb_build_object(
    'status', v_status,
    'battle_id', case when v_status = 'yours' then b.id end,
    'host', public._identity(h.user_id),
    'host_score', h.score,
    'host_answered', h.answered,
    'mode', b.mode,
    'category_id', b.category_id,
    'rated', b.rated,
    'question_count', case when b.mode = 'rapid' then null else cardinality(b.question_ids) end,
    'expires_at', b.deadline_at);
end;
$$;

-- Uses up a link for the caller (guest or account). One link = one player, once.
create or replace function public.challenge_claim(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.battle_profiles := public._me();
  l public.challenge_links;
  b public.battles;
begin
  select * into l from public.challenge_links where token = p_token for update;
  if not found then
    raise exception 'not_found';
  end if;
  select * into b from public.battles where id = l.battle_id;

  if l.claimed_by = me.user_id then
    return b.id; -- already theirs: resume
  end if;
  if b.created_by = me.user_id then
    raise exception 'own_challenge';
  end if;
  if l.claimed_by is not null then
    raise exception 'used';
  end if;
  if b.deadline_at is null or now() > b.deadline_at then
    raise exception 'expired';
  end if;
  if exists (select 1 from public.battle_players where battle_id = b.id and user_id = me.user_id) then
    raise exception 'already_played';
  end if;

  update public.challenge_links set claimed_by = me.user_id, claimed_at = now() where token = p_token;
  insert into public.battle_players (battle_id, user_id, role, rating_before)
  values (b.id, me.user_id, 'challenger', me.rating);
  return b.id;
end;
$$;

-- Live matchmaking. Poll every ~2s: each call keeps you in the queue and tries
-- to pair you with someone on the same mode/category/rated setting whose rating
-- is within a window that widens the longer you wait.
create or replace function public.mm_search(p_mode text, p_category text, p_rated boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.battle_profiles := public._me();
  q public.match_queue;
  o public.match_queue;
  v_have boolean;
  v_waited integer;
  v_window integer;
  v_id uuid;
  v_cfg record;
begin
  if p_mode not in ('rapid', 'blitz', 'marathon') or public._category_predicate(p_category) is null then
    raise exception 'invalid_settings';
  end if;

  delete from public.match_queue
  where last_seen_at < now() - interval '2 minutes' and matched_battle_id is null;

  select * into q from public.match_queue where user_id = me.user_id for update;
  v_have := found;
  if v_have and q.matched_battle_id is not null then
    delete from public.match_queue where user_id = me.user_id;
    return jsonb_build_object('battle_id', q.matched_battle_id);
  end if;
  if v_have and (q.mode <> p_mode or q.category_id <> p_category or q.rated <> p_rated) then
    delete from public.match_queue where user_id = me.user_id;
    v_have := false;
  end if;
  if not v_have then
    insert into public.match_queue (user_id, mode, category_id, rated, rating)
    values (me.user_id, p_mode, p_category, p_rated, me.rating)
    returning * into q;
  else
    update public.match_queue set last_seen_at = now() where user_id = me.user_id;
  end if;

  v_waited := extract(epoch from (now() - q.enqueued_at))::integer;
  v_window := least(600, 100 + 15 * v_waited);

  select * into o from public.match_queue
  where user_id <> me.user_id and mode = p_mode and category_id = p_category and rated = p_rated
    and matched_battle_id is null and last_seen_at > now() - interval '8 seconds'
    and abs(rating - me.rating) <= v_window
  order by abs(rating - me.rating), enqueued_at
  limit 1
  for update skip locked;

  if not found then
    return jsonb_build_object('searching', true, 'waited_sec', v_waited, 'window', v_window);
  end if;

  v_cfg := public._mode_cfg(p_mode);
  insert into public.battles (kind, rated, mode, category_id, question_ids, created_by, deadline_at)
  values ('live', p_rated, p_mode, p_category,
          public._pick_questions(p_category, v_cfg.q_count, (me.rating + o.rating) / 2),
          me.user_id, now() + make_interval(secs => v_cfg.limit_sec + 90))
  returning id into v_id;
  insert into public.battle_players (battle_id, user_id, role, rating_before) values
    (v_id, me.user_id, 'host', me.rating),
    (v_id, o.user_id, 'opponent', (select rating from public.battle_profiles where user_id = o.user_id));
  update public.match_queue set matched_battle_id = v_id where user_id = o.user_id;
  delete from public.match_queue where user_id = me.user_id;
  return jsonb_build_object('battle_id', v_id);
end;
$$;

-- Leave the queue. If a match was made in the meantime it is returned so the
-- client can still join it (leaving it would forfeit).
create or replace function public.mm_cancel()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  q public.match_queue;
begin
  delete from public.match_queue where user_id = auth.uid() returning * into q;
  return jsonb_build_object('battle_id', q.matched_battle_id);
end;
$$;

-- The caller's battle log.
create or replace function public.my_battles(p_limit integer default 20)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  -- Settle anything of ours that has run out of time.
  for r in
    select bp.battle_id from public.battle_players bp
    join public.battles b on b.id = bp.battle_id
    where bp.user_id = auth.uid() and b.status = 'active' and b.kind = 'live' and now() > b.deadline_at
  loop
    perform public._try_settle(r.battle_id);
  end loop;

  return coalesce((
    select jsonb_agg(x.item order by x.joined_at desc)
    from (
      select bp.joined_at, jsonb_build_object(
        'battle_id', b.id,
        'kind', b.kind,
        'rated', b.rated,
        'mode', b.mode,
        'category_id', b.category_id,
        'role', bp.role,
        'score', bp.score,
        'answered', bp.answered,
        'finished', bp.finished_at is not null,
        'outcome', bp.outcome,
        'rating_delta', bp.rating_delta,
        'played_at', coalesce(bp.started_at, bp.joined_at),
        'opponent', case
          when b.kind = 'bot' then public._bot_identity(b.bot_id)
            || jsonb_build_object('score', (select count(*) filter (where correct)
                                            from public.battle_bot_answers
                                            where battle_id = b.id and q_index < bp.answered))
          when b.kind = 'live' or bp.role = 'challenger' then
            (select public._identity(o.user_id) || jsonb_build_object('score', o.score)
             from public.battle_players o
             where o.battle_id = b.id and o.user_id <> bp.user_id
               and (b.kind = 'live' or o.role = 'host'))
        end,
        'challengers', case when b.kind = 'challenge' and bp.role = 'host' then
          (select count(*) from public.battle_players c where c.battle_id = b.id and c.role = 'challenger')
        end
      ) as item
      from public.battle_players bp
      join public.battles b on b.id = bp.battle_id
      where bp.user_id = auth.uid()
      order by bp.joined_at desc
      limit least(greatest(p_limit, 1), 100)
    ) x
  ), '[]'::jsonb);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Function privileges
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare
  f text;
begin
  -- Internal helpers: nobody but the definer.
  foreach f in array array[
    '_mode_cfg(text)', '_category_predicate(text)', '_rank_key(integer)',
    '_elo(integer, integer, numeric, integer)', '_pick_questions(text, integer, integer)', '_me()',
    '_apply_rating(uuid, integer, text)', '_outcome(integer, integer)',
    '_player_deadline(public.battles, public.battle_players)', '_generate_bot_answers(uuid)',
    '_try_settle(uuid)', '_serve(public.battles, public.battle_players)', '_identity(uuid)',
    '_bot_identity(text)', '_state(uuid)', '_rating_of(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
  end loop;

  -- Signed-in players (accounts and guests).
  foreach f in array array[
    'ensure_battle_profile()', 'merge_guest(text)', 'battle_create_bot(text, text, text)',
    'challenge_create(text, text, boolean)', 'battle_play(uuid)', 'battle_answer(uuid, integer, text)',
    'battle_finish(uuid)', 'battle_state(uuid)', 'battle_review(uuid)',
    'challenge_links_create(uuid, integer)', 'challenge_links_list(uuid)', 'challenge_claim(text)',
    'mm_search(text, text, boolean)', 'mm_cancel()', 'my_battles(integer)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;

  -- Anyone, including signed-out visitors opening a link.
  execute 'revoke all on function public.challenge_peek(text) from public';
  execute 'grant execute on function public.challenge_peek(text) to anon, authenticated';
end;
$$;
