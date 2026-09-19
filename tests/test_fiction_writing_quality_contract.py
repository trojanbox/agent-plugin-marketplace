from __future__ import annotations

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
WRITING = ROOT / "plugins" / "writing"


class FictionWritingQualityContractTests(unittest.TestCase):
    def test_quality_gates_are_generic_and_do_not_require_domain_reference(self) -> None:
        writing_skill = (WRITING / "skills/fiction-writing/SKILL.md").read_text(encoding="utf-8")
        drafting = (WRITING / "skills/fiction-writing/references/drafting.md").read_text(encoding="utf-8")
        revision = (WRITING / "skills/fiction-writing/references/revision.md").read_text(encoding="utf-8")
        development = (WRITING / "skills/fiction-story-development/SKILL.md").read_text(encoding="utf-8")
        scenes = (WRITING / "skills/fiction-story-development/references/scenes-information-world.md").read_text(encoding="utf-8")
        character = (WRITING / "skills/fiction-story-development/references/character-relationships.md").read_text(encoding="utf-8")
        quality_eval = (ROOT / "tests/fiction-writing-quality-eval.md").read_text(encoding="utf-8")
        workplace = WRITING / "shared/fiction/references/workplace-realism.md"

        self.assertIn("逐章质量 Gate", writing_skill)
        self.assertIn("Story Movement 连续通读", writing_skill)
        self.assertIn("大纲不是 Checklist", writing_skill)
        self.assertIn("让高影响条件真正进入行为", writing_skill)
        self.assertIn("人物先是人，再是岗位", drafting)
        self.assertIn("外部约束必须传播到行为", drafting)
        self.assertIn("新能力、工具与资源必须改变选择成本", drafting)
        self.assertIn("同一结果可以被不同人物解释成不同经验", drafting)
        self.assertIn("问题允许残留", drafting)
        self.assertIn("教学案例化 / Checklist 化", revision)
        self.assertIn("约束装饰化", revision)
        self.assertIn("能力变化只停留在表面", revision)
        self.assertIn("结果解释被统一", revision)
        self.assertIn("高影响约束与能力变化", scenes)
        self.assertIn("同刺激差异", character)
        self.assertIn("FQ015", quality_eval)

        self.assertFalse(workplace.exists())
        for text in (writing_skill, drafting, development):
            self.assertNotIn("workplace-realism", text)
            self.assertNotIn("职场与组织现实主义", text)


if __name__ == "__main__":
    unittest.main()
