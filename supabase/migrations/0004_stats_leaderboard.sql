-- Mantis — 0004: player stats + leaderboards (read-only functions)
-- Run once in the Supabase SQL editor, after 0003. Safe to re-run.
--
-- Battle answers are not readable by clients (0003), so Home / Profile stats
-- and the weekly leaderboard are computed here. Days are counted in IST.

-- Caller's study stats from battle play.
create or replace function public.my_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_total integer;
  v_correct integer;
  v_today_count integer;
  v_streak integer := 0;
  v_day date;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select count(*) filter (where selected is not null),
         count(*) filter (where correct),
         count(*) filter (where selected is not null
                          and (answered_at at time zone 'Asia/Kolkata')::date = v_today)
  into v_total, v_correct, v_today_count
  from public.battle_answers
  where user_id = auth.uid();

  -- Consecutive days with at least one answer, ending today (or yesterday,
  -- so the streak isn't shown as broken before today's first question).
  v_day := case when v_today_count > 0 then v_today else v_today - 1 end;
  while exists (
    select 1 from public.battle_answers
    where user_id = auth.uid() and selected is not null
      and (answered_at at time zone 'Asia/Kolkata')::date = v_day
  ) loop
    v_streak := v_streak + 1;
    v_day := v_day - 1;
  end loop;

  return jsonb_build_object(
    'answered_total', v_total,
    'correct_total', v_correct,
    'answered_today', v_today_count,
    'day_streak', v_streak
  );
end;
$$;

-- Leaderboard. p_period: 'all' = by rating, 'week' = rating gained in the last
-- 7 days of rated play. Guests are never listed. Returns the top rows plus the
-- caller's own row (with position) when they have a non-guest profile.
create or replace function public.leaderboard(p_period text default 'all', p_limit integer default 50)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
  v_rows jsonb;
  v_me jsonb;
begin
  if p_period = 'week' then
    with gains as (
      -- A challenge host's rating_delta already totals every challenger's result.
      select bp.user_id, sum(bp.rating_delta)::integer as gain
      from public.battle_players bp
      join public.battles b on b.id = bp.battle_id
      where b.rated and bp.rating_delta is not null and bp.joined_at > now() - interval '7 days'
      group by bp.user_id
    ),
    ranked as (
      select p.user_id, p.battle_username, p.rating, p.rank_key, g.gain,
             rank() over (order by g.gain desc, p.rating desc) as pos
      from gains g
      join public.battle_profiles p on p.user_id = g.user_id
      where not p.is_guest
    )
    select
      (select coalesce(jsonb_agg(jsonb_build_object('position', pos, 'username', battle_username, 'rating', rating,
                                                    'rank_key', rank_key, 'value', gain, 'me', user_id = auth.uid())
                                 order by pos), '[]'::jsonb)
       from (select * from ranked order by pos limit v_limit) t),
      (select jsonb_build_object('position', pos, 'username', battle_username, 'rating', rating,
                                 'rank_key', rank_key, 'value', gain, 'me', true)
       from ranked where user_id = auth.uid())
    into v_rows, v_me;
  else
    with ranked as (
      select user_id, battle_username, rating, rank_key,
             rank() over (order by rating desc, games desc) as pos
      from public.battle_profiles
      where not is_guest
    )
    select
      (select coalesce(jsonb_agg(jsonb_build_object('position', pos, 'username', battle_username, 'rating', rating,
                                                    'rank_key', rank_key, 'value', rating, 'me', user_id = auth.uid())
                                 order by pos), '[]'::jsonb)
       from (select * from ranked order by pos limit v_limit) t),
      (select jsonb_build_object('position', pos, 'username', battle_username, 'rating', rating,
                                 'rank_key', rank_key, 'value', rating, 'me', true)
       from ranked where user_id = auth.uid())
    into v_rows, v_me;
  end if;

  return jsonb_build_object('period', case when p_period = 'week' then 'week' else 'all' end,
                            'rows', v_rows, 'me', v_me);
end;
$$;

revoke all on function public.my_stats() from public, anon;
grant execute on function public.my_stats() to authenticated;
revoke all on function public.leaderboard(text, integer) from public;
grant execute on function public.leaderboard(text, integer) to anon, authenticated;
