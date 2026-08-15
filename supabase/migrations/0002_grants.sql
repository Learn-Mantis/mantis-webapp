-- Mantis — base table/view privilege grants
-- RLS policies alone don't make a table reachable via PostgREST: the API roles
-- (anon, authenticated, service_role) also need the underlying SQL GRANT. This
-- project didn't inherit Supabase's usual default privileges on objects created
-- via the SQL editor, so every grant below is explicit, matching the access
-- model each table's RLS policies already encode.

grant usage on schema public to anon, authenticated, service_role;

-- profiles: real identity, owner-only, no guest access
grant select, insert, update on public.profiles to authenticated;

-- battle_profiles: pseudonymous identity, publicly readable (guest + signed-in)
grant select on public.battle_profiles to anon, authenticated;
grant insert, update on public.battle_profiles to authenticated;

-- follows: owner-only
grant select, insert, delete on public.follows to authenticated;

-- questions: browsable by all users; written only by ingestion (service_role)
grant select on public.questions to anon, authenticated;
grant select, insert, update, delete on public.questions to service_role;

-- decks: public/official decks browsable as guest; writes require ownership
grant select on public.decks to anon, authenticated;
grant insert, update, delete on public.decks to authenticated;

-- cards: visibility follows their deck (guest-browsable when the deck is)
grant select on public.cards to anon, authenticated;
grant insert, update, delete on public.cards to authenticated;

-- deck_saves, card_reviews: owner-only, signed-in only
grant select, insert, delete on public.deck_saves to authenticated;
grant select, insert, update on public.card_reviews to authenticated;

-- leaderboard_battle view: extend the 0001 authenticated grant to guests too
grant select on public.leaderboard_battle to anon, authenticated;

-- Ensure service_role has full schema control for ingestion and admin tasks
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;
