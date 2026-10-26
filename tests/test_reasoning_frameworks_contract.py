from __future__ import annotations

import csv
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REASONING = ROOT / "plugins" / "reasoning"
REGRESSION = (
    ROOT / "plugins" / "ai-workflow" / "skills" / "skill-system-design"
    / "references" / "semantic-routing-regression.csv"
)


def runtime_json(*args: str) -> dict:
    result = subprocess.run(
        ["node", str(ROOT / "skill-runtime.js"), *args, "--json"],
        cwd=ROOT, check=True, capture_output=True, text=True,
    )
    return json.loads(result.stdout)


class ReasoningFrameworkContractTests(unittest.TestCase):
    def test_five_public_skills_are_discoverable(self) -> None:
        listing = runtime_json("list", "reasoning")
        self.assertEqual(listing["publicSkillCount"], 5)
        self.assertEqual(listing["internalSkillCount"], 0)
        names = {item["name"] for item in listing["ungroupedSkills"]}
        self.assertEqual(names, {
            "divergent-ideation", "scientific-reasoning", "structured-debate",
            "first-principles", "systems-thinking",
        })
        catalog_ids = {item["id"] for item in runtime_json("catalog")["skills"]}
        for name in ("first-principles", "systems-thinking"):
            self.assertIn(f"reasoning/{name}", catalog_ids)
            skill = runtime_json("skill", f"reasoning/{name}")["skill"]
            self.assertEqual(skill["plugin"], "reasoning")
            self.assertEqual(skill["phase"], "analysis")
            self.assertEqual(skill["visibility"], "workflow")
            self.assertEqual(skill["uses"], [])
            self.assertEqual(
                skill["optionalUses"],
                ["reasoning/scientific-reasoning", "research/deep-research"],
            )
            self.assertTrue(skill["path"].endswith(
                f"plugins/reasoning/skills/{name}/SKILL.md"
            ))

    def test_distinct_workflows_have_true_neighbors_and_on_demand_references(self) -> None:
        first = (
            REASONING / "skills" / "first-principles" / "SKILL.md"
        ).read_text(encoding="utf-8")
        system = (
            REASONING / "skills" / "systems-thinking" / "SKILL.md"
        ).read_text(encoding="utf-8")
        science = (
            REASONING / "skills" / "scientific-reasoning" / "SKILL.md"
        ).read_text(encoding="utf-8")
        for token in ("约束分层", "剥离与重建", "现实回填", "验证与修正"):
            self.assertIn(token, first)
        for token in ("反馈回路", "反身性专项", "随时间推演", "干预与观察"):
            self.assertIn(token, system)
        for document, neighbors in (
            (first, ("scientific-reasoning", "systems-thinking")),
            (system, ("scientific-reasoning", "first-principles")),
            (science, ("first-principles", "systems-thinking")),
        ):
            for neighbor in neighbors:
                self.assertIn(neighbor, document)
        for name, ref in (
            ("first-principles", "decomposition-and-reconstruction.md"),
            ("systems-thinking", "feedback-and-reflexivity.md"),
        ):
            self.assertIn(f"references/{ref}", (
                REASONING / "skills" / name / "SKILL.md"
            ).read_text(encoding="utf-8"))
            self.assertTrue((REASONING / "skills" / name / "references" / ref).is_file())
        self.assertIn("反身性", system)
        self.assertIn("条件", first)

    def test_new_semantic_regressions_cover_positive_negative_and_conflict(self) -> None:
        with REGRESSION.open(encoding="utf-8", newline="") as stream:
            rows = list(csv.DictReader(stream))
        for prefix in ("FP", "ST"):
            selected = [r for r in rows if r["id"].startswith(prefix)]
            self.assertGreaterEqual(len(selected), 12)
            self.assertEqual(len({r["id"] for r in selected}), len(selected))
            buckets = {r["bucket"] for r in selected}
            self.assertTrue({
                "positive", "negative", "adversarial",
                "composition", "conflict", "multi-turn",
            }.issubset(buckets))
            self.assertTrue(all(r["prompt"] and r["expected"] for r in selected))


if __name__ == "__main__":
    unittest.main()
