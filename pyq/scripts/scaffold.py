#!/usr/bin/env python3
"""
Regenerates the pyq/<year>/<exam> folder tree with a _session.json
metadata stub in every leaf folder. Safe to re-run: existing question
files are never touched, only missing folders/_session.json stubs are
added.

Edit NEETPG_YEARS / INICET_YEARS below as new papers are released.
"""
import json
import os

ROOT = os.path.join(os.path.dirname(__file__), "..")

# NEET-PG: one paper a year.
NEETPG_YEARS = list(range(2017, 2027))  # 2017..2026 inclusive -> 10 papers

# INI-CET: two sessions a year. 2020..2025 gives 12 papers; 2026 session 1
# is the extra 13th paper ("happened this year").
INICET_YEARS = list(range(2020, 2026))  # 2020..2025 inclusive
INICET_EXTRA = [(2026, 1)]  # additional session(s) beyond the 6-year window


def write_session_stub(path, exam, year, session):
    os.makedirs(path, exist_ok=True)
    meta_path = os.path.join(path, "_session.json")
    if os.path.exists(meta_path):
        return  # don't clobber a folder that's already been filled in
    stub = {
        "exam": exam,
        "year": year,
        "session": session,
        "month": None,  # TODO: fill in once the exact exam month is confirmed
        "total_questions": None,
        "official_answer_key_url": None,
        "status": "pending",  # pending | in-progress | complete
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(stub, f, indent=2)
        f.write("\n")


def main():
    for year in NEETPG_YEARS:
        write_session_stub(os.path.join(ROOT, str(year), "neetpg"), "neetpg", year, None)

    for year in INICET_YEARS:
        for session in (1, 2):
            write_session_stub(
                os.path.join(ROOT, str(year), f"inicet-{session}"), "inicet", year, session
            )

    for year, session in INICET_EXTRA:
        write_session_stub(
            os.path.join(ROOT, str(year), f"inicet-{session}"), "inicet", year, session
        )


if __name__ == "__main__":
    main()
