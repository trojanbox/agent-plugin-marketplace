"""Contract and routing checks for tools/linux-systemd-timer; no real timers are touched."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / 'plugins' / 'tools'
SKILLS = PLUGIN / 'skills' / 'linux-systemd-timer'
SCRIPT = PLUGIN / 'shared' / 'scripts' / 'systemd-timer.mjs'
CORE_SCRIPT = PLUGIN / 'shared' / 'scripts' / 'systemd-user.mjs'


def node_json(*args: str, success: bool = True) -> dict:
    process = subprocess.run(['node', *args], cwd=ROOT, text=True, capture_output=True)
    if success and process.returncode:
        raise AssertionError(process.stderr or process.stdout)
    return json.loads(process.stdout)


class SystemdTimerContractTests(unittest.TestCase):
    def test_skill_is_separate_from_long_running_service_and_discoverable(self) -> None:
        catalog = node_json('skill-runtime.js', 'catalog', '--json')
        ids = {entry['id'] for entry in catalog['skills']}
        self.assertIn('tools/linux-systemd-timer', ids)
        self.assertIn('tools/linux-systemd-user', ids)
        self.assertEqual(catalog['publicSkillCount'], 66)
        direct = node_json('skill-runtime.js', 'skill', 'tools/linux-systemd-timer')['skill']
        self.assertEqual(direct['phase'], 'operations')
        self.assertEqual(direct['plugin'], 'tools')
        self.assertNotIn('linux-systemd-user', direct['uses'])
        self.assertIn('定时', direct['description'])
        self.assertIn('每天', direct['description'])
        self.assertLess(len(direct['description']), 201)
        self.assertIn('GitHub', direct['description'])
        tool = node_json('skill-runtime.js', 'list', 'tools', '--json')
        self.assertEqual(tool['publicSkillCount'], 7)
        self.assertEqual(node_json('skill-runtime.js', 'doctor')['skillCount'], 67)

    def test_skill_uses_progressive_references_and_explicit_dialogue(self) -> None:
        text = (SKILLS / 'SKILL.md').read_text(encoding='utf-8')
        for file in ('guided-creation.md', 'operations.md', 'security-and-results.md'):
            self.assertIn('references/' + file, text)
            self.assertTrue((SKILLS / 'references' / file).is_file())
        self.assertLess(len(text), 5000)
        for term in ('默认', '对话', '确认', 'Persistent=no', 'systemd-analyze calendar',
                     '无人登录', 'oneshot', 'github'):
            self.assertIn(term.lower(), text.lower())
        guide = (SKILLS / 'references' / 'guided-creation.md').read_text(encoding='utf-8')
        steps = ['## 阶段 1：', '## 阶段 2：', '## 阶段 3：', '## 阶段 4：']
        offsets = [guide.index(step) for step in steps]
        self.assertEqual(offsets, sorted(offsets))
        for term in ('只问', '最终确认', '时区', '下 3 次', '无写操作', 'Persistent=yes',
                     'linger', '错过', '修改配套启动程序', 'GitHub'):
            self.assertIn(term, guide)

    def test_cli_is_json_and_existing_user_service_remains_available(self) -> None:
        help_json = node_json(str(SCRIPT), '--help')
        self.assertTrue(help_json['ok'])
        self.assertIn('calendar EXPR', help_json['help'])
        self.assertIn('run-now NAME --confirm yes', help_json['help'])
        invalid = node_json(str(SCRIPT), 'create', '../etc', '--calendar', 'daily', success=False)
        self.assertEqual(invalid['status'], 'invalid_input')
        self.assertFalse(invalid['ok'])
        bad_confirm = node_json(str(SCRIPT), 'run-now', 'test123', success=False)
        self.assertEqual(bad_confirm['status'], 'invalid_input')
        user_service = node_json(str(CORE_SCRIPT), '--help')
        self.assertIn('start|stop|restart NAME', user_service['help'])
        self.assertIn('systemd --user', user_service['help'])

    def test_documentation_and_distribution_metadata_match(self) -> None:
        plugin = json.loads((PLUGIN / 'plugin.json').read_text(encoding='utf-8'))
        self.assertEqual(plugin['version'], '2.5.0')
        self.assertIn('Timer', plugin['description'])
        root_readme = (ROOT / 'README.md').read_text(encoding='utf-8')
        tool_readme = (PLUGIN / 'README.md').read_text(encoding='utf-8')
        for text in (root_readme, tool_readme):
            self.assertIn('linux-systemd-timer', text)
        for term in ('Persistent=no', 'enable --now', 'systemd-analyze calendar',
                     'Type=oneshot', '无需自己编写', 'linger=yes'):
            self.assertIn(term, tool_readme)
        for relative in ('plugins/tools/.codex-plugin/plugin.json',
                         'plugins/tools/.claude-plugin/plugin.json'):
            artifact = json.loads((ROOT / relative).read_text(encoding='utf-8'))
            self.assertEqual(artifact['version'], '2.5.0')

    def test_semantic_eval_has_neighbor_gate_and_multiturn_cases(self) -> None:
        corpus = (ROOT / 'tests' / 'systemd-timer-semantic-routing-eval.md').read_text(encoding='utf-8')
        for tag in ('positive', 'negative', 'adversarial', 'multi-turn', 'gate', 'conflict', 'sequence'):
            self.assertIn(tag, corpus)
        for phrase in ('GitHub 待办', 'systemd-user', '漏执行', 'OnCalendar', 'linger',
                       '只问缺项', '最终确认', '不使用 sudo'):
            self.assertIn(phrase, corpus)


if __name__ == '__main__':
    unittest.main()
