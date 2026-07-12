# Mantis

Open, structured JSON dataset of previous-year questions (PYQs) for **NEET-PG** and **INI-CET**,
sourced from publicly available papers and official answer keys.

## Scope

- **NEET-PG**: 10 papers, one per year, 2017–2026.
- **INI-CET**: 13 papers — two sessions/year for 2020–2025 (12 papers) plus the 2026 session-1
  paper that happened this year (the 13th).

## Folder structure

```
pyq/
  <year>/
    neetpg/
      _session.json         # exam metadata for this paper
      q001.json, q002.json, ...
    inicet-1/                # first session of that year
      _session.json
      q001.json, ...
    inicet-2/                # second session of that year
      _session.json
      q001.json, ...
  schema/
    question.schema.json     # JSON Schema for a single question
    subjects.json            # canonical subject code list
  _template/
    question.template.json   # copy this to start a new question file
  scripts/
    scaffold.py               # (re)generates the year/exam folder tree
    validate.py                # checks question files against the schema, no deps
```

`_session.json` is a stub written by `scaffold.py`; fill in `month`, `total_questions`, and
`official_answer_key_url` as each paper is added, and flip `status` to `in-progress` /
`complete`.

> The exact month(s) for each INI-CET session are left blank (`month: null`) in the generated
> stubs — INI-CET scheduling has shifted across years and shouldn't be guessed. Fill it in from
> the official notification for that session, and feel free to rename the `inicet-1` /
> `inicet-2` folders to include the month once confirmed (e.g. `inicet-1-january`).

## Question JSON shape

See [`pyq/schema/question.schema.json`](pyq/schema/question.schema.json) for the full schema and
[`pyq/_template/question.template.json`](pyq/_template/question.template.json) for a filled-in
example. Summary of fields:

| field | description |
|---|---|
| `id` | unique id, e.g. `neetpg-2024-q001` |
| `exam` | `neetpg` or `inicet` |
| `year` | exam year |
| `session` | `1` / `2` for inicet, `null` for neetpg |
| `question` | question text |
| `attachment` | images/diagrams/tables/figures attached to the question stem |
| `options` | `{A, B, C, D}` |
| `correct_option` | one of `A`/`B`/`C`/`D` |
| `explanation` | `{ text, attachments }` — why the correct option is right and why each distractor is wrong, including any explanation figures |
| `subject` | array, one or more of the codes in `schema/subjects.json` |
| `topic` | array, at least as many entries as `subject` |
| `subtopic` | array, subtopics of the topics above |
| `difficulty` | integer 1–5 |
| `tags` | question-type tags, e.g. `image-based`, `diagnostic`, `recall-based` |

### Subjects

`anatomy`, `biochemistry`, `physiology`, `pharmacology`, `pathology`, `microbiology`, `fmt`,
`psm`, `ophthalmology`, `ent`, `medicine`, `surgery`, `obgyn`, `pediatrics`, `anaesthesia`,
`psychiatry`, `orthopedics`, `dermatology`, `radiology`.

(Note: corrected `pysch` → `psychiatry` in the canonical list.)

## Adding a question

1. Copy `pyq/_template/question.template.json` into the right `pyq/<year>/<exam>/` folder,
   rename it (e.g. `q014.json`).
2. Fill in every field. Put any image/diagram/table under an `assets/` folder alongside the
   question files and reference it by relative path in `attachment` / `explanation.attachments`.
3. Run `python pyq/scripts/validate.py` before committing.

## Adding a new year/session

Edit the year ranges at the top of `pyq/scripts/scaffold.py` and re-run it — it only adds
missing folders/stubs and never touches existing question files.

## Sourcing & attribution

All questions/answer keys included here are drawn from material already public (official
answer keys and widely circulated exam papers). If you add a paper, note its source in that
session's `_session.json` (`official_answer_key_url`).
