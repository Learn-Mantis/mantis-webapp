-- Mantis — initial schema (Milestone 1)
-- Run in the Supabase SQL editor, or via `supabase db push` with the CLI.
-- Privacy model: `profiles` holds real identity (owner-only RLS). `battle_profiles`
-- is the pseudonymous competitive identity (publicly readable) and carries a
-- denormalized geo copy so leaderboards never touch real identity.

-- ─────────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────────
create type difficulty as enum ('easy', 'medium', 'hard');
create type correct_option as enum ('A', 'B', 'C', 'D');
create type question_source as enum ('medmcqa', 'pyq', 'original');

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles (real identity — private)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  country text,
  state text,
  college text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by their owner"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- battle_profiles (pseudonymous competitive identity — public read)
-- Geo columns are denormalized (non-identifying) so leaderboards avoid `profiles`.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.battle_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  battle_username text not null unique,
  avatar_key text not null default '🦉',
  rating integer not null default 1000,
  highest_rating integer not null default 1000,
  games integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  current_streak integer not null default 0,
  rank_key text not null default 'resident',
  country text,
  state text,
  college text,
  username_changed_at timestamptz,
  avatar_changed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.battle_profiles enable row level security;

-- Public read exposes only battle identity + geo (never a real name).
create policy "Battle profiles are publicly readable"
  on public.battle_profiles for select using (true);
create policy "Users manage their own battle profile"
  on public.battle_profiles for insert with check (auth.uid() = user_id);
create policy "Users update their own battle profile"
  on public.battle_profiles for update using (auth.uid() = user_id);

create index battle_profiles_rating_idx on public.battle_profiles (rating desc);
create index battle_profiles_username_idx on public.battle_profiles (lower(battle_username));

-- ─────────────────────────────────────────────────────────────────────────────
-- follows (social — search/follow only by battle username)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.follows (
  follower_user_id uuid not null references auth.users (id) on delete cascade,
  following_battle_profile_id uuid not null references public.battle_profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_user_id, following_battle_profile_id)
);

alter table public.follows enable row level security;

create policy "Users can view their own follows"
  on public.follows for select using (auth.uid() = follower_user_id);
create policy "Users can follow"
  on public.follows for insert with check (auth.uid() = follower_user_id);
create policy "Users can unfollow"
  on public.follows for delete using (auth.uid() = follower_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- questions (ingested from MedMCQA; provider-agnostic)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  source question_source not null,
  source_id text not null,
  question text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option correct_option not null,
  explanation text,
  subject text not null,
  subject_group text,
  topic text,
  subtopic text,
  difficulty difficulty not null default 'medium',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (source, source_id)
);

alter table public.questions enable row level security;

-- Readable by signed-in users; writes happen only via the service role (ingestion).
create policy "Questions readable by authenticated users"
  on public.questions for select to authenticated using (true);

create index questions_subject_idx on public.questions (subject);
create index questions_group_diff_idx on public.questions (subject_group, difficulty);

-- ─────────────────────────────────────────────────────────────────────────────
-- Flashcards (schema now; study/community wired in Phase 3)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  description text,
  subject text,
  is_official boolean not null default false,
  is_public boolean not null default false,
  card_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.decks enable row level security;

create policy "Public or official or owned decks are readable"
  on public.decks for select using (is_public or is_official or auth.uid() = owner_user_id);
create policy "Users create their own decks"
  on public.decks for insert with check (auth.uid() = owner_user_id);
create policy "Users update their own decks"
  on public.decks for update using (auth.uid() = owner_user_id);
create policy "Users delete their own decks"
  on public.decks for delete using (auth.uid() = owner_user_id);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  front text not null,
  back text not null,
  explanation text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.cards enable row level security;

create policy "Cards follow their deck's visibility"
  on public.cards for select using (
    exists (
      select 1 from public.decks d
      where d.id = cards.deck_id
        and (d.is_public or d.is_official or d.owner_user_id = auth.uid())
    )
  );
create policy "Users manage cards in their own decks"
  on public.cards for all using (
    exists (select 1 from public.decks d where d.id = cards.deck_id and d.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from public.decks d where d.id = cards.deck_id and d.owner_user_id = auth.uid())
  );

create table public.deck_saves (
  user_id uuid not null references auth.users (id) on delete cascade,
  deck_id uuid not null references public.decks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, deck_id)
);

alter table public.deck_saves enable row level security;

create policy "Users view their saves" on public.deck_saves for select using (auth.uid() = user_id);
create policy "Users add saves" on public.deck_saves for insert with check (auth.uid() = user_id);
create policy "Users remove saves" on public.deck_saves for delete using (auth.uid() = user_id);

create table public.card_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  ease numeric not null default 2.5,
  interval_days integer not null default 0,
  repetitions integer not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, card_id)
);

alter table public.card_reviews enable row level security;

create policy "Users manage their own reviews"
  on public.card_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Leaderboard view (privacy-safe: battle identity + geo only, never real names)
-- ─────────────────────────────────────────────────────────────────────────────
create view public.leaderboard_battle as
  select battle_username, avatar_key, rating, rank_key, country, state, college
  from public.battle_profiles;

grant select on public.leaderboard_battle to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- New-user trigger: create profile (+ battle profile when a username was chosen)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := new.raw_user_meta_data;
begin
  insert into public.profiles (id, email, full_name, country, state, college)
  values (
    new.id,
    new.email,
    coalesce(meta ->> 'full_name', meta ->> 'name'),
    meta ->> 'country',
    meta ->> 'state',
    meta ->> 'college'
  )
  on conflict (id) do nothing;

  -- Battle profile is created only when a battle username was provided at signup.
  -- OAuth users (no username yet) complete this later in-app.
  if coalesce(meta ->> 'battle_username', '') <> '' then
    insert into public.battle_profiles (user_id, battle_username, avatar_key, country, state, college)
    values (
      new.id,
      meta ->> 'battle_username',
      coalesce(meta ->> 'avatar_key', '🦉'),
      meta ->> 'country',
      meta ->> 'state',
      meta ->> 'college'
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
