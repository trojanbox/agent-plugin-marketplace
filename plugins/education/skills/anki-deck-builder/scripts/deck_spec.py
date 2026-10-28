"""Pure-stdlib input validation and stable identifiers for the Anki builder."""

from __future__ import annotations

import hashlib
import html
import json
import re
from pathlib import Path
from typing import Any

DECK_ID = re.compile(r"^[a-z0-9][a-z0-9._-]{2,127}$")
NOTE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$")
CLOZE_OPEN = re.compile(r"\{\{c[0-9]+::")
CLOZE = re.compile(r"\{\{c([1-9][0-9]*)::((?:(?!\}\}).)+?)\}\}", re.DOTALL)
SUPPORTED_TYPES = {"basic", "cloze", "reversed"}


class DeckSpecError(ValueError):
    """Rejected input; the file must not be packaged or published."""


def _require_keys(value: Any, required: set[str], allowed: set[str], where: str) -> dict:
    if not isinstance(value, dict):
        raise DeckSpecError(f"{where} must be a JSON object")
    missing = required - value.keys()
    extra = value.keys() - allowed
    if missing:
        raise DeckSpecError(f"{where} missing: {', '.join(sorted(missing))}")
    if extra:
        raise DeckSpecError(f"{where} has unsupported fields: {', '.join(sorted(extra))}")
    return value


def _text(value: Any, where: str, *, required: bool = True, limit: int = 4000) -> str:
    if not isinstance(value, str):
        raise DeckSpecError(f"{where} must be text")
    if required and not value.strip():
        raise DeckSpecError(f"{where} must not be empty")
    if len(value) > limit:
        raise DeckSpecError(f"{where} exceeds {limit} characters")
    if "\x00" in value or "\x1f" in value:
        raise DeckSpecError(f"{where} contains a reserved control character")
    return value


def cloze_ordinals(front: str) -> list[int]:
    """Return zero-based Anki card ordinals, one per distinct cloze number."""
    matches = list(CLOZE.finditer(front))
    if len(CLOZE_OPEN.findall(front)) != len(matches) or not matches:
        raise DeckSpecError("cloze front must contain complete {{c1::answer}} markup")
    nums: set[int] = set()
    for match in matches:
        answer = match.group(2).split("::", 1)[0]
        if not answer.strip():
            raise DeckSpecError("cloze answer must not be empty")
        nums.add(int(match.group(1)))
    if len(nums) > 20 or max(nums) > 20 or nums != set(range(1, max(nums) + 1)):
        raise DeckSpecError("cloze numbers must be contiguous c1..cN (at most 20)")
    return [n - 1 for n in sorted(nums)]


def expected_ordinals(note: dict) -> list[int]:
    typ = note["type"]
    if typ == "cloze":
        return cloze_ordinals(note["front"])
    return [0, 1] if typ == "reversed" else [0]


def numeric_id(namespace: str, name: str) -> int:
    """Stable positive 63-bit numeric ID for models/decks, not from display text."""
    raw = hashlib.sha256(f"education/anki-deck-builder/v1/{namespace}/{name}".encode("utf-8")).digest()
    return int.from_bytes(raw[:8], "big") & 0x7FFF_FFFF_FFFF_FFFF or 1


def html_field(value: str) -> str:
    """Treat card content as plain text; never execute supplied HTML."""
    return html.escape(value, quote=True).replace("\r\n", "\n").replace("\n", "<br>")


def source_label(source: dict) -> str:
    title = source["title"].strip()
    locator = source.get("locator", "").strip()
    return title + (f" · {locator}" if locator else "")


def validate_spec(raw: Any, *, for_export: bool = True) -> dict:
    doc = _require_keys(raw, {"deck_id", "deck_name", "cards"},
                        {"deck_id", "deck_name", "cards"}, "deck")
    deck_id = _text(doc["deck_id"], "deck_id", limit=128)
    if not DECK_ID.fullmatch(deck_id):
        raise DeckSpecError("deck_id must be a stable ASCII slug (min 3 characters)")
    name = _text(doc["deck_name"], "deck_name", limit=160)
    if "::" in name or "\n" in name or "\r" in name:
        raise DeckSpecError("deck_name must be a single-level Anki deck (no '::' or newlines)")
    cards = doc["cards"]
    if not isinstance(cards, list) or not 1 <= len(cards) <= 2000:
        raise DeckSpecError("cards must be an array with 1..2000 notes")

    ids: set[str] = set()
    fronts: set[tuple[str, str]] = set()
    for index, card in enumerate(cards, start=1):
        where = f"cards[{index}]"
        _require_keys(card, {"id", "type", "front", "back", "source"},
                      {"id", "type", "front", "back", "extra", "tags", "source", "evidence"}, where)
        card_id = _text(card["id"], where + ".id", limit=64)
        if not NOTE_ID.fullmatch(card_id):
            raise DeckSpecError(f"{where}.id contains invalid characters")
        if card_id.casefold() in ids:
            raise DeckSpecError(f"duplicate note id: {card_id}")
        ids.add(card_id.casefold())
        typ = card["type"]
        if not isinstance(typ, str) or typ not in SUPPORTED_TYPES:
            raise DeckSpecError(f"{where}.type must be basic, cloze, or reversed")
        front = _text(card["front"], where + ".front")
        _text(card["back"], where + ".back", required=(typ != "cloze"))
        _text(card.get("extra", ""), where + ".extra", required=False)
        if typ == "cloze":
            cloze_ordinals(front)
        elif CLOZE_OPEN.search(front):
            raise DeckSpecError(f"{where} uses Cloze markup with non-cloze type")
        normalized = re.sub(r"\s+", "", front).casefold()
        fingerprint = (typ, normalized)
        if fingerprint in fronts:
            raise DeckSpecError(f"duplicate card front in {where}")
        fronts.add(fingerprint)

        tags = card.get("tags", [])
        if not isinstance(tags, list) or len(tags) > 50:
            raise DeckSpecError(f"{where}.tags must be a list of at most 50 tags")
        seen_tags: set[str] = set()
        for tag in tags:
            _text(tag, where + ".tags[]", limit=100)
            if re.search(r"\s", tag):
                raise DeckSpecError(f"{where}.tags must not include whitespace")
            if tag.casefold() in seen_tags:
                raise DeckSpecError(f"{where} has duplicate tags")
            seen_tags.add(tag.casefold())
        source = _require_keys(card["source"], {"kind", "title"},
                               {"kind", "title", "locator"}, where + ".source")
        if not isinstance(source["kind"], str) or source["kind"] not in {"material", "conversation"}:
            raise DeckSpecError(f"{where}.source.kind must be material or conversation")
        _text(source["title"], where + ".source.title", limit=250)
        _text(source.get("locator", ""), where + ".source.locator", required=False, limit=350)

        if "evidence" in card:
            evidence = _require_keys(card["evidence"], {"status"},
                                     {"status", "details"}, where + ".evidence")
            if not isinstance(evidence["status"], str) or evidence["status"] not in {"source_only", "externally_checked", "uncertain"}:
                raise DeckSpecError(f"{where}.evidence.status is unsupported")
            _text(evidence.get("details", ""), where + ".evidence.details",
                  required=False, limit=2000)
            if evidence["status"] == "externally_checked" and not evidence.get("details", "").strip():
                raise DeckSpecError(f"{where} marked externally_checked but has no evidence details")
            if for_export and evidence["status"] == "uncertain":
                raise DeckSpecError(f"{where} has uncertain evidence; exclude or verify before export")
    return doc


def load_spec(path: Path, *, for_export: bool = True) -> dict:
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise DeckSpecError(f"unable to read cards.json: {exc}") from exc
    return validate_spec(raw, for_export=for_export)


def validate_revision(previous: dict, current: dict) -> list[str]:
    if previous["deck_id"] != current["deck_id"]:
        raise DeckSpecError("deck_id changed from previous version; old notes cannot be reliably updated")
    original = {card["id"]: card for card in previous["cards"]}
    now = {card["id"]: card for card in current["cards"]}
    original_names = {ident.casefold(): ident for ident in original}
    new_names = {ident.casefold(): ident for ident in now}
    for folded in original_names.keys() & new_names.keys():
        if original_names[folded] != new_names[folded]:
            raise DeckSpecError(f"note id changed case: {original_names[folded]} -> {new_names[folded]}")
    for note_id in original.keys() & now.keys():
        if original[note_id]["type"] != now[note_id]["type"]:
            raise DeckSpecError(f"note {note_id} changed type; assign a new id instead")
    return sorted(original.keys() - now.keys())
