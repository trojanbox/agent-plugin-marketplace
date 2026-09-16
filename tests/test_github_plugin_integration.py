"""Public discovery, standalone packaging and behavior after the plugin split."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
GITHUB = ROOT / 'plugins/github'
DEVELOPMENT = ROOT / 'plugins/development'


def run(*args, cwd=ROOT):
    return subprocess.run(args, cwd=cwd, text=True, capture_output=True, check=True)


def load_tests(loader, tests, pattern):
    # Shared CLI tests must run under the repository's normal CI entrypoint.
    for name, path in [
        ('handoff_tests', GITHUB / 'shared/tests/test_github_workflow.py'),
        ('workspace_tests', DEVELOPMENT / 'shared/github-core/tests/test_workspace_workflow.py'),
    ]:
        spec = importlib.util.spec_from_file_location(name, path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        tests.addTests(loader.loadTestsFromModule(module))
    return tests


class GitHubPluginIntegrationTests(unittest.TestCase):
    def test_public_ids_and_composition_resolve_to_single_implementation(self):
        catalog = json.loads(run('node', 'skill-runtime.js', 'doctor').stdout)
        by_id = {s['plugin'] + '/' + s['name']: s for s in catalog['skills']}
        for name in ('github-issue-manager', 'github-issue-triage', 'github-issue-handoff-sync'):
            self.assertIn('github/' + name, by_id)
            self.assertNotIn('development/' + name, by_id)
            self.assertFalse((DEVELOPMENT / 'skills' / name).exists())
        debate = by_id['reasoning/structured-debate']
        self.assertIn('github/github-issue-manager', debate['optionalUses'])
        for skill in by_id.values():
            if skill['plugin'] == 'github':
                self.assertFalse(any(dep.startswith('development/') for dep in
                                     skill['uses'] + skill['optionalUses']))

    def test_github_can_create_and_validate_handoff_when_installed_alone(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            plugin = root / 'standalone-plugin'
            shutil.copytree(GITHUB, plugin, ignore=shutil.ignore_patterns('__pycache__'))
            cli = str(plugin / 'shared/scripts/github_workflow.py')
            run(sys.executable, cli, 'handoff', 'init', '--root', str(root),
                '--bundle-id', 'debate', '--repo', 'owner/repo', cwd=root)
            bundle = root / 'debate'
            run(sys.executable, cli, 'handoff', 'add', '--bundle', str(bundle),
                '--kind', 'issue', '--title', '【辩论】组织如何决策',
                '--dedupe-status', 'not_required', cwd=root)
            run(sys.executable, cli, 'handoff', 'validate', '--bundle', str(bundle),
                '--strict', cwd=root)
            manifest = json.loads((bundle / 'manifest.json').read_text())
            entry = manifest['entries'][0]
            self.assertEqual(entry['title'], '【辩论】组织如何决策')
            self.assertEqual(entry['sync_status'], 'pending_sync')
            self.assertIn('【辩论】组织如何决策', (bundle / entry['path']).read_text())
            self.assertNotIn('workspace', run(sys.executable, cli, '--help').stdout)

    def test_development_snapshot_and_patch_work_without_github_plugin(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            cli = root / 'workspace_workflow.py'
            shutil.copy2(DEVELOPMENT / 'shared/github-core/scripts/workspace_workflow.py', cli)
            repo = root / 'repo'
            repo.mkdir()
            run('git', 'init', cwd=repo)
            source = repo / 'sample.txt'
            source.write_text('before\n')
            run('git', 'add', 'sample.txt', cwd=repo)
            run('git', '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid',
                'commit', '-m', 'baseline', cwd=repo)
            def snapshot():
                return json.loads(run(sys.executable, str(cli), 'workspace', 'snapshot',
                                      '--path', str(repo), cwd=root).stdout)
            before = snapshot()
            self.assertFalse(before['dirty'])
            self.assertEqual(before['tree_sha256'], snapshot()['tree_sha256'])
            source.write_text('after\n')
            after = snapshot()
            self.assertTrue(after['dirty'])
            self.assertNotEqual(before['tree_sha256'], after['tree_sha256'])
            patch = root / 'change.patch'
            result = json.loads(run(sys.executable, str(cli), 'patch', 'export',
                                    '--workspace', str(repo), '--output', str(patch), cwd=root).stdout)
            self.assertEqual(result['replay_check'], 'passed')
            source.write_text('before\n')
            run(sys.executable, str(cli), 'patch', 'check', '--workspace', str(repo),
                '--patch', str(patch), cwd=root)
            self.assertNotIn('handoff', run(sys.executable, str(cli), '--help').stdout)

    def test_shared_relative_references_survive_relocation(self):
        import re
        for skill in GITHUB.glob('skills/*/SKILL.md'):
            for target in re.findall(r'\.\./\.\./shared/[\w./-]+', skill.read_text()):
                self.assertTrue((skill.parent / target).resolve().is_file(), target)
