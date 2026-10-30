"""Contract checks for a constrained Linux disk cleanup Skill and CLI.

These tests do not delete any real user cache. Real file deletion is verified
only in the Node test suite's temporary-home fixture.
"""
from __future__ import annotations
import json
import subprocess
from pathlib import Path
from runtime_test_helpers import public_skill_count, internal_skill_count, total_skill_count
import unittest

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "plugins" / "tools"
SKILL = TOOLS / "skills" / "linux-disk-cleanup"
SCRIPT = TOOLS / "shared" / "scripts" / "linux-disk-cleanup.mjs"


def node(*args: str, check: bool = True) -> dict:
    result = subprocess.run(["node", *args], cwd=ROOT, text=True, capture_output=True)
    if check and result.returncode:
        raise AssertionError(result.stderr or result.stdout)
    return json.loads(result.stdout)


class DiskCleanupContractTests(unittest.TestCase):
    def test_skill_is_unique_and_routable(self):
        catalog = node("skill-runtime.js", "catalog", "--json")
        ids = {x["id"] for x in catalog["skills"]}
        self.assertIn("tools/linux-disk-cleanup", ids)
        self.assertIn("tools/linux-systemd-timer", ids)
        self.assertIn("tools/linux-systemd-user", ids)
        self.assertEqual(catalog["publicSkillCount"], public_skill_count())
        disk = node("skill-runtime.js", "skill", "tools/linux-disk-cleanup")["skill"]
        self.assertEqual(disk["plugin"], "tools")
        self.assertEqual(disk["phase"], "operations")
        self.assertIn("磁盘", disk["description"])
        self.assertIn("清理", disk["description"])
        self.assertIn("缓存", disk["description"])
        self.assertLessEqual(len(disk["description"]), 200)
        self.assertEqual(disk["uses"], [])
        tools = node("skill-runtime.js", "list", "tools", "--json")
        self.assertEqual(tools["publicSkillCount"], 8)
        self.assertEqual(node("skill-runtime.js", "doctor")["skillCount"], total_skill_count())

    def test_main_skill_is_thin_with_progressive_refs_and_no_auto_delete(self):
        source = (SKILL / "SKILL.md").read_text(encoding="utf8")
        self.assertLess(len(source), 5000)
        self.assertIn("明确用户确认", source)
        for name in ["guided-cleanup.md", "operations.md", "security-and-results.md"]:
            self.assertIn("references/" + name, source)
            self.assertTrue((SKILL / "references" / name).is_file())
        for phrase in ["user-cache", "npm-cache", "npm-logs", "30 天", "不调用 sudo",
                       "源码", "指纹", "report", "scan", "clean"]:
            self.assertIn(phrase, source)

    def test_guided_sequence_protects_review_and_authorization(self):
        guide = (SKILL / "references" / "guided-cleanup.md").read_text(encoding="utf8")
        headings = ["## 1. ", "## 2. ", "## 3. ", "## 4. "]
        positions = [guide.index(h) for h in headings]
        self.assertEqual(positions, sorted(positions))
        for phrase in ["只读", "一个关键问题", "无法撤销", "SHA256", "确认", "stale_plan",
                       "truncated", "partial_change", "sudo", "没有自动清理功能"]:
            self.assertIn(phrase, guide)

    def test_cli_requires_plan_and_no_user_paths(self):
        help_out = node(str(SCRIPT), "--help")
        self.assertTrue(help_out["ok"])
        self.assertIn("scan", help_out["help"])
        self.assertIn("clean", help_out["help"])
        self.assertIn("TTY", help_out["help"])
        self.assertIn("npm cache verify", help_out["help"])
        missing = node(str(SCRIPT), "clean", "--confirm", "yes", check=False)
        self.assertEqual(missing["status"], "invalid_input")
        bypass = node(str(SCRIPT), "clean", "--plan", "a"*64, "--confirm", "yes", check=False)
        self.assertEqual(bypass["status"], "invalid_input")
        bad_age = node(str(SCRIPT), "scan", "--scope", "npm-cache", "--older-than", "30", check=False)
        self.assertEqual(bad_age["status"], "invalid_input")
        bad_scope = node(str(SCRIPT), "scan", "--scope", "/tmp", check=False)
        self.assertEqual(bad_scope["status"], "invalid_input")
        cmd = node(str(SCRIPT), "scan", "--path", "/etc", check=False)
        self.assertEqual(cmd["status"], "invalid_input")

    def test_docs_and_plugin_release_are_aligned(self):
        plugin = json.loads((TOOLS / "plugin.json").read_text(encoding="utf8"))
        self.assertEqual(plugin["version"], "2.6.0")
        self.assertIn("磁盘", plugin["description"])
        root_doc = (ROOT / "README.md").read_text(encoding="utf8")
        tools_doc = (TOOLS / "README.md").read_text(encoding="utf8")
        for source in (root_doc, tools_doc):
            self.assertIn("linux-disk-cleanup", source)
        for phrase in ["--older-than 30", "--plan", "TTY", "npm cache verify", "node_modules", "Docker",
                       "仅支持", "指纹", "systemd"]:
            self.assertIn(phrase, tools_doc)
        for rel in ["plugins/tools/.claude-plugin/plugin.json", "plugins/tools/.codex-plugin/plugin.json"]:
            artifact = json.loads((ROOT / rel).read_text(encoding="utf8"))
            self.assertEqual(artifact["version"], "2.6.0")

    def test_routing_regression_contains_neighbor_consent_and_multi_turn(self):
        eval_text = (ROOT / "tests" / "linux-disk-cleanup-semantic-routing-eval.md").read_text(encoding="utf8")
        for bucket in ["positive", "negative", "adversarial", "gate",
                       "multi-turn", "sequence", "conflict"]:
            self.assertIn(bucket, eval_text)
        for phrase in ["GitHub", "systemd-user", "systemd-timer", "stale_plan", "Docker",
                       "再次确认", "scan_limit", "只读", "C35 gate", "C36 gate", "C37 gate"]:
            self.assertIn(phrase, eval_text)


if __name__ == "__main__":
    unittest.main()
