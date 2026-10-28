"""Anki deck generator: deterministic spec, real APKG and revision regression tests.

The integration tests require the Skill's scripts/requirements.txt in PYTHONPATH
(or installed into the Python environment); they are explicitly skipped otherwise.
"""
from __future__ import annotations

import copy
import importlib.util
import json
import os
import sqlite3
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "plugins/education/skills/anki-deck-builder"
SCRIPTS = SKILL / "scripts"
sys.path.insert(0, str(SCRIPTS))

from deck_spec import (  # noqa: E402
    DeckSpecError, cloze_ordinals, html_field, load_spec, numeric_id,
    validate_revision, validate_spec,
)


def sample_spec() -> dict:
    return {
        "deck_id": "economic-basics",
        "deck_name": "经济学 · 基础",
        "cards": [
            {
                "id": "C001", "type": "basic",
                "front": "机会成本的定义是什么？",
                "back": "放弃的最佳替代方案的价值。",
                "extra": "不限于直接花费。",
                "source": {"kind": "conversation", "title": "经济学讨论"},
                "tags": ["经济学", "基础概念"],
            },
            {
                "id": "C002", "type": "cloze",
                "front": "价格受 {{c1::需求}} 和 {{c2::供给}} 的共同影响。",
                "back": "简化的供需模型。",
                "source": {"kind": "material", "title": "经济学笔记", "locator": "## 供需"},
                "evidence": {"status": "source_only"},
            },
            {
                "id": "C003", "type": "reversed",
                "front": "apple", "back": "苹果",
                "source": {"kind": "material", "title": "英语生词表"},
                "tags": ["英语"],
            },
        ],
    }


class SpecValidationTests(unittest.TestCase):
    def test_basic_cloze_reverse_count_and_stable_numeric_identity(self):
        from deck_spec import expected_ordinals
        spec = validate_spec(sample_spec())
        self.assertEqual([len(expected_ordinals(c)) for c in spec["cards"]], [1, 2, 2])
        self.assertEqual(numeric_id("deck", spec["deck_id"]),
                         numeric_id("deck", spec["deck_id"]))
        self.assertNotEqual(numeric_id("model", "basic"), numeric_id("model", "cloze"))
        self.assertEqual(cloze_ordinals("A {{c1::x}} and {{c1::y}}"), [0])

    def test_invalid_and_incomplete_clozes_rejected(self):
        for front in (
            "missing markup", "{{c1::}}", "{{c1::no close}",
            "{{c0::zero}}", "{{c1::one}} {{c3::three}}",
            "{{c999999999999999999::huge number}}",
        ):
            with self.subTest(front=front):
                spec = sample_spec()
                spec["cards"][1]["front"] = front
                with self.assertRaises(DeckSpecError):
                    validate_spec(spec)

    def test_duplicate_note_id_and_duplicate_front_rejected(self):
        for field in ("id", "front"):
            with self.subTest(field=field):
                spec = sample_spec()
                spec["cards"][2][field] = spec["cards"][0][field]
                if field == "front":
                    spec["cards"][2]["type"] = "basic"
                with self.assertRaises(DeckSpecError):
                    validate_spec(spec)

    def test_uncertain_evidence_cannot_be_exported(self):
        spec = sample_spec()
        spec["cards"][0]["evidence"] = {"status": "uncertain", "details": "来源待核查"}
        with self.assertRaisesRegex(DeckSpecError, "uncertain"):
            validate_spec(spec)
        self.assertEqual(validate_spec(spec, for_export=False)["cards"][0]["id"], "C001")

    def test_external_verification_claim_requires_traceable_evidence(self):
        spec = sample_spec()
        spec["cards"][0]["evidence"] = {"status": "externally_checked"}
        with self.assertRaisesRegex(DeckSpecError, "no evidence details"):
            validate_spec(spec)
        spec["cards"][0]["evidence"]["details"] = "核查说明与真实来源链接（示例）"
        validate_spec(spec)

    def test_source_and_tag_constraints(self):
        for case in ("missing source", "bad kind", "bad tags", "empty title"):
            spec = sample_spec()
            card = spec["cards"][0]
            if case == "missing source":
                card.pop("source")
            elif case == "bad kind":
                card["source"]["kind"] = "web"
            elif case == "bad tags":
                card["tags"] = ["two words"]
            elif case == "empty title":
                card["source"]["title"] = " "
            with self.subTest(case=case), self.assertRaises(DeckSpecError):
                validate_spec(spec)

    def test_rejects_hierarchical_deck_and_unsupported_fields(self):
        spec = sample_spec()
        spec["deck_name"] = "经济学::股票"
        with self.assertRaisesRegex(DeckSpecError, "single-level"):
            validate_spec(spec)
        spec = sample_spec()
        spec["unknown"] = "do not silently discard"
        with self.assertRaises(DeckSpecError):
            validate_spec(spec)

    def test_revisions_preserve_types_and_deck_identity(self):
        old = sample_spec()
        revised = copy.deepcopy(old)
        revised["cards"][0]["back"] = "已经更正的定义"
        revised["cards"].pop(2)
        self.assertEqual(validate_revision(old, revised), ["C003"])
        revised["cards"][0]["type"] = "reversed"
        with self.assertRaisesRegex(DeckSpecError, "changed type"):
            validate_revision(old, revised)
        revised = copy.deepcopy(old)
        revised["deck_id"] = "different-deck"
        with self.assertRaisesRegex(DeckSpecError, "deck_id changed"):
            validate_revision(old, revised)
        revised = copy.deepcopy(old)
        revised["cards"][0]["id"] = "c001"
        with self.assertRaisesRegex(DeckSpecError, "changed case"):
            validate_revision(old, revised)

    def test_unhashable_input_and_excess_tags_are_cleanly_rejected(self):
        for field in ("type", "kind", "status", "tags"):
            data = sample_spec()
            card = data["cards"][0]
            if field == "type":
                card["type"] = ["basic"]
            elif field == "kind":
                card["source"]["kind"] = ["material"]
            elif field == "status":
                card["evidence"] = {"status": ["uncertain"]}
            else:
                card["tags"] = [f"tag{i}" for i in range(51)]
            with self.subTest(field=field), self.assertRaises(DeckSpecError):
                validate_spec(data)

    def test_html_input_is_escaped_before_packaging(self):
        text = "<img src=x onerror=alert(1)>&"
        result = html_field(text)
        self.assertIn("&lt;img", result)
        self.assertNotIn("<img", result)
        self.assertIn("&amp;", result)

    def test_new_semantic_route_cases_and_neighbor_boundaries(self):
        import csv
        p = ROOT / "plugins/ai-workflow/skills/skill-system-design/references/semantic-routing-regression.csv"
        with p.open(encoding="utf-8", newline="") as f:
            rows = list(csv.DictReader(f))
        self.assertEqual(len(rows), len({row["id"] for row in rows}))
        chosen = [row for row in rows if row["id"].startswith("EDU")
                  and int(row["id"][3:]) >= 47]
        self.assertGreaterEqual(len(chosen), 20)
        self.assertTrue({"positive", "negative", "gate", "multi-turn",
                         "composition", "conflict", "adversarial"}.issubset(
                             {row["bucket"] for row in chosen}))
        self.assertTrue(all("education/anki-deck-builder" in row["expected"]
                            for row in chosen if row["bucket"] in
                            {"positive", "composition", "multi-turn", "gate", "adversarial"}))
        doc = (ROOT / "tests/education-v12-anki-semantic-routing-eval.md").read_text(encoding="utf8")
        self.assertIn("PASS_CONFLICT", doc)
        self.assertIn("PASS_COMPOSITION", doc)
        self.assertIn("人工规则层", doc)

    def test_schema_and_skill_express_review_gate_and_boundaries(self):
        schema = json.loads((SKILL / "schemas/cards.schema.json").read_text(encoding="utf-8"))
        self.assertEqual(schema["properties"]["cards"]["minItems"], 1)
        self.assertEqual(set(schema["properties"]["cards"]["items"]["properties"]["type"]["enum"]),
                         {"basic", "cloze", "reversed"})
        skill = (SKILL / "SKILL.md").read_text(encoding="utf-8")
        for expected in (
            "明确确认", "全部候选卡", "按章节/主题分批完整展示",
            "research/deep-research", "不假设可访问整个历史对话",
            "cards.json", "validate_deck.py", "不会自动删除",
        ):
            self.assertIn(expected, skill)
        self.assertNotIn("AnkiConnect 安装", skill)


def run_script(script: str, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPTS / script), *map(str, args)],
        cwd=ROOT, text=True, capture_output=True, check=False,
    )


@unittest.skipUnless(importlib.util.find_spec("genanki"), "install scripts/requirements.txt")
class PackageIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="anki-deck-test-")
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name)
        self.spec = self.path / "cards.json"
        self.output = self.path / "deck.apkg"
        self.spec.write_text(json.dumps(sample_spec(), ensure_ascii=False), encoding="utf-8")

    def build(self, *options):
        return run_script("build_deck.py", self.spec, "--output", self.output, *options)

    @staticmethod
    def read_collection(path: Path) -> sqlite3.Connection:
        with zipfile.ZipFile(path) as archive:
            sqlite_data = archive.read("collection.anki2")
        conn = sqlite3.connect(":memory:")
        # SQLite deserialization works on Python 3.11+, fallback through a temporary copy.
        conn.deserialize(sqlite_data)
        return conn

    def test_build_approved_json_and_verify_actual_apkg(self):
        built = self.build()
        self.assertEqual(built.returncode, 0, built.stderr)
        summary = json.loads(built.stdout)
        self.assertEqual(summary["notes"], 3)
        self.assertEqual(summary["review_cards"], 5)
        verified = run_script("validate_deck.py", self.output, "--source", self.spec)
        self.assertEqual(verified.returncode, 0, verified.stderr)
        with self.read_collection(self.output) as conn:
            self.assertEqual(conn.execute("SELECT count(*) FROM notes").fetchone()[0], 3)
            self.assertEqual(conn.execute("SELECT count(*) FROM cards").fetchone()[0], 5)
            cols = conn.execute("SELECT flds FROM notes").fetchall()
            self.assertTrue(any("经济学讨论" in row[0] for row in cols))

    def test_guids_stay_stable_after_content_correction(self):
        first = self.build()
        self.assertEqual(first.returncode, 0, first.stderr)
        with self.read_collection(self.output) as conn:
            before = {guid for (guid,) in conn.execute("SELECT guid FROM notes")}
        doc = json.loads(self.spec.read_text(encoding="utf-8"))
        doc["cards"][0]["front"] = "机会成本如何定义？"
        doc["cards"][0]["back"] = "更新后：所放弃的最佳替代选项价值。"
        self.spec.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
        updated = self.build("--force")
        self.assertEqual(updated.returncode, 0, updated.stderr)
        with self.read_collection(self.output) as conn:
            after = {guid for (guid,) in conn.execute("SELECT guid FROM notes")}
        self.assertEqual(before, after)

    def test_unsafe_or_invalid_input_never_overwrites_existing_package(self):
        self.assertEqual(self.build().returncode, 0)
        before = self.output.read_bytes()
        doc = json.loads(self.spec.read_text(encoding="utf-8"))
        doc["cards"][0]["evidence"] = {"status": "uncertain"}
        self.spec.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
        failed = self.build("--force")
        self.assertNotEqual(failed.returncode, 0)
        self.assertIn("uncertain", failed.stderr)
        self.assertEqual(before, self.output.read_bytes())

    def test_explicit_force_required_when_file_exists(self):
        self.assertEqual(self.build().returncode, 0)
        result = self.build()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("--force", result.stderr)

    def test_previous_json_type_change_is_rejected(self):
        previous = self.path / "previous.json"
        previous.write_bytes(self.spec.read_bytes())
        doc = json.loads(self.spec.read_text(encoding="utf-8"))
        doc["cards"][0]["type"] = "reversed"
        self.spec.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
        result = self.build("--previous", previous)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("changed type", result.stderr)
        self.assertFalse(self.output.exists())

    def test_removed_note_is_reported_without_claiming_anki_deletion(self):
        previous = self.path / "previous.json"
        previous.write_bytes(self.spec.read_bytes())
        doc = json.loads(self.spec.read_text(encoding="utf-8"))
        doc["cards"] = doc["cards"][:2]
        self.spec.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
        result = self.build("--previous", previous)
        self.assertEqual(result.returncode, 0, result.stderr)
        summary = json.loads(result.stdout)
        self.assertEqual(summary["removed_from_source"], ["C003"])
        self.assertIn("manual deletion", summary["warning"])

    def test_corrupted_apkg_fails_validation(self):
        self.output.write_bytes(b"not a zip or a SQLite collection")
        result = run_script("validate_deck.py", self.output, "--source", self.spec)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("APKG", result.stderr)

    def test_wrong_approved_source_cannot_validate_old_package(self):
        self.assertEqual(self.build().returncode, 0)
        doc = json.loads(self.spec.read_text(encoding="utf-8"))
        doc["cards"][0]["back"] = "篡改过的答案"
        self.spec.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
        result = run_script("validate_deck.py", self.output, "--source", self.spec)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("content differs", result.stderr)

    def test_tags_and_external_html_in_package(self):
        doc = json.loads(self.spec.read_text(encoding="utf-8"))
        doc["cards"][0]["extra"] = "<script>alert(1)</script>"
        self.spec.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
        self.assertEqual(self.build().returncode, 0)
        with self.read_collection(self.output) as conn:
            fields = [row[0] for row in conn.execute("SELECT flds FROM notes")]
        self.assertTrue(any("&lt;script&gt;" in s for s in fields))
        self.assertFalse(any("<script>" in s for s in fields))


if __name__ == "__main__":
    unittest.main()
