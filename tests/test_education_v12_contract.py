"""Education 1.2 contract checks for five independent public skills.

These are static/runtime contract tests. They do not claim actual LLM teaching
performance or natural-language routing accuracy.
"""
from __future__ import annotations

import csv
import json
import re
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EDU = ROOT / "plugins/education"
SKILLS = EDU / "skills"
SHARED = EDU / "shared/core"
CORPUS = ROOT / "plugins/ai-workflow/skills/skill-system-design/references/semantic-routing-regression.csv"
EXPECTED = {
    "k12-lesson-planning", "k12-lesson-differentiation",
    "family-education-guidance", "learning-coach", "anki-deck-builder",
}


def read(path):
    return path.read_text(encoding="utf-8")


def runtime(*args):
    return json.loads(subprocess.run(
        ["node", str(ROOT / "skill-runtime.js"), *args, "--json"],
        cwd=ROOT, check=True, capture_output=True, text=True,
    ).stdout)


class EducationV12ContractTests(unittest.TestCase):
    def test_one_plugin_five_public_skills_and_identity(self):
        manifest = json.loads(read(EDU / "plugin.json"))
        self.assertEqual(manifest["version"], "1.2.0")
        self.assertEqual(manifest["name"], "education")
        self.assertEqual(manifest["compatibility"]["stableSkillIdPrefix"], "education")
        result = runtime("list", "education")
        self.assertEqual(result["publicSkillCount"], 5)
        self.assertEqual(result["internalSkillCount"], 0)
        self.assertEqual(result["groups"], [])
        self.assertEqual({item["name"] for item in result["ungroupedSkills"]}, EXPECTED)
        self.assertEqual({p.parent.name for p in SKILLS.glob("*/SKILL.md")}, EXPECTED)
        catalog = {x["id"] for x in runtime("catalog")["skills"]}
        self.assertEqual(runtime("catalog")["publicSkillCount"], 63)
        for name in EXPECTED:
            self.assertIn("education/" + name, catalog)
            self.assertEqual(runtime("skill", "education/" + name)["skill"]["name"], name)

    def test_teacher_skill_ids_source_lesson_and_authority_remain(self):
        new = read(SKILLS / "k12-lesson-planning/SKILL.md")
        adapt = read(SKILLS / "k12-lesson-differentiation/SKILL.md")
        shared = read(SHARED / "pedagogy.md")
        for text in (new, adapt):
            self.assertIn("curriculum-localization.md", text)
            self.assertIn("education-evidence-and-safety.md", text)
            self.assertIn("中国", text)
            self.assertIn("不", text)
            self.assertIn("Copyright", text)
        for phrase in ("Source Lesson", "不能根据标题偷偷重建",
                       "同一标准", "formative"):
            self.assertIn(phrase, adapt)
        self.assertIn("新课", new)
        self.assertIn("不要再额外路由", new)
        self.assertIn("R1", shared)
        self.assertIn("R8", shared)
        self.assertIn("美国", shared)
        for name in ("k12-lesson-planning", "k12-lesson-differentiation"):
            for subject in ("math", "ela", "science", "social-studies"):
                self.assertTrue((SKILLS / name / "references" / (subject + "-pedagogy.md")).is_file())

    def test_localization_is_conditional_and_does_not_fabricate_standards(self):
        doc = read(SHARED / "curriculum-localization.md")
        for phrase in (
            "中国", "standard_unverified", "user_provided", "official_verified",
            "不能", "语文", "英语", "课程标准", "没有真实核验",
        ):
            self.assertIn(phrase, doc)
        self.assertIn("美国", doc)
        self.assertIn("不能把它们的美国体系术语自动升级成当地的课程标准", doc)
        self.assertIn("缺源教案不得换成新教案", doc)

    def test_family_guidance_broad_and_opt_in_multiweek(self):
        s = read(SKILLS / "family-education-guidance/SKILL.md")
        methods = read(SKILLS / "family-education-guidance/references/family-action-patterns.md")
        for phrase in (
            "好奇心", "责任感", "价值观", "社会性", "亲子",
            "事实", "观察", "只有家长明确要求", "数周", "不做诊断",
            "不自行创建儿童画像", "不自动生成周计划",
        ):
            self.assertIn(phrase, s)
        self.assertIn("参考", methods) if "参考" in methods else self.assertIn("可选", methods)
        self.assertIn("调整/停止", methods)
        d = runtime("skill", "education/family-education-guidance")["skill"]
        self.assertEqual(d["phase"], "guidance")
        self.assertEqual(set(d["optionalUses"]), {
            "research/deep-research", "reasoning/scientific-reasoning",
        })
        self.assertIn("Skill Composition", s)

    def test_learning_coach_adaptive_and_true_interaction(self):
        s = read(SKILLS / "learning-coach/SKILL.md")
        methods = read(SKILLS / "learning-coach/references/interactive-learning-method.md")
        for phrase in (
            "儿童、青少年、成年人", "语言", "编程", "实际", "启发问题",
            "适当直接讲解和示范", "等待真实回应",
            "没有可观察的独立回应时绝不声称已经学会",
            "不是完整教案", "不出具正式分数", "当前会话",
            "只有用户", "宿主", "不能用对话绕过平台限制",
        ):
            self.assertIn(phrase, s)
        self.assertIn("同结构新题", methods)
        self.assertIn("不能凭指导下成功就声称完全掌握", methods)
        self.assertIn("Skill Composition", s)
        d = runtime("skill", "education/learning-coach")["skill"]
        self.assertEqual(d["phase"], "tutoring")
        self.assertEqual(d["optionalUses"], ["research/deep-research"])

    def test_shared_safety_and_real_tool_boundary(self):
        doc = read(SHARED / "education-evidence-and-safety.md")
        for phrase in (
            "Observed", "Unknown", "监护", "年龄验证", "隐私",
            "不在聊天中要求孩子的姓名", "只有用户主动明确要求",
            "儿童画像", "持续后台跟踪", "不宣称已掌握",
            "不擅自下诊断", "当前未实现",
        ):
            self.assertIn(phrase, doc)

    def test_cross_plugin_route_boundaries(self):
        composition = read(ROOT / "SKILL_COMPOSITION.md")
        readme = read(ROOT / "README.md")
        writing = read(ROOT / "plugins/writing/skills/explanatory-writing/SKILL.md")
        research = read(ROOT / "plugins/research/skills/domain-knowledge-builder/SKILL.md")
        for token in (
            "education/family-education-guidance",
            "education/learning-coach",
            "education/k12-lesson-planning",
            "education/k12-lesson-differentiation",
        ):
            self.assertIn(token, composition)
        self.assertIn("education/learning-coach", writing)
        self.assertIn("education/learning-coach", research)
        self.assertIn("Education v1.2.0", readme)

    def test_semantic_route_corpus_covers_all_realistic_boundaries(self):
        with CORPUS.open(encoding="utf-8", newline="") as fp:
            rows = list(csv.DictReader(fp))
        self.assertEqual(len(rows), len({r["id"] for r in rows}))
        cases = [r for r in rows if re.fullmatch(r"EDU\d{3}", r["id"])]
        self.assertGreaterEqual(len(cases), 40)
        self.assertTrue({"positive", "negative", "gate", "multi-turn",
                         "composition", "conflict", "adversarial"}
                        .issubset({r["bucket"] for r in cases}))
        hits = "\n".join(r["expected"] for r in cases)
        for name in EXPECTED:
            self.assertIn("education/" + name, hits)
        for other in (
            "writing/explanatory-writing", "research/domain-knowledge-builder",
            "reasoning/scientific-reasoning",
        ):
            self.assertIn(other, hits)

    def test_runtime_doctor_has_no_composition_or_contract_issues(self):
        d = runtime("doctor")
        self.assertTrue(d["ok"])
        self.assertEqual(d["publicSkillCount"], 63)
        self.assertEqual(d["internalSkillCount"], 1)
        self.assertEqual(d["contractIssues"], [])
        self.assertEqual(d["compositionIssues"], [])
        self.assertEqual(d["contextIssues"], [])


if __name__ == "__main__":
    unittest.main()
