"""Physical Skill count expectations independent of the Runtime's JSON output.

Feature tests should keep asserting their own exact identities. Global counts
are derived from the real source tree so adding an unrelated Plugin does not
silently require changing every feature's expected constant.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def public_skill_count() -> int:
    return len(list((ROOT / "plugins").glob("*/skills/*/SKILL.md")))


def internal_skill_count() -> int:
    return len(list((ROOT / "plugins").glob("*/internal-skills/*/SKILL.md")))


def total_skill_count() -> int:
    return public_skill_count() + internal_skill_count()
