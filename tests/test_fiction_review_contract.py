from __future__ import annotations

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
WRITING = ROOT / "plugins" / "writing"


class FictionReviewContractTests(unittest.TestCase):
    def test_review_contract_preserves_real_failure_modes(self) -> None:
        review = (WRITING / "shared/fiction/references/review-contract.md").read_text(encoding="utf-8")
        drafting = (WRITING / "shared/fiction/references/drafting-quality.md").read_text(encoding="utf-8")
        revision = (WRITING / "shared/fiction/references/revision-methods.md").read_text(encoding="utf-8")
        character = (WRITING / "skills/fiction-character-review/SKILL.md").read_text(encoding="utf-8")
        continuity = (WRITING / "skills/fiction-continuity-review/SKILL.md").read_text(encoding="utf-8")
        expression = (WRITING / "skills/fiction-expression-review/SKILL.md").read_text(encoding="utf-8")
        readability = (WRITING / "skills/fiction-readability-review/SKILL.md").read_text(encoding="utf-8")
        pacing = (WRITING / "skills/fiction-pacing-review/SKILL.md").read_text(encoding="utf-8")
        validation = (WRITING / "skills/fiction-revision-validation/SKILL.md").read_text(encoding="utf-8")
        final_review = (WRITING / "skills/fiction-final-review/SKILL.md").read_text(encoding="utf-8")
        voice = (WRITING / "shared/fiction/references/voice-contract.md").read_text(encoding="utf-8")
        relationships = (WRITING / "shared/fiction/references/character-relationships.md").read_text(encoding="utf-8")
        outline = (WRITING / "skills/fiction-outline/SKILL.md").read_text(encoding="utf-8")
        readiness = (WRITING / "skills/fiction-manuscript-readiness/SKILL.md").read_text(encoding="utf-8")
        drafting_skill = (WRITING / "skills/fiction-manuscript-drafting/SKILL.md").read_text(encoding="utf-8")
        drafting_contract = (WRITING / "shared/fiction/references/manuscript-drafting.md").read_text(encoding="utf-8")
        readiness_contract = (WRITING / "shared/fiction/references/manuscript-readiness.md").read_text(encoding="utf-8")
        quality_eval = (ROOT / "tests/fiction-review-quality-eval.md").read_text(encoding="utf-8")
        publication = (WRITING / "shared/fiction/references/publication-proofread.md").read_text(encoding="utf-8")
        knowledge = (WRITING / "shared/fiction/references/character-knowledge-boundaries.md").read_text(encoding="utf-8")
        hygiene = WRITING / "shared/fiction/scripts/manuscript-hygiene-check.py"

        self.assertIn("Evidence First", review)
        self.assertIn("P0", review)
        self.assertIn("不静默修改", review)
        self.assertIn("人物先是人，再是岗位", drafting)
        self.assertIn("外部约束必须传播到行为", drafting)
        self.assertIn("教学案例化 / Checklist 化", revision)
        self.assertIn("Voice Flattening", revision)
        self.assertIn("Character Voice", character)
        self.assertIn("默认社交基线", character)
        self.assertIn("后期才建立", character)
        self.assertIn("互动边界", relationships)
        self.assertIn("Rolling Plan", outline)
        self.assertIn("Creative Open", outline)
        self.assertIn("正文可写性检查", readiness)
        self.assertIn("不规定句式", readiness)
        self.assertIn("Writing Simulation Test", readiness_contract)
        self.assertIn("不能因为没有 Outline 判 `Not Ready`", readiness_contract)
        self.assertIn("Style Source", readiness_contract)
        self.assertIn("正式正文起草", drafting_skill)
        self.assertIn("Voice Calibration", drafting_skill)
        self.assertIn("Feedback Delta", drafting_contract)
        self.assertIn("用户已经否决", drafting_contract)
        self.assertIn("Voice Baseline", drafting_contract)
        self.assertIn("前一章 → 当前章 → 后一章", continuity)
        self.assertIn("无铺垫跳级", continuity)
        self.assertIn("Work Voice Flattening", expression)
        self.assertIn("State-conditioned Voice Gate", expression)
        self.assertIn("声音生成机制", expression)
        self.assertIn("Voice Baseline", expression)
        self.assertIn("第一次阅读", readability)
        self.assertIn("Reader Pull", pacing)
        self.assertIn("Preserve Set", validation)
        self.assertIn("Diff / Baseline First", validation)
        self.assertIn("真实 diff", validation)
        self.assertIn("Publication Readiness", final_review)
        self.assertIn("Version Binding Gate", final_review)
        self.assertIn("Protect / No Change Gate", final_review)
        self.assertIn("publication-proofread.md", final_review)
        self.assertIn("Author Aesthetic Profile", voice)
        self.assertIn("Anti-Voice", voice)
        self.assertIn("FQ020", quality_eval)
        self.assertIn("FQ021", quality_eval)
        self.assertIn("FQ022", quality_eval)
        self.assertIn("FQ023", quality_eval)
        self.assertIn("FQ024", quality_eval)
        self.assertIn("FQ025", quality_eval)
        self.assertIn("FQ026", quality_eval)
        self.assertIn("FQ027", quality_eval)
        self.assertIn("FQ028", quality_eval)
        self.assertIn("确定性文本卫生", publication)
        self.assertIn("Protect / No Change", publication)
        self.assertIn("可读取记录，但没有亲历", knowledge)
        self.assertIn("同源 / 同模板 / 相似人格", knowledge)
        self.assertTrue(hygiene.exists())

        for old in ("fiction-story-architecture", "fiction-story-development", "fiction-writing"):
            self.assertFalse((WRITING / f"skills/{old}").exists(), old)


if __name__ == "__main__":
    unittest.main()
