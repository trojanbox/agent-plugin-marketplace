"""Contract regression for the linked anthology / casefile series Skill."""

from __future__ import annotations

import csv
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WRITING = ROOT / "plugins" / "writing"
SKILLS = WRITING / "skills"
SKILL = SKILLS / "fiction-linked-anthology-design" / "SKILL.md"
REFERENCE = SKILL.parent / "references" / "series-ledgers.md"
REGRESSION = (
    ROOT
    / "plugins/ai-workflow/skills/skill-system-design/references/"
    / "semantic-routing-regression.csv"
)


def runtime(*args: str) -> dict:
    result = subprocess.run(
        ["node", str(ROOT / "skill-runtime.js"), *args],
        cwd=ROOT,
        check=True,
        text=True,
        capture_output=True,
    )
    return json.loads(result.stdout)


class FictionLinkedAnthologyContractTests(unittest.TestCase):
    def test_public_skill_is_discoverable_and_grouped(self):
        manifest = json.loads((WRITING / "plugin.json").read_text(encoding="utf-8"))
        self.assertIn("fiction-linked-anthology-design", manifest["groups"]["fiction"])
        self.assertEqual(
            manifest["groups"]["fiction"].count("fiction-linked-anthology-design"), 1
        )
        skill = runtime("skill", "writing/fiction-linked-anthology-design")["skill"]
        self.assertEqual(skill["visibility"], "workflow")
        self.assertEqual(skill["phase"], "architecture")
        self.assertEqual(skill["uses"], [])
        self.assertIn("github/github-issue-manager", skill["optionalUses"])

    def test_contract_protects_unit_and_series_levels(self):
        content = SKILL.read_text(encoding="utf-8")
        ref = REFERENCE.read_text(encoding="utf-8")
        self.assertLessEqual(len(content), 5000)
        self.assertLessEqual(len(ref), 6000)
        for key in [
            "单篇叙事发动机",
            "双层信息边界",
            "Series Contract",
            "Unit Ledger",
            "Throughline / Reveal Ledger",
            "Reader Gate",
            "creative_open",
        ]:
            self.assertIn(key, content)
        for key in ["单篇读者", "系列读者", "主线", "不机械规定"]:
            self.assertIn(key, ref)
        self.assertIn("references/series-ledgers.md", content)
        self.assertIn("Skill Composition", content)

    def test_neighbors_apply_only_when_cross_unit_information_matters(self):
        discussion = runtime("skill", "writing/fiction-discussion")["skill"]
        outline = runtime("skill", "writing/fiction-outline")["skill"]
        readiness = runtime("skill", "writing/fiction-manuscript-readiness")["skill"]
        continuity = runtime("skill", "writing/fiction-continuity-review")["skill"]
        name = "writing/fiction-linked-anthology-design"
        for skill in [discussion, outline, readiness, continuity]:
            self.assertIn(name, skill["optionalUses"])
        draft = runtime("skill", "writing/fiction-manuscript-drafting")["skill"]
        self.assertIn("writing/fiction-manuscript-readiness", draft["uses"])
        for neighbor in [
            "fiction-discussion",
            "fiction-outline",
            "fiction-manuscript-readiness",
            "fiction-continuity-review",
        ]:
            content = (SKILLS / neighbor / "SKILL.md").read_text(encoding="utf-8")
            self.assertIn(name, content)
            self.assertIn("##", content)

    def test_semantic_route_regression_cases_are_preserved(self):
        with REGRESSION.open(encoding="utf-8", newline="") as stream:
            rows = list(csv.DictReader(stream))
        anthology = [row for row in rows if row["id"].startswith("ANTH")]
        self.assertEqual(len(anthology), 20)
        self.assertEqual(len({row["id"] for row in anthology}), 20)
        buckets = {row["bucket"] for row in anthology}
        for bucket in [
            "positive",
            "negative",
            "composition",
            "conflict",
            "multi-turn",
            "adversarial",
        ]:
            self.assertIn(bucket, buckets)
        self.assertTrue((ROOT / "tests/fiction-linked-anthology-semantic-routing-eval.md").is_file())


if __name__ == "__main__":
    unittest.main()
