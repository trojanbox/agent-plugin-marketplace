#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import time
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUN = ROOT / "scripts" / "export_snapshot.py"


def invoke(payload: dict) -> tuple[int, dict]:
    proc = subprocess.run(
        [sys.executable, str(RUN)],
        input=json.dumps(payload),
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    return proc.returncode, json.loads(proc.stdout)


def create_repo(root: Path, branch: str = "dev") -> Path:
    source = root / "source"
    source.mkdir()
    subprocess.run(["git", "init", "-b", branch], cwd=source, check=True, stdout=subprocess.DEVNULL)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=source, check=True)
    subprocess.run(["git", "config", "user.name", "Test"], cwd=source, check=True)
    (source / "hello.txt").write_text("hello\n", encoding="utf-8")
    subprocess.run(["git", "add", "hello.txt"], cwd=source, check=True)
    subprocess.run(["git", "commit", "-m", "initial"], cwd=source, check=True, stdout=subprocess.DEVNULL)
    return source


class SkillTests(unittest.TestCase):
    def test_status_and_cleanup(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            stale = Path(td) / "git-shallow-zip-export" / "exports" / "old.zip"
            stale.parent.mkdir(parents=True)
            stale.write_bytes(b"old")
            old = time.time() - 90000
            os.utime(stale, (old, old))
            code, result = invoke({"skill_action": "status", "temp_root": td})
            self.assertEqual(code, 0, result)
            self.assertTrue(result["ok"])
            self.assertEqual(result["cleanup"]["removed_count"], 1)
            self.assertFalse(stale.exists())

    def test_resolve_remote_url(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            code, result = invoke({
                "skill_action": "resolve",
                "repo": "https://example.com/group/repo.git",
                "temp_root": td,
            })
            self.assertEqual(code, 0, result)
            self.assertEqual(result["resolved_source"], "https://example.com/group/repo.git")
            self.assertEqual(result["source_type"], "remote")

    def test_reject_embedded_credentials(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            code, result = invoke({
                "skill_action": "resolve",
                "repo": "https://user:secret@example.com/repo.git",
                "temp_root": td,
            })
            self.assertNotEqual(code, 0)
            self.assertEqual(result["code"], "credentials_in_url")

    def test_resolve_local_repository(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            source = create_repo(Path(td))
            code, result = invoke({
                "skill_action": "resolve",
                "repo": str(source),
                "temp_root": td,
            })
            self.assertEqual(code, 0, result)
            self.assertEqual(result["source_type"], "local")
            self.assertEqual(result["resolved_source"], source.resolve().as_uri())

    def test_local_export(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            source = create_repo(Path(td))
            code, result = invoke({
                "skill_action": "export",
                "repo": str(source),
                "branch": "dev",
                "temp_root": td,
            })
            self.assertEqual(code, 0, result)
            self.assertEqual(result["integrity"], "ok")
            self.assertFalse(result["contains_git_metadata"])
            self.assertEqual(result["source_type"], "local")
            archive = Path(result["archive_path"])
            self.assertTrue(archive.exists())
            self.assertIn("git-shallow-zip-export", archive.parts)
            with zipfile.ZipFile(archive) as zf:
                names = zf.namelist()
            self.assertTrue(any(name.endswith("hello.txt") for name in names))
            self.assertFalse(any(".git" in Path(name).parts for name in names))


if __name__ == "__main__":
    unittest.main()
