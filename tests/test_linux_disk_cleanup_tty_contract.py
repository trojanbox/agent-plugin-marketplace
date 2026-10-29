"""Real PTY flow tests for disk cleanup, using a disposable HOME only.

PTY automation proves the terminal gate functions, not that an input came
from an independently authenticated human. Full same-UID adversary resistance
requires host-level trustworthy approval.
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

SCRIPT = Path(__file__).resolve().parents[1] / "plugins/tools/shared/scripts/linux-disk-cleanup.mjs"
NODE = shutil.which("node")


@unittest.skipUnless(sys.platform.startswith("linux") and NODE, "Requires Linux and Node.js")
class DiskCleanupTtyIntegrationTests(unittest.TestCase):
    def test_valid_plan_fails_headless_and_requires_terminal_challenge(self):
        with tempfile.TemporaryDirectory(prefix="disk-tty-contract-") as home:
            root = Path(home) / ".cache"
            root.mkdir(mode=0o700)
            file = root / "old-cache.bin"
            file.write_text("disposable-test-cache", encoding="utf-8")
            past = time.time() - 90 * 86400
            os.utime(file, (past, past))
            env = {**os.environ, "HOME": home}
            scan = subprocess.run([NODE, str(SCRIPT), "scan"], env=env,
                                  capture_output=True, text=True, check=True, timeout=10)
            plan = json.loads(scan.stdout)["plan"]
            cmd = [NODE, str(SCRIPT), "clean", "--plan", plan]
            denied = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=10)
            self.assertNotEqual(denied.returncode, 0)
            self.assertEqual(json.loads(denied.stdout)["status"], "approval_required")
            self.assertTrue(file.exists())

            # Simulate a person at a physical TTY, purely in disposable test HOME.
            pid, fd = pty.fork()
            if pid == 0:
                os.execve(NODE, cmd, env)
            transcript = bytearray()
            exit_status = None
            try:
                deadline = time.monotonic() + 10
                prompt_seen = False
                while time.monotonic() < deadline:
                    readable, _, _ = select.select([fd], [], [], 0.3)
                    if readable:
                        try:
                            chunk = os.read(fd, 65536)
                        except OSError as error:
                            if error.errno == errno.EIO:
                                _, exit_status = os.waitpid(pid, 0)
                                break
                            raise
                        if not chunk:
                            break
                        transcript.extend(chunk)
                        if b"> " in transcript and not prompt_seen:
                            prompt_seen = True
                            expected = f"DELETE user-cache {plan[:12]}\n".encode("utf-8")
                            os.write(fd, expected)
                    done, status = os.waitpid(pid, os.WNOHANG)
                    if done == pid:
                        exit_status = status
                        break
                if exit_status is None:
                    os.kill(pid, 9)
                    _, exit_status = os.waitpid(pid, 0)
                    self.fail("Interactive cleanup did not complete in time: " +
                              transcript.decode("utf-8", errors="replace")[-1200:])
                self.assertTrue(prompt_seen)
                self.assertTrue(os.WIFEXITED(exit_status))
                self.assertEqual(os.WEXITSTATUS(exit_status), 0,
                                 transcript.decode("utf-8", errors="replace")[-1000:])
                self.assertFalse(file.exists())
            finally:
                os.close(fd)


if __name__ == "__main__":
    unittest.main()
