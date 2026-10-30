"""Contract regression for github-bug-investigation root-cause quality gates.

These tests verify the published Skill instructions and routes; they cannot
prove that an external agent will behave correctly during a live investigation.
"""
from __future__ import annotations

import csv
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUG = ROOT / "plugins/development/skills/github-bug-investigation"
CORE = BUG / "SKILL.md"
QUALITY = BUG / "references/root-cause-quality-gates.md"
REPORT = BUG / "references/markdown-investigation-report.md"
PLUGIN = ROOT / "plugins/development/plugin.json"
BASELINE = (
    ROOT / "plugins/ai-workflow/skills/skill-system-design/"
    "references/semantic-routing-regression.csv"
)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


class RootCauseQualityGateContractTest(unittest.TestCase):
    def test_core_is_bounded_and_reference_is_lazy(self) -> None:
        core, quality = read(CORE), read(QUALITY)
        self.assertLessEqual(len(core), 5000)
        self.assertLessEqual(len(quality), 6000)
        self.assertIn("涉及线上个案归因、跨层/共享消费者", core)
        self.assertIn("读取 `references/root-cause-quality-gates.md`", core)
        self.assertIn("简单局部问题按风险裁剪", core)
        self.assertIn("仅供 `development/github-bug-investigation`", quality)
        self.assertIn("不为满足模板扩大调查范围", quality)

    def test_code_defect_and_individual_incident_are_separate(self) -> None:
        core, quality, report = read(CORE), read(QUALITY), read(REPORT)
        self.assertIn("**代码缺陷确认 ≠ 具体事故归因确认**", core)
        self.assertIn("当次输入、日志/Trace、实际产物", core)
        self.assertIn("代码级 confirmed，事故级 unknown/hypothesis", quality)
        self.assertIn("不能用相关性冒充因果", quality)
        self.assertIn("将“代码缺陷已确认”和“这次用户事故由该缺陷导致”分别给出结论", report)

    def test_primary_sources_and_competing_hypothesis_disproof(self) -> None:
        quality = read(QUALITY)
        for phrase in (
            "仓库/分支/Commit",
            "不能把源码的“可能执行”直接写成那次线上请求“已经执行”",
            "模板提示词不等于最终发送给模型的提示词",
            "最少足以改变决策",
            "能推翻它的观察",
            "最小下一条证据",
            "blocked",
            "不得按猜测补全链路",
        ):
            with self.subTest(phrase=phrase):
                self.assertIn(phrase, quality)

    def test_solution_review_checks_consumers_and_avoids_scope_sprawl(self) -> None:
        quality, core = read(QUALITY), read(CORE)
        for phrase in (
            "实际调用方和消费者",
            "错误传播、重试和兜底",
            "主动攻击方案",
            "修正方案及其**理由**",
            "不能写“绝无副作用”",
            "DECISION_REQUIRED",
            "不得顺手构造新功能设计",
        ):
            with self.subTest(phrase=phrase):
                self.assertIn(phrase, quality)
        self.assertIn("非平凡方案提出前先主动找反例与副作用", core)

    def test_verification_levels_and_permissions_are_preserved(self) -> None:
        quality, core, report = read(QUALITY), read(CORE), read(REPORT)
        self.assertIn("源码/静态检查", quality)
        self.assertIn("函数级实际复现", quality)
        self.assertIn("Unit / Integration", quality)
        self.assertIn("真实消费终点/真实环境", quality)
        self.assertIn("跳过、无匹配、截断", quality)
        self.assertIn("不机械要求运行", quality)
        self.assertIn("不能冒称线上用户问题已恢复", core)
        self.assertIn("不强制启动未授权的 E2E", core)
        self.assertIn("非平凡方案记录已检查的影响面", report)

    def test_original_workflows_and_identity_are_unchanged(self) -> None:
        core = read(CORE)
        self.assertIn("`analysis_only`（默认）", core)
        self.assertIn("`formal_markdown_report`", core)
        self.assertIn("默认**不自动创建 GitHub Issue**", core)
        self.assertIn("只有 `PRODUCTION_BUG` 进入缺陷修复/Issue 流程", core)
        self.assertIn("patch_fast_lane_eligible", core)
        self.assertIn("github/github-issue-manager", core)
        self.assertIn("reasoning/scientific-reasoning", core)
        metadata = json.loads(read(PLUGIN))
        self.assertEqual(metadata["version"], "2.0.4")
        proc = subprocess.run(
            ["node", "skill-runtime.js", "skill", "development/github-bug-investigation"],
            cwd=ROOT, capture_output=True, text=True, check=True,
        )
        data = json.loads(proc.stdout)["skill"]
        self.assertEqual(data["name"], "github-bug-investigation")
        self.assertEqual(data["phase"], "investigation")
        self.assertEqual(
            data["optionalUses"],
            ["github/github-issue-manager", "reasoning/scientific-reasoning"],
        )

    def test_regression_cases_cover_updated_evidence_gate(self) -> None:
        with BASELINE.open(encoding="utf-8", newline="") as f:
            rows = {row["id"]: row for row in csv.DictReader(f)}
        cases = {
            "RCQ001": "development/github-bug-investigation",
            "RCQ002": "development/github-bug-investigation",
            "RCQ003": "development/github-bug-investigation",
            "RCQ004": "development/github-bug-investigation",
            "RCQ005": "development/github-bug-investigation",
            "RCQ006": "development/github-research-document-generator",
            "RCQ007": "development/github-technical-test-plan-generator",
            "RCQ008": "development/github-bug-investigation",
            "RCQ009": "development/github-bug-investigation",
            "RCQ010": "development/github-bug-investigation",
            "RCQ011": "product/product-research",
            "RCQ012": "development/github-bug-investigation",
        }
        for case_id, target in cases.items():
            with self.subTest(case_id=case_id):
                self.assertIn(case_id, rows)
                self.assertIn(target, rows[case_id]["expected"])


if __name__ == "__main__":
    unittest.main()
