"""开发计划 TDD 边界及独立开发结论的静态合同回归。"""
from __future__ import annotations

import csv
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEV = ROOT / "plugins/development"
PLAN = DEV / "skills/github-development-plan-generator"
SPEC = DEV / "skills/github-spec"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


class DevelopmentDeliveryBoundariesTest(unittest.TestCase):
    def test_plan_is_tdd_only(self) -> None:
        skill = read(PLAN / "SKILL.md")
        self.assertIn("Red → Green → Refactor → Regression", skill)
        self.assertIn("开发计划只服务 Coding Agent 的生产实现与 TDD", skill)
        self.assertIn("不得把其 Scenario、E2E、Harness", skill)
        self.assertIn("不将业务测试、E2E、系统环境启动", skill)

    def test_plan_task_has_no_business_or_e2e_acceptance_fields(self) -> None:
        task = read(PLAN / "references/task-contract.md")
        construction = read(PLAN / "references/plan-construction.md")
        delivery = read(PLAN / "references/delivery-and-audit.md")
        template = read(DEV / "shared/github-core/references/plan-authoring.md")
        for source in (task, template):
            for field in ("- Business Scenario IDs:", "- Technical Risk/Case IDs:",
                          "- Real-environment validation required:"):
                self.assertNotIn(field, source)
        self.assertIn("不得加入 Browser/System E2E", task)
        self.assertIn("不强求所有层级", construction)
        self.assertIn("不得把业务验收、端到端测试", delivery)
        self.assertNotIn("## 测试合同引用", template)

    def test_coding_goal_excludes_system_test_environment(self) -> None:
        delivery = read(PLAN / "references/delivery-and-audit.md")
        self.assertIn("不作为开发 Goal 的步骤或通过门槛", delivery)
        self.assertIn("不混入业务测试、Browser/System E2E", delivery)

    def test_spec_is_self_contained_and_readable(self) -> None:
        spec = read(SPEC / "SKILL.md")
        delivery = read(SPEC / "references/delivery-and-issue.md")
        integrity = read(SPEC / "references/source-and-integrity.md")
        self.assertIn("独立可转发、通俗易读且技术合同完整", spec)
        self.assertIn("正文不引用或链接任何原始讨论材料", spec)
        self.assertIn("给人看的摘要", delivery)
        self.assertIn("给研发看的完整合同", delivery)
        self.assertIn("给交付看的边界", delivery)
        self.assertIn("结论正文不添加任何来源引用", delivery)
        self.assertIn("正文不增加来源/追溯章节", integrity)
        self.assertIn("内部覆盖核对", integrity)

    def test_spec_does_not_require_e2e_before_freeze(self) -> None:
        spec = read(SPEC / "SKILL.md")
        self.assertIn("开发结论不以 E2E、真实外部联调", spec)
        self.assertIn("未验证事实及后续验收门槛", spec)

    def test_dev_metadata_prioritizes_different_artifacts(self) -> None:
        data = json.loads(read(DEV / "plugin.json"))
        text = data["description"]
        for key in ("【开发·讨论】", "【开发·结论】", "【开发·实施计划】",
                    "github-spec", "github-development-plan-generator"):
            self.assertIn(key, text)
        self.assertIn("TDD", text)
        self.assertIn("不包含业务测试/E2E", text)

    def test_semantic_regression_examples_are_present(self) -> None:
        path = (ROOT / "plugins/ai-workflow/skills/skill-system-design"
                / "references/semantic-routing-regression.csv")
        with path.open(encoding="utf-8", newline="") as f:
            rows = {x["id"]: x for x in csv.DictReader(f)}
        expected = {
            "SKD001": "development/github-spec",
            "SKD005": "development/github-development-plan-generator",
            "SKD011": "development/github-discussion-facilitator",
            "SKD014": "development/github-technical-test-plan-generator",
        }
        for case, target in expected.items():
            self.assertIn(case, rows)
            self.assertIn(target, rows[case]["expected"])


if __name__ == "__main__":
    unittest.main()
