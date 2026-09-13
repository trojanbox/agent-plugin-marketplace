import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLUGINS = ROOT / "plugins"


class GitCommitWorkflowContractTests(unittest.TestCase):
    def test_tasks_commit_after_completion_without_implying_push(self) -> None:
        skill = (
            PLUGINS
            / "development/skills/github-development-plan-generator/SKILL.md"
        ).read_text(encoding="utf-8")
        task_contract = (
            PLUGINS
            / "development/skills/github-development-plan-generator/references/task-contract.md"
        ).read_text(encoding="utf-8")
        delivery = (
            PLUGINS
            / "development/skills/github-development-plan-generator/references/delivery-and-audit.md"
        ).read_text(encoding="utf-8")
        patch = (
            PLUGINS
            / "development/skills/source-patch-implementation/SKILL.md"
        ).read_text(encoding="utf-8")

        self.assertIn("每个 Task 完成且当前 Task 的 Regression / Acceptance 满足后", skill)
        self.assertIn("### Git Commit", task_contract)
        self.assertIn("当前 Task 的 Write Set", task_contract)
        self.assertIn("创建一个只包含当前 Task 变更的本地 Git commit", delivery)
        self.assertIn("若当前是项目真实 Git 工作区，必须创建一个本地 Git commit", patch)
        self.assertIn("synthetic_local_baseline", patch)
        self.assertIn("未授权不 push/merge/release/deploy", delivery)


if __name__ == "__main__":
    unittest.main()
