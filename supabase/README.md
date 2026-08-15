# Supabase provisioning

Milestone 1 ships the schema and an ingestion script; you provision the project.

## 1. Create the project

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → API** → copy the **Project URL**, **anon public** key, and
   **service_role** key.
3. In the repo root, copy `.env.example` to `.env.local` and paste the values.

## 2. Apply the schema

Open **SQL Editor** in the Supabase dashboard and run, in order, the contents of
[`migrations/0001_init.sql`](migrations/0001_init.sql) then
[`migrations/0002_grants.sql`](migrations/0002_grants.sql). (Or, with the Supabase CLI:
`supabase link` then `supabase db push`.)

`0001_init.sql` creates the tables, RLS policies, the privacy-safe `leaderboard_battle`
view, and the `handle_new_user` trigger that provisions a `profiles` row (and a
`battle_profiles` row when a battle username was chosen at signup).

`0002_grants.sql` is required too: RLS policies alone don't make a table reachable via
the API — PostgREST also needs the base SQL `GRANT` for the `anon`/`authenticated`/
`service_role` roles, and this project doesn't inherit Supabase's usual defaults for
objects created via the SQL editor. Without it you'll see `permission denied for table
...` errors even though the RLS policy looks correct.

## 3. Enable auth providers

- **Email**: Authentication → Providers → Email (on by default). For local testing you
  may turn **Confirm email** off so signups return a session immediately.
- **Google**: Authentication → Providers → Google. Add your Google OAuth **Client ID /
  Secret**, and add these redirect URLs (Authentication → URL Configuration):
  - `http://localhost:3001/auth/callback` (local dev)
  - `https://YOUR-DOMAIN/auth/callback` (production)

## 4. Ingest MedMCQA questions

The Battle question bank is sourced from **MedMCQA** ([medmcqa/medmcqa](https://github.com/medmcqa/medmcqa))
behind a `QuestionProvider` abstraction (`features/battle/question-provider`), so the
source can be swapped later.

1. Download the dataset. Options:
   - Official: the [medmcqa/medmcqa README](https://github.com/medmcqa/medmcqa#data-download-and-preprocessing)
     links a Google Drive archive of the raw train/dev/test data (CSV/JSON), or
   - Hugging Face mirror: `openlifescienceai/medmcqa` (export the `train` split to JSONL).
   Convert/save as **JSONL** (one JSON object per line) and point `MEDMCQA_FILE` in
   `.env.local` at it (default `./scripts/data/medmcqa-train.jsonl`).
2. Run the ingestion:

   ```bash
   npm run ingest:medmcqa
   ```

   It upserts in batches, is idempotent on `(source, source_id)`, and maps MedMCQA
   fields to our subject taxonomy.

### Data format notes

- `cop` (correct option) is **1-indexed** in both the official data and the Hugging
  Face mirror (`1`→A, `2`→B, `3`→C, `4`→D) — confirmed against the official repo's
  `dataset.py` (`label = cop - 1`) and the published example record. The script maps
  this correctly; if you source data from elsewhere, verify this before ingesting.
- Rows with `choice_type: "multi"` (multiple correct answers) are **skipped** — our
  schema stores a single `correct_option`, so multi-answer rows can't be represented
  and would corrupt grading if ingested.
- Rows whose `subject_name` doesn't map to our taxonomy (e.g. `Dental`) are skipped.

### Known gap — difficulty

MedMCQA has no difficulty label. The script assigns a configurable heuristic (default
`medium`). Difficulty-aware selection (`lib/config/difficulty.ts`) will use real labels
once we add them (original bank) or infer them from battle answer statistics.

## Attribution

MedMCQA is released for research use; retain its citation/attribution when publishing.
See the dataset card for license terms.
