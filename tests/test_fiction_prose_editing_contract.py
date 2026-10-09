"""Regression checks for the fiction prose editing Skill and its downstream handoff."""

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WRITING = ROOT / "plugins" / "writing"
SKILLS = WRITING / "skills"
NEW_SKILL = SKILLS / "fiction-prose-editing" / "SKILL.md"
REFERENCE = SKILLS / "fiction-prose-editing" / "references" / "chinese-prose-editing.md"


def read(path):
    return path.read_text(encoding="utf-8")


class FictionProseEditingContractTest(unittest.TestCase):
    def test_public_skill_and_group(self):
        manifest = json.loads(read(WRITING / "plugin.json"))
        self.assertIn("fiction-prose-editing", manifest["groups"]["fiction"])
        self.assertEqual(manifest["groups"]["fiction"].count("fiction-prose-editing"), 1)
        skill = read(NEW_SKILL)
        self.assertTrue(skill.startswith("---\nname: fiction-prose-editing\n"))
        self.assertIn("visibility: workflow", skill)
        self.assertIn("phase: editing", skill)
        self.assertLessEqual(len(skill), 5000)
        self.assertTrue(REFERENCE.is_file())
        self.assertLessEqual(len(read(REFERENCE)), 6000)

    def test_drafting_uses_post_draft_prose_pass(self):
        draft = read(SKILLS / "fiction-manuscript-drafting" / "SKILL.md")
        self.assertIn('uses: "writing/fiction-manuscript-readiness"', draft)
        self.assertIn('optional_uses: "writing/fiction-prose-editing"', draft)
        self.assertIn("默认触发（必须执行）", draft)
        self.assertIn("正式小说 Manuscript", draft)
        self.assertIn("初稿及 Reader Pass", draft)
        self.assertIn("Protect / No Change", draft)

    def test_expression_review_opt_in(self):
        expression = read(SKILLS / "fiction-expression-review" / "SKILL.md")
        self.assertIn('optional_uses: "writing/fiction-prose-editing"', expression)
        self.assertIn("只要审查时", expression)
        self.assertIn("直接纯文笔润色", expression)

    def test_neighbor_routing_points_to_new_skill(self):
        for name in (
            "fiction-readability-review",
            "fiction-revision-validation",
            "fiction-final-review",
            "humanizer",
            "clear-writing",
        ):
            with self.subTest(name=name):
                self.assertIn("writing/fiction-prose-editing", read(SKILLS / name / "SKILL.md"))

    def test_boundaries_and_no_change(self):
        prose = read(NEW_SKILL)
        self.assertIn("不借润色暗改高影响内容", prose)
        self.assertIn("对白逐字保留", prose)
        self.assertIn("没有可证实增益，保留原稿", prose)
        self.assertIn("没有真实独立盲评", prose)

    def test_prose_route_regression_fixture(self):
        csv = read(ROOT / "plugins/ai-workflow/skills/skill-system-design/references/semantic-routing-regression.csv")
        ids = re.findall(r"^(PROSE\d{3}),", csv, flags=re.MULTILINE)
        self.assertEqual(len(ids), 20)
        self.assertEqual(len(ids), len(set(ids)))
        self.assertIn("PROSE012,composition,", csv)
        self.assertIn("PROSE016,conflict,", csv)


if __name__ == "__main__":
    unittest.main()
