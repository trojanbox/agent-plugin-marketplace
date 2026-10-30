"""Linux Ops publication contracts and real, isolated Linux terminal integration.

All files and secret sentinels live in TemporaryDirectory; no real .env is read.
"""
from __future__ import annotations
import errno
import json
import os
from pathlib import Path
import pty
import select
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
from runtime_test_helpers import public_skill_count, total_skill_count

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / 'plugins' / 'tools'
SKILL = TOOLS / 'skills' / 'linux-ops'
CLI = TOOLS / 'shared' / 'scripts' / 'linux-ops.mjs'
NODE = shutil.which('node')

def node_json(*args, check=True):
    p = subprocess.run([NODE, *map(str, args)], cwd=ROOT, capture_output=True, text=True, timeout=15)
    if check and p.returncode:
        raise AssertionError(p.stderr or p.stdout)
    return json.loads(p.stdout)

class LinuxOpsContractTests(unittest.TestCase):
    def test_runtime_exposes_one_generic_ops_skill_not_the_rejected_profile_prototype(self):
        listing = node_json('skill-runtime.js', 'list', 'tools', '--json')
        names = {s['name'] for s in listing['ungroupedSkills']}
        self.assertIn('linux-ops', names)
        self.assertNotIn('environment-preparation', names)
        self.assertEqual(listing['publicSkillCount'], 8)
        for neighbor in ('email-mail', 'onedrive-files', 'linux-disk-cleanup', 'linux-systemd-user', 'linux-systemd-timer'):
            self.assertIn(neighbor, names)
        d = node_json('skill-runtime.js', 'doctor')
        self.assertTrue(d['ok'])
        self.assertEqual(d['publicSkillCount'], public_skill_count())
        self.assertEqual(d['skillCount'], total_skill_count())
        self.assertEqual(d['contractIssues'], [])
        skill = node_json('skill-runtime.js', 'skill', 'tools/linux-ops')['skill']
        self.assertEqual(skill['phase'], 'operations')
        self.assertEqual(skill['uses'], [])
        self.assertLessEqual(len(skill['description']), 200)

    def test_progressive_docs_cover_current_user_contract_and_not_db_only(self):
        text = (SKILL / 'SKILL.md').read_text()
        self.assertLess(len(text), 5000)
        for name in ('workflow.md', 'cli.md', 'project-environment.md', 'security-and-results.md'):
            self.assertIn('references/' + name, text)
            self.assertTrue((SKILL / 'references' / name).is_file())
        for needle in ('~/.linux-ops/', 'bin/', '完整 Shell', '--prefix', 'stdout', 'stderr', '不重复授权'):
            self.assertIn(needle, text)
        project = (SKILL / 'references' / 'project-environment.md').read_text()
        for needle in ('Vite', 'Next.js', '项目键避让', '--mode', '--project-env off', '--cwd'):
            self.assertIn(needle, project)
        self.assertFalse((TOOLS / 'skills' / 'environment-preparation').exists())
        self.assertFalse((TOOLS / 'shared' / 'scripts' / 'environment-preparation.mjs').exists())

    def test_help_and_rejected_inputs_are_safe_without_reading_configuration(self):
        help_text = node_json(CLI, '--help')['help']
        for needle in ('config set KEY', 'scripts put NAME', 'exec', 'run NAME', '--project-env', 'Bash'):
            self.assertIn(needle, help_text)
        for args in [
            ['config','get','SECRET'], ['config','list','--reveal'],
            ['config','set','DEV_PASS','PLAINTEXT_SENTINEL'],
            ['scripts','put','../escape','--stdin'], ['profiles'], ['db-check','test'],
        ]:
            r = node_json(CLI, *args, check=False)
            self.assertEqual(r['status'], 'invalid_input')
            self.assertNotIn('PLAINTEXT_SENTINEL', json.dumps(r))

    def test_metadata_readme_and_host_manifests_agree(self):
        meta = json.loads((TOOLS / 'plugin.json').read_text())
        self.assertEqual(meta['version'], '2.6.0')
        self.assertIn('Linux', meta['description'])
        for filename in ('README.md', 'plugins/tools/README.md'):
            doc = (ROOT / filename).read_text()
            self.assertIn('tools/linux-ops', doc)
            self.assertIn('~/.linux-ops', doc)
            self.assertNotIn('tools/environment-preparation', doc)
        for filename in ('.claude-plugin/plugin.json', '.codex-plugin/plugin.json'):
            self.assertEqual(json.loads((TOOLS / filename).read_text())['version'], meta['version'])
        ignores = (ROOT / '.gitignore').read_text()
        self.assertIn('\n.env\n', ignores)
        self.assertIn('!.env.example', ignores)

    def test_semantic_evidence_covers_regression_neighbors_and_new_script_goal(self):
        corpus = (ROOT / 'tests' / 'linux-ops-semantic-routing-eval.md').read_text()
        for bucket in ('regression', 'positive', 'negative', 'composition', 'conflict', 'gate', 'multi-turn'):
            self.assertIn(bucket, corpus)
        for marker in ('bin/', '前缀', '完整', 'pnpm dev', 'OneDrive', 'GitHub', '单次'):
            self.assertIn(marker, corpus)

@unittest.skipUnless(sys.platform.startswith('linux') and NODE and os.getuid() != 0, 'Linux non-root and Node required')
class LinuxOpsTerminalTests(unittest.TestCase):
    def terminal(self, args, trigger, reply, cwd):
        pid, fd = pty.fork()
        if pid == 0:
            os.chdir(cwd)
            os.execve(NODE, [NODE, str(CLI), *args], os.environ.copy())
        transcript = bytearray()
        status = None
        sent = False
        try:
            until = time.monotonic() + 8
            while time.monotonic() < until:
                ready, _, _ = select.select([fd], [], [], 0.1)
                if ready:
                    try:
                        data = os.read(fd, 65536)
                    except OSError as error:
                        if error.errno == errno.EIO:
                            _, status = os.waitpid(pid, 0)
                            break
                        raise
                    if not data:
                        _, status = os.waitpid(pid, 0)
                        break
                    transcript.extend(data)
                    if not sent and trigger in transcript:
                        os.write(fd, reply)
                        sent = True
                found, child_status = os.waitpid(pid, os.WNOHANG)
                if found:
                    status = child_status
                    break
            if status is None:
                os.kill(pid, 9)
                os.waitpid(pid, 0)
                self.fail('PTY child did not complete: ' + transcript.decode('utf8', errors='replace')[-500:])
            self.assertTrue(sent)
            return os.waitstatus_to_exitcode(status), transcript.decode('utf8', errors='replace')
        finally:
            os.close(fd)

    def test_hidden_config_input_never_echoes_and_ctrl_c_preserves_file(self):
        with tempfile.TemporaryDirectory(prefix='linux-ops-pty-') as tmp:
            root = Path(tmp) / 'ops'
            node_json(CLI, '--root', root, 'init')
            secret = 'FAKE_SECRET_DO_NOT_ECHO'
            code, output = self.terminal(['--root',str(root),'config','set','DEV_SECRET'],
                                         '不回显'.encode(), (secret+'\n').encode(), tmp)
            self.assertEqual(code, 0, output)
            self.assertNotIn(secret, output)
            self.assertIn(secret, (root / '.env').read_text())
            before = (root / '.env').read_bytes()
            code, output = self.terminal(['--root',str(root),'config','set','DEV_CANCEL'],
                                         '不回显'.encode(), b'\x03', tmp)
            self.assertNotEqual(code, 0)
            self.assertEqual(before, (root / '.env').read_bytes())
            self.assertFalse((root / '.lock').exists())

    def test_interactive_shell_stdin_remains_usable_without_background_tty_stop(self):
        with tempfile.TemporaryDirectory(prefix='linux-ops-shell-pty-') as tmp:
            root = Path(tmp) / 'ops'
            node_json(CLI, '--root', root, 'init')
            code, output = self.terminal(['--root',str(root),'exec','--',
                'printf "READY\\n"; read -r value; printf "GOT:%s\\n" "$value"'],
                b'READY', b'hello-shell\n', tmp)
            self.assertEqual(code, 0, output)
            self.assertIn('GOT:hello-shell', output)
            self.assertNotIn('"ok"', output)

if __name__ == '__main__':
    unittest.main()
