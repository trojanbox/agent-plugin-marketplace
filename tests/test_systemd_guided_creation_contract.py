"""Guided creation workflow contract for tools/linux-systemd-user.

These tests validate the published Skill behavior and safety gates, not an LLM
or a real systemd user's service creation.
"""
from __future__ import annotations

import json
import subprocess
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "plugins" / "tools"
SKILL_ROOT = TOOLS / "skills" / "linux-systemd-user"


def content(name: str) -> str:
    return (SKILL_ROOT / name).read_text(encoding="utf-8")


class SystemdGuidedCreationContractTests(unittest.TestCase):
    def test_default_create_is_dialogue_and_cli_is_implementation(self):
        skill = content("SKILL.md")
        self.assertIn("新建服务默认对话引导", skill)
        self.assertIn("references/guided-creation.md", skill)
        self.assertIn("只问", skill)
        self.assertIn("用户确认", skill)
        self.assertLess(len(skill), 5000)
        self.assertIn("原 CLI", content("references/guided-creation.md"))

    def test_reference_explicitly_orders_phases_and_gates_writes(self):
        guide = content("references/guided-creation.md")
        phases = (
            "## 1. 只读预检",
            "## 2. 补齐缺项",
            "## 3. 配置预览与最终确认",
            "## 4. 按确认范围执行",
            "## 5. 验证与结果报告",
        )
        indexes = [guide.index(name) for name in phases]
        self.assertEqual(indexes, sorted(indexes))
        for marker in (
            "doctor", "一个关键问题", "不重复询问", "未确认前不执行写操作",
            "真实绝对路径", "服务名", "启动命令", "工作目录", "Restart=on-failure",
            "创建后是否立即启动", "用户登录后启动", "无人登录也启动",
            "linger", "必须重新预览确认",
        ):
            self.assertIn(marker, guide)

    def test_autostart_and_linger_safety_are_not_bypassed(self):
        guide = content("references/guided-creation.md")
        for marker in (
            "linger enable --confirm yes", "影响同一用户的其他服务",
            "systemctl --user", "不调用 sudo", "不把 enable 成功等同于开机自启已验证",
            "partial_change", "禁止静默覆盖", "不自动回滚",
            "只能登录后启动", "无法保证该限制",
        ):
            self.assertIn(marker, guide)
        self.assertIn("不读取或询问明文密码", guide)

    def test_conversation_examples_preserve_defaults_and_exceptions(self):
        guide = content("references/guided-creation.md")
        self.assertIn("### 示例 A：缺少启动命令", guide)
        self.assertIn("### 示例 B：已给出完整信息", guide)
        self.assertIn("### 示例 C：无登录自启", guide)
        self.assertIn("### 示例 D：环境不可用", guide)
        readme = (TOOLS / "README.md").read_text(encoding="utf-8")
        self.assertIn("对话引导", readme)
        self.assertIn("无需手动拼接 CLI 参数", readme)
        self.assertIn("原 CLI", readme)

    def test_runtime_description_routes_natural_language_creation(self):
        process = subprocess.run(
            ["node", "skill-runtime.js", "skill", "tools/linux-systemd-user"],
            cwd=ROOT, capture_output=True, check=True, text=True,
        )
        desc = json.loads(process.stdout)["skill"]["description"]
        self.assertIn("默认对话引导", desc)
        self.assertIn("开机自启", desc)
        self.assertLessEqual(len(desc), 200)

    def test_semantic_evidence_includes_multi_turn_and_neighbor_regression(self):
        corpus = (ROOT / "tests" / "systemd-user-semantic-routing-eval.md").read_text(encoding="utf-8")
        self.assertIn("对话引导增量回归", corpus)
        for phrase in ("已知参数", "只问缺项", "最终确认", "无登录自启", "不请求 sudo", "GitHub 待办"):
            self.assertIn(phrase, corpus)


if __name__ == "__main__":
    unittest.main()
