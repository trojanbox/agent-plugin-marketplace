#!/usr/bin/env python3
"""Verify .apkg integrity, note identities, content and exact review-card counts."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import tempfile
import zipfile
from collections import defaultdict
from pathlib import Path

from deck_spec import (
    DeckSpecError, expected_ordinals, html_field, load_spec, numeric_id,
    source_label,
)


def inspect_package(apkg: Path, spec: dict) -> dict:
    try:
        import genanki
    except ImportError as exc:
        raise DeckSpecError("genanki is required for GUID verification; install scripts/requirements.txt") from exc
    try:
        with zipfile.ZipFile(apkg) as archive:
            members = archive.namelist()
            if len(members) != len(set(members)):
                raise DeckSpecError("APKG contains duplicate ZIP members")
            if set(members) != {"collection.anki2", "media"}:
                raise DeckSpecError("APKG must contain only collection.anki2 and an empty media map")
            if archive.getinfo("collection.anki2").file_size > 100 * 1024 * 1024:
                raise DeckSpecError("APKG collection database is unexpectedly large")
            bad_member = archive.testzip()
            if bad_member:
                raise DeckSpecError(f"APKG CRC failure: {bad_member}")
            if json.loads(archive.read("media")) != {}:
                raise DeckSpecError("V1 package unexpectedly contains media")
            contents = archive.read("collection.anki2")
    except (zipfile.BadZipFile, KeyError, ValueError, OSError) as exc:
        raise DeckSpecError(f"invalid APKG archive: {exc}") from exc

    with tempfile.TemporaryDirectory(prefix="anki-inspect-") as tmpdir:
        db_path = Path(tmpdir) / "collection.anki2"
        db_path.write_bytes(contents)
        try:
            with sqlite3.connect(f"file:{db_path}?mode=ro", uri=True) as conn:
                if conn.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                    raise DeckSpecError("APKG SQLite integrity check failed")
                deck_json = conn.execute("SELECT decks FROM col LIMIT 1").fetchone()
                if not deck_json:
                    raise DeckSpecError("Anki collection metadata missing")
                decks = json.loads(deck_json[0])
                did = numeric_id("deck", spec["deck_id"])
                target = decks.get(str(did))
                if not target or target.get("name") != spec["deck_name"]:
                    raise DeckSpecError("deck ID/name do not match cards.json")
                notes = conn.execute("SELECT id, guid, mid, flds, tags FROM notes").fetchall()
                rows = conn.execute("SELECT nid, ord, did FROM cards").fetchall()
        except (sqlite3.DatabaseError, TypeError, IndexError, ValueError) as exc:
            raise DeckSpecError(f"invalid APKG SQLite collection: {exc}") from exc

    if len(notes) != len(spec["cards"]):
        raise DeckSpecError(f"note count mismatch: {len(notes)} != {len(spec['cards'])}")
    expected = {}
    for card in spec["cards"]:
        guid = genanki.guid_for("education/anki-deck-builder/v1", spec["deck_id"], card["id"])
        if guid in expected:
            raise DeckSpecError("duplicate stable Anki GUID")
        expected[guid] = card

    by_guid = {}
    for nid, guid, mid, fields, stored_tags in notes:
        if guid in by_guid or guid not in expected:
            raise DeckSpecError("unexpected or duplicate Anki GUID")
        card = expected[guid]
        if mid != numeric_id("model", card["type"]):
            raise DeckSpecError(f"note {card['id']} has a different model ID")
        actual = fields.split("\x1f")
        wanted = [
            html_field(card["front"]), html_field(card["back"]),
            html_field(card.get("extra", "")), html_field(source_label(card["source"])),
        ]
        if actual != wanted:
            raise DeckSpecError(f"note {card['id']} content differs from approved JSON")
        if sorted(stored_tags.split()) != sorted(card.get("tags", [])):
            raise DeckSpecError(f"note {card['id']} tags differ from approved JSON")
        by_guid[guid] = (nid, card)
    if len(by_guid) != len(expected):
        raise DeckSpecError("approved notes missing from APKG")

    card_ords: dict[int, list[int]] = defaultdict(list)
    for nid, ordinal, deck_id in rows:
        if deck_id != numeric_id("deck", spec["deck_id"]):
            raise DeckSpecError("card assigned to wrong deck")
        card_ords[nid].append(ordinal)
    for nid, card in by_guid.values():
        if sorted(card_ords.pop(nid, [])) != expected_ordinals(card):
            raise DeckSpecError(f"review-card ordinals incorrect for note {card['id']}")
    if card_ords:
        raise DeckSpecError("APKG contains orphan cards")

    expected_count = sum(len(expected_ordinals(c)) for c in spec["cards"])
    if len(rows) != expected_count:
        raise DeckSpecError("APKG review-card count mismatch")
    return {"ok": True, "notes": len(notes), "review_cards": len(rows), "deck_name": spec["deck_name"]}


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("apkg", type=Path)
    p.add_argument("--source", required=True, type=Path, help="approved cards.json")
    args = p.parse_args(argv)
    try:
        info = inspect_package(args.apkg, load_spec(args.source))
        print(json.dumps(info, ensure_ascii=False))
        return 0
    except (DeckSpecError, OSError, ValueError) as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
