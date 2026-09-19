from __future__ import annotations

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
WRITING = ROOT / "plugins" / "writing"


class FictionWritingQualityContractTests(unittest.TestCase):
    def test_quality_gate_and_workplace_realism_are_wired(self) -> None:
        writing_skill = (WRITING / "skills/fiction-writing/SKILL.md").read_text(encoding="utf-8")
        drafting = (WRITING / "skills/fiction-writing/references/drafting.md").read_text(encoding="utf-8")
        revision = (WRITING / "skills/fiction-writing/references/revision.md").read_text(encoding="utf-8")
        development = (WRITING / "skills/fiction-story-development/SKILL.md").read_text(encoding="utf-8")
        character = (WRITING / "skills/fiction-story-development/references/character-relationships.md").read_text(encoding="utf-8")
        workplace = (WRITING / "shared/fiction/references/workplace-realism.md").read_text(encoding="utf-8")
        quality_eval = (ROOT / "tests/fiction-writing-quality-eval.md").read_text(encoding="utf-8")

        self.assertIn("逐章质量 Gate", writing_skill)
        self.assertIn("Story Movement 连续通读", writing_skill)
        self.assertIn("大纲不是 Checklist", writing_skill)
        self.assertIn("职场与组织现实主义", writing_skill)
        self.assertIn("人物先是人，再是岗位", drafting)
        self.assertIn("公开表达与私下温差", drafting)
        self.assertIn("问题允许残留", drafting)
        self.assertIn("教学案例化 / Checklist 化", revision)
        self.assertIn("NPC 化 / 标签化", revision)
        self.assertIn("同刺激差异", character)
        self.assertIn("职场与组织现实主义", development)
        self.assertIn("坏消息到来时，人物先是人，然后才是岗位", workplace)
        self.assertIn("偶然成功会制造错误组织学习", workplace)
        self.assertIn("FQ014", quality_eval)


if __name__ == "__main__":
    unittest.main()
