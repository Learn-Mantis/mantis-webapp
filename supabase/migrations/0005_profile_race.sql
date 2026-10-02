-- Mantis — 0005: make ensure_battle_profile safe under concurrent calls.
-- Run once in the Supabase SQL editor, after 0004. Safe to re-run.
--
-- Two simultaneous first calls for the same new player used to collide on the
-- primary key; the handler mistook that for a taken username, retried 20 times
-- and failed. Now an existing profile row is simply picked up.

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
        -- A concurrent call may have created the row already: keep theirs.
        insert into public.battle_profiles (user_id, battle_username, avatar_key, is_guest)
        values (v_uid, v_name, 'default', v_anon)
        on conflict (user_id) do nothing;
        exit;
      exception when unique_violation then
        -- username taken, try another
      end;
    end loop;
    select * into v from public.battle_profiles where user_id = v_uid;
    if not found then
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

revoke all on function public.ensure_battle_profile() from public, anon;
grant execute on function public.ensure_battle_profile() to authenticated;
