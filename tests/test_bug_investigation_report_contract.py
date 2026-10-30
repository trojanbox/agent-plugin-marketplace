"""Defect investigation Markdown delivery: routing, disclosure, and evidence gates."""
from __future__ import annotations

import csv
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEVELOPMENT = ROOT / "plugins/development"
BUG = DEVELOPMENT / "skills/github-bug-investigation"
RESEARCH = DEVELOPMENT / "skills/github-research-document-generator"
REPORT = BUG / "references/markdown-investigation-report.md"
BASELINE = (
    ROOT / "plugins/ai-workflow/skills/skill-system-design/"
    "references/semantic-routing-regression.csv"
)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


class BugInvestigationReportContractTest(unittest.TestCase):
    def test_default_analysis_does_not_create_file_or_issue(self) -> None:
        skill = read(BUG / "SKILL.md")
        self.assertIn("`analysis_only`（默认）", skill)
        self.assertIn("不因普通“分析一下”“查查 Bug”自动建文件", skill)
        self.assertIn("默认**不自动创建 GitHub Issue**", skill)
        self.assertIn("只要求 `.md` 时不做 GitHub 写入", skill)
        self.assertIn("formal_markdown_report", skill)

    def test_only_explicit_report_loads_its_reference(self) -> None:
        skill = read(BUG / "SKILL.md")
        reference = read(REPORT)
        self.assertIn("**仅此模式**读取 `references/markdown-investigation-report.md`", skill)
        self.assertIn("仅当 `github-bug-investigation` 的 `formal_markdown_report` 模式", reference)
        self.assertIn("默认分析模式不得加载本文件", reference)
        self.assertLessEqual(len(skill), 5000)
        self.assertLessEqual(len(reference), 6000)

    def test_report_is_self_contained_grounded_and_download_verified(self) -> None:
        reference = read(REPORT)
        for requirement in (
            "独立可读、可转发",
            "仓库/分支/Commit",
            "## 1. 一页摘要",
            "## 2. 问题场景与边界",
            "## 3. 现有实现与调用链",
            "## 4. 缺陷逐项分析",
            "## 5. 可追溯源码与运行证据",
            "## 6. 复现与验证",
            "## 7. 永久解决方向及可能副作用",
            "## 8. 回归范围与验收标准",
            "## 9. 结论与后续决策",
            "verified_fact",
            "inference",
            "hypothesis",
            "unknown",
            "函数级复现不能冒称 E2E",
            "实际 UTF-8 Markdown 文件",
            "检查文件确实存在、非空、可读取",
            "不能凭目录名虚构",
            "回退为可直接复制的完整 Markdown 文本",
            "未触发未经授权的 Issue",
        ):
            with self.subTest(requirement=requirement):
                self.assertIn(requirement, reference)

    def test_neighboring_research_and_github_stay_independent(self) -> None:
        skill = read(BUG / "SKILL.md")
        plugin = json.loads(read(DEVELOPMENT / "plugin.json"))
        research = read(RESEARCH / "SKILL.md")
        self.assertEqual(plugin["version"], "2.0.3")
        self.assertIn("github-bug-investigation", plugin["description"])
        self.assertIn(".md 问题报告", plugin["description"])
        self.assertIn("纯源码现状盘点归 github-research-document-generator", skill.split("---", 2)[1])
        self.assertIn("系统性盘点当前实现", skill)
        self.assertIn("独立故障转 `github-bug-investigation`", research)
        self.assertIn("github/github-issue-manager", skill)
        self.assertIn("文件交付**不自动触发 Issue", read(REPORT))

    def test_runtime_discovers_same_logical_skill_and_formal_mode(self) -> None:
        proc = subprocess.run(
            ["node", "skill-runtime.js", "skill", "development/github-bug-investigation", "--json"],
            cwd=ROOT,
            check=True,
            text=True,
            capture_output=True,
        )
        discovered = json.loads(proc.stdout)["skill"]
        self.assertEqual(discovered["name"], "github-bug-investigation")
        self.assertEqual(discovered["phase"], "investigation")
        self.assertIn("Markdown/.md", discovered["description"])
        self.assertIn("formal_markdown_report", read(BUG / "SKILL.md"))

    def test_semantic_regression_has_report_and_neighbor_cases(self) -> None:
        with BASELINE.open(encoding="utf-8", newline="") as handle:
            rows = {row["id"]: row for row in csv.DictReader(handle)}
        cases = {
            "MDIR001": "development/github-bug-investigation",
            "MDIR002": "development/github-bug-investigation",
            "MDIR003": "development/github-bug-investigation",
            "MDIR004": "development/github-bug-investigation",
            "MDIR005": "development/github-research-document-generator",
            "MDIR006": "github/github-issue-manager",
            "MDIR007": "development/github-bug-investigation",
            "MDIR008": "development/github-bug-investigation",
            "MDIR009": "writing/clear-writing",
            "MDIR010": "development/github-bug-investigation",
        }
        for case_id, expected in cases.items():
            with self.subTest(case_id=case_id):
                self.assertIn(case_id, rows)
                self.assertIn(expected, rows[case_id]["expected"])


if __name__ == "__main__":
    unittest.main()
