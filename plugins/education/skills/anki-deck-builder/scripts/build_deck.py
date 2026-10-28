#!/usr/bin/env python3
"""Create a verified, independent Anki .apkg from approved cards.json."""

from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from pathlib import Path

from deck_spec import (
    DeckSpecError, expected_ordinals, html_field, load_spec, numeric_id,
    source_label, validate_revision,
)

CSS = """
.card { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", sans-serif;
        font-size: 20px; text-align: left; color: #222; background: #fff; line-height: 1.5; }
.extra { font-size: 16px; margin-top: 16px; color: #555; }
.source { font-size: 13px; margin-top: 20px; color: #777; }
"""
BACK_ADDITION = (
    "{{#Extra}}<div class=\"extra\">{{Extra}}</div>{{/Extra}}"
    "{{#Source}}<div class=\"source\">来源：{{Source}}</div>{{/Source}}"
)


def make_models(genanki) -> dict:
    return {
        "basic": genanki.Model(
            numeric_id("model", "basic"), "Education Anki Basic v1",
            fields=[{"name": field} for field in ("Front", "Back", "Extra", "Source")],
            templates=[{"name": "Question", "qfmt": "{{Front}}",
                        "afmt": "{{FrontSide}}<hr id=\"answer\">{{Back}}" + BACK_ADDITION}],
            css=CSS,
        ),
        "reversed": genanki.Model(
            numeric_id("model", "reversed"), "Education Anki Reversed v1",
            fields=[{"name": field} for field in ("Front", "Back", "Extra", "Source")],
            templates=[
                {"name": "Forward", "qfmt": "{{Front}}",
                 "afmt": "{{FrontSide}}<hr id=\"answer\">{{Back}}" + BACK_ADDITION},
                {"name": "Reverse", "qfmt": "{{Back}}",
                 "afmt": "{{FrontSide}}<hr id=\"answer\">{{Front}}" + BACK_ADDITION},
            ],
            css=CSS,
        ),
        "cloze": genanki.Model(
            numeric_id("model", "cloze"), "Education Anki Cloze v1",
            fields=[{"name": field} for field in ("Text", "Back", "Extra", "Source")],
            templates=[{"name": "Cloze", "qfmt": "{{cloze:Text}}",
                        "afmt": "{{cloze:Text}}<hr id=\"answer\">{{Back}}" + BACK_ADDITION}],
            model_type=genanki.Model.CLOZE, css=CSS,
        ),
    }


def create_package(data: dict, target: Path) -> int:
    try:
        import genanki
    except ImportError as exc:
        raise DeckSpecError("genanki is not installed; run: python3 -m pip install -r scripts/requirements.txt") from exc

    deck = genanki.Deck(numeric_id("deck", data["deck_id"]), data["deck_name"])
    models = make_models(genanki)
    for card in data["cards"]:
        fields = [
            html_field(card["front"]), html_field(card["back"]),
            html_field(card.get("extra", "")), html_field(source_label(card["source"])),
        ]
        deck.add_note(genanki.Note(
            model=models[card["type"]],
            fields=fields,
            tags=card.get("tags", []),
            guid=genanki.guid_for("education/anki-deck-builder/v1", data["deck_id"], card["id"]),
        ))
    genanki.Package(deck).write_to_file(str(target))
    return sum(len(expected_ordinals(note)) for note in data["cards"])


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("source", type=Path, help="user-approved cards.json")
    p.add_argument("--output", required=True, type=Path, help="target .apkg file")
    p.add_argument("--previous", type=Path, help="previous approved cards.json for a revision")
    p.add_argument("--force", action="store_true", help="explicitly replace the target file")
    args = p.parse_args(argv)

    try:
        spec = load_spec(args.source)
        removed = []
        if args.previous:
            previous = load_spec(args.previous, for_export=False)
            removed = validate_revision(previous, spec)
        output = args.output.resolve()
        if output.suffix.lower() != ".apkg":
            raise DeckSpecError("output must have a .apkg extension")
        if not output.parent.is_dir():
            raise DeckSpecError(f"output directory does not exist: {output.parent}")
        if output.exists() and not args.force:
            raise DeckSpecError(f"output already exists; use --force explicitly: {output}")
        with tempfile.TemporaryDirectory(prefix=".anki-build-", dir=output.parent) as tmpdir:
            candidate = Path(tmpdir) / "verified.apkg"
            expected = create_package(spec, candidate)
            from validate_deck import inspect_package
            info = inspect_package(candidate, spec)
            if info["review_cards"] != expected:
                raise DeckSpecError("generated package review-card count differs from expected")
            os.replace(candidate, output)
        print(json.dumps({
            "ok": True, "output": str(output), "deck_name": spec["deck_name"],
            "notes": len(spec["cards"]), "review_cards": expected,
            "removed_from_source": removed,
            "warning": ("Removed notes remain in an existing Anki collection after importing "
                        "the new APKG; manual deletion may be needed.") if removed else None,
        }, ensure_ascii=False))
        return 0
    except (DeckSpecError, OSError, ValueError) as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
