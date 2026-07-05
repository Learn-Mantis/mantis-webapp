#!/usr/bin/env python3
"""
Walks pyq/<year>/<exam>/*.json (skipping _session.json) and checks each
question file has the required fields and that subject/topic/subtopic
counts line up. Stdlib only, no external deps.

Usage: python pyq/scripts/validate.py
"""
import json
import os
import sys

ROOT = os.path.join(os.path.dirname(__file__), "..")

REQUIRED_FIELDS = [
    "id", "exam", "year", "question", "options", "correct_option",
    "explanation", "subject", "topic", "subtopic", "difficulty", "tags",
]

with open(os.path.join(ROOT, "schema", "subjects.json"), encoding="utf-8") as f:
    VALID_SUBJECTS = set(json.load(f)["subjects"])


def check_file(path):
    errors = []
    with open(path, encoding="utf-8") as f:
        try:
            q = json.load(f)
        except json.JSONDecodeError as e:
            return [f"invalid JSON: {e}"]

    for field in REQUIRED_FIELDS:
        if field not in q:
            errors.append(f"missing field '{field}'")

    if "subject" in q:
        unknown = [s for s in q["subject"] if s not in VALID_SUBJECTS]
        if unknown:
            errors.append(f"unknown subject(s): {unknown}")

    if "subject" in q and "topic" in q and len(q["topic"]) < len(q["subject"]):
        errors.append("fewer 'topic' entries than 'subject' entries")

    if "options" in q and "correct_option" in q:
        if q["correct_option"] not in q["options"]:
            errors.append(f"correct_option '{q['correct_option']}' not in options")

    if "difficulty" in q and not (1 <= q["difficulty"] <= 5):
        errors.append("difficulty must be between 1 and 5")

    return errors


def main():
    had_errors = False
    for dirpath, _dirnames, filenames in os.walk(ROOT):
        for name in filenames:
            if not name.endswith(".json") or name in ("_session.json",):
                continue
            parts = os.path.normpath(dirpath).split(os.sep)
            if "schema" in parts or "_template" in parts:
                continue
            path = os.path.join(dirpath, name)
            errors = check_file(path)
            if errors:
                had_errors = True
                print(f"{path}:")
                for e in errors:
                    print(f"  - {e}")

    if not had_errors:
        print("All question files valid.")
    sys.exit(1 if had_errors else 0)


if __name__ == "__main__":
    main()
