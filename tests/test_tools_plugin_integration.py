"""Repository contracts for the tools migration; no account credentials or network."""
from __future__ import annotations
import json
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / 'plugins' / 'tools'


def node_json(*arguments: str, check: bool = True) -> dict:
    result = subprocess.run(['node', *arguments], cwd=ROOT, text=True, capture_output=True)
    if check and result.returncode:
        raise AssertionError(result.stderr or result.stdout)
    return json.loads(result.stdout)


class ToolsPluginIntegrationTests(unittest.TestCase):
    def test_tools_is_single_plugin_with_two_public_skills(self) -> None:
        manifest = json.loads((ROOT / 'marketplace.json').read_text(encoding='utf-8'))
        names = [p['name'] for p in manifest['plugins']]
        self.assertEqual(names.count('tools'), 1)
        self.assertNotIn('email', names)
        self.assertIn('github', names)
        self.assertFalse((ROOT / 'plugins' / 'email').exists())
        plugin = node_json('skill-runtime.js', 'list', 'tools', '--json')
        self.assertEqual(plugin['publicSkillCount'], 2)
        self.assertEqual({s['name'] for s in plugin['ungroupedSkills']}, {'email-mail', 'youtube-download'})
        self.assertEqual(plugin['internalSkillCount'], 0)

    def test_old_email_id_is_not_exposed_and_new_ids_are_discoverable(self) -> None:
        catalog = node_json('skill-runtime.js', 'catalog', '--json')
        ids = {s['id'] for s in catalog['skills']}
        self.assertIn('tools/email-mail', ids)
        self.assertIn('tools/youtube-download', ids)
        self.assertNotIn('email/email-mail', ids)
        self.assertIn('github/github-issue-manager', ids)
        self.assertEqual(catalog['publicSkillCount'], 64)
        for name in ('email-mail', 'youtube-download'):
            data = node_json('skill-runtime.js', 'skill', 'tools/' + name)
            self.assertEqual(data['skill']['phase'], 'operations')
            self.assertEqual(data['skill']['pluginRoot'], str(TOOLS))

    def test_generated_host_manifests_publish_tools_not_the_removed_plugin(self) -> None:
        for location in ('.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json'):
            document = json.loads((ROOT / location).read_text(encoding='utf-8'))
            names = [p['name'] for p in document['plugins']]
            self.assertIn('tools', names)
            self.assertNotIn('email', names)
        for location in ('.claude-plugin/plugin.json', '.codex-plugin/plugin.json'):
            self.assertEqual(json.loads((TOOLS / location).read_text(encoding='utf-8'))['name'], 'tools')

    def test_email_configuration_keeps_its_original_home_location(self) -> None:
        program = """import path from 'node:path';
import {configLocation} from './plugins/tools/shared/scripts/email.mjs';
console.log(JSON.stringify({linux:configLocation('/home/user'),windows:configLocation('D:\\\\用户 名',path.win32)}));"""
        data = node_json('--input-type=module', '-e', program)
        self.assertEqual(data['linux']['file'], '/home/user/.agent-plugin-marketplace/email/config.toml')
        self.assertTrue(data['windows']['file'].endswith('\\.agent-plugin-marketplace\\email\\config.toml'))
        self.assertNotIn('tools', data['linux']['directory'])

    def test_cli_help_and_invalid_request_need_no_dependencies_or_network(self) -> None:
        script = str(TOOLS / 'shared' / 'scripts' / 'youtube.mjs')
        result = node_json(script, '--help')
        self.assertTrue(result['ok'])
        self.assertIn('subtitles URL', result['help'])
        invalid = node_json(script, 'video', 'https://example.com/not-youtube', check=False)
        self.assertFalse(invalid['ok'])
        self.assertEqual(invalid['status'], 'unsupported_url')

    def test_runtime_and_skill_entry_remain_thin_and_focused(self) -> None:
        skill = (TOOLS / 'skills' / 'youtube-download' / 'SKILL.md').read_text(encoding='utf-8')
        for reference in ('operations.md', 'dependencies.md', 'security-and-results.md'):
            self.assertIn('references/' + reference, skill)
            self.assertTrue((TOOLS / 'skills' / 'youtube-download' / 'references' / reference).exists())
        self.assertIn('phase: operations', skill)
        self.assertIn('不跨语言回退', skill)
        self.assertLess(len(skill), 5000)
        doctor = node_json('skill-runtime.js', 'doctor')
        self.assertTrue(doctor['ok'])
        self.assertEqual(doctor['skillCount'], 65)
        self.assertEqual(doctor['contractIssues'], [])

    def test_email_migration_documents_do_not_change_user_data_root(self) -> None:
        setup = (TOOLS / 'skills' / 'email-mail' / 'references' / 'setup.md').read_text(encoding='utf-8')
        self.assertIn('.agent-plugin-marketplace/email/config.toml', setup)
        self.assertIn('plugins/tools/shared/scripts/email.mjs', setup)
        self.assertNotIn('plugins/email/', setup)
        readme = (ROOT / 'README.md').read_text(encoding='utf-8')
        self.assertIn('claude plugin install tools@agent-plugin-marketplace', readme)
        self.assertIn('不需要重新配置邮箱', readme)

    def test_releases_are_pinned_and_no_bundled_executables_or_credentials_are_shipped(self) -> None:
        releases = json.loads((TOOLS / 'shared' / 'scripts' / 'youtube-releases.json').read_text(encoding='utf-8'))
        self.assertEqual(set(releases['tools']), {'ytdlp', 'ffmpeg', 'deno'})
        for tool in releases['tools'].values():
            for asset in tool['assets'].values():
                self.assertRegex(asset['sha256'], r'^[0-9a-f]{64}$')
                self.assertNotIn('/latest/', asset['url'])
                self.assertTrue(asset['url'].startswith('https://github.com/'))
        self.assertFalse(list(TOOLS.rglob('*.exe')))
        self.assertFalse(list(TOOLS.rglob('config.toml')))


if __name__ == '__main__':
    unittest.main()
