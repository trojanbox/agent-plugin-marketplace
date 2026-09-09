from __future__ import annotations

import csv
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VENDOR = ROOT / "vendor/baoyu-design"


class DesignRuntimeIntegrationTests(unittest.TestCase):
    def test_design_category_has_two_public_runtime_skills(self) -> None:
        out = subprocess.run(
            ["node", str(ROOT / "skill-runtime.js"), "list", "design"],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        data = json.loads(out.stdout)
        self.assertTrue(data["ok"])
        self.assertEqual(data["publicSkillCount"], 2)
        self.assertEqual(
            {item["name"] for item in data["ungroupedSkills"]},
            {"visual-artifact-design", "design-system-authoring"},
        )

    def test_upstream_pin_and_routing_snapshot_are_consistent(self) -> None:
        cfg = json.loads((VENDOR / "UPSTREAM.json").read_text(encoding="utf-8"))
        self.assertEqual(cfg["repository"], "JimLiu/baoyu-design")
        self.assertEqual(cfg["commit"], "026d4ea012bdd5cada72ac8cc13f21ba4edf2245")
        self.assertEqual(cfg["subtreePath"], "skills/baoyu-design")
        self.assertEqual(cfg["subtreeSha"], "6021a026f87d3aefe957e924b173108c24275ea1")
        snapshot = json.loads((VENDOR / "project-types.snapshot.json").read_text(encoding="utf-8"))
        ids = {item["id"] for item in snapshot["projectTypes"]}
        self.assertEqual(len(ids), 13)
        self.assertTrue({"slides", "mobile-app-design", "ui-mockups", "color-type-system", "diagram"} <= ids)

    def test_vendor_materializer_is_safe_and_syntax_valid(self) -> None:
        script = VENDOR / "materialize-upstream.mjs"
        text = script.read_text(encoding="utf-8")
        self.assertIn("path traversal", text)
        self.assertIn("subtree SHA mismatch", text)
        self.assertIn("raw.githubusercontent.com", text)
        subprocess.run(["node", "--check", str(script)], cwd=ROOT, check=True)

    def test_upstream_stays_outside_runtime_skill_scan(self) -> None:
        for path in VENDOR.rglob("SKILL.md"):
            self.assertFalse(str(path).startswith(str(ROOT / "plugins")))
        visual = (ROOT / "plugins/design/skills/visual-artifact-design/SKILL.md").read_text(encoding="utf-8")
        authoring = (ROOT / "plugins/design/skills/design-system-authoring/SKILL.md").read_text(encoding="utf-8")
        self.assertIn("materialize-upstream.mjs", visual)
        self.assertIn("design/design-system-authoring", visual)
        self.assertIn("visual-artifact-design", authoring)

    def test_semantic_regression_contains_design_boundaries(self) -> None:
        corpus = ROOT / "plugins/ai-workflow/skills/skill-system-design/references/semantic-routing-regression.csv"
        with corpus.open(encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        design = [row for row in rows if row["bucket"] == "design-integration"]
        self.assertEqual(len(design), 14)
        expected = "\n".join(row["expected"] for row in design)
        self.assertIn("design/visual-artifact-design", expected)
        self.assertIn("design/design-system-authoring", expected)
        self.assertIn("data/data-exploration", expected)
        self.assertIn("research/deep-research", expected)
        self.assertIn("writing/clear-writing", expected)
        self.assertIn("主 Skill 冲突", expected)


if __name__ == "__main__":
    unittest.main()
