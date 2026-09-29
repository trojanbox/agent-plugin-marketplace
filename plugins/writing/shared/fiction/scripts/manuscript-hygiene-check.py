#!/usr/bin/env python3
"""Deterministic text-hygiene checks for fiction manuscript Markdown.

This script does not judge prose quality. It reports mechanical issues only.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
from pathlib import Path
import re
import sys

NUMBERED_CHAPTER = re.compile(r"^(\d{3})\.md$")
SPACE_BEFORE_CJK_PUNCT = re.compile(r"[ \t]+[，。！？；：、]", re.UNICODE)
SPACE_AFTER_CJK_PUNCT = re.compile(r"[。！？；：”）】》」』] +(?=[\u3400-\u9fffA-Za-z0-9“‘（【《*])", re.UNICODE)
TRAILING_WHITESPACE = re.compile(r"[ \t]+$")


def collect_files(paths: list[Path]) -> list[Path]:
    files: list[Path] = []
    for path in paths:
        if path.is_dir():
            files.extend(p for p in path.rglob("*.md") if p.is_file())
        elif path.is_file():
            files.append(path)
        else:
            raise FileNotFoundError(path)
    return sorted(set(files))


def line_number(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def check_file(path: Path, text: str) -> list[str]:
    issues: list[str] = []
    for match in SPACE_BEFORE_CJK_PUNCT.finditer(text):
        issues.append(f"SPACE_BEFORE_CJK_PUNCT {path}:{line_number(text, match.start())}")
    for match in SPACE_AFTER_CJK_PUNCT.finditer(text):
        issues.append(f"SPACE_AFTER_CJK_PUNCT {path}:{line_number(text, match.start())}")
    for no, line in enumerate(text.splitlines(), 1):
        if TRAILING_WHITESPACE.search(line):
            issues.append(f"TRAILING_WHITESPACE {path}:{no}")

    open_quotes = text.count("“")
    close_quotes = text.count("”")
    if open_quotes != close_quotes:
        issues.append(f"UNBALANCED_DOUBLE_QUOTE {path}: count={open_quotes}/{close_quotes}")

    if NUMBERED_CHAPTER.match(path.name):
        h1 = [line for line in text.splitlines() if line.startswith("# ")]
        if len(h1) != 1:
            issues.append(f"CHAPTER_H1_COUNT {path}: count={len(h1)}")
    return issues


def check_sequences(files: list[Path]) -> list[str]:
    by_parent: dict[Path, list[int]] = defaultdict(list)
    for path in files:
        match = NUMBERED_CHAPTER.match(path.name)
        if match:
            by_parent[path.parent].append(int(match.group(1)))

    issues: list[str] = []
    for parent, nums in sorted(by_parent.items(), key=lambda x: str(x[0])):
        nums = sorted(set(nums))
        if len(nums) < 2:
            continue
        expected = list(range(nums[0], nums[-1] + 1))
        if nums != expected:
            missing = [n for n in expected if n not in nums]
            issues.append(f"CHAPTER_SEQUENCE_GAP {parent}: missing={','.join(f'{n:03d}' for n in missing)}")
    return issues


def check_expected_ending(files: list[Path], penultimate: str | None, final: str | None) -> list[str]:
    if not penultimate and not final:
        return []
    numbered = [(int(m.group(1)), p) for p in files if (m := NUMBERED_CHAPTER.match(p.name))]
    if not numbered:
        return ["EXPECTED_ENDING_NO_NUMBERED_CHAPTER"]
    _, path = max(numbered)
    lines = [line for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    issues: list[str] = []
    if final and (not lines or lines[-1] != final):
        actual = lines[-1] if lines else "<empty>"
        issues.append(f"FINAL_LINE_MISMATCH {path}: expected={final!r} actual={actual!r}")
    if penultimate and (len(lines) < 2 or lines[-2] != penultimate):
        actual = lines[-2] if len(lines) >= 2 else "<missing>"
        issues.append(f"PENULTIMATE_LINE_MISMATCH {path}: expected={penultimate!r} actual={actual!r}")
    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", type=Path)
    parser.add_argument("--expect-penultimate-line")
    parser.add_argument("--expect-final-line")
    args = parser.parse_args()

    try:
        files = collect_files(args.paths)
    except FileNotFoundError as exc:
        print(f"PATH_NOT_FOUND {exc}")
        return 2

    issues: list[str] = []
    for path in files:
        text = path.read_text(encoding="utf-8")
        issues.extend(check_file(path, text))
    issues.extend(check_sequences(files))
    issues.extend(check_expected_ending(files, args.expect_penultimate_line, args.expect_final_line))

    if issues:
        for issue in issues:
            print(issue)
        print(f"FAILED issues={len(issues)} files={len(files)}")
        return 1

    print(f"OK files={len(files)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
