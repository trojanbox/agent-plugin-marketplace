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
RUN = ROOT / "scripts" / "export_branch_patch.py"


def invoke(payload: dict) -> tuple[int, dict]:
    proc = subprocess.run(
        [sys.executable, str(RUN)],
        input=json.dumps(payload),
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
        timeout=120,
    )
    if not proc.stdout.strip():
        raise AssertionError(f"script returned no JSON: {proc.stderr}")
    return proc.returncode, json.loads(proc.stdout)


def git(cwd: Path, *args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=cwd, text=True).strip()


def create_repo(root: Path) -> tuple[Path, str]:
    source = root / "source"
    source.mkdir()
    subprocess.run(["git", "init", "-b", "dev"], cwd=source, check=True, stdout=subprocess.DEVNULL)
    git(source, "config", "user.email", "test@example.com")
    git(source, "config", "user.name", "Test")

    (source / "base.txt").write_text("base\n", encoding="utf-8")
    git(source, "add", "base.txt")
    git(source, "commit", "-m", "base")
    fork = git(source, "rev-parse", "HEAD")

    git(source, "switch", "-c", "fix/toolbar-noop-writeback")
    (source / "base.txt").write_text("base\nfeature\n", encoding="utf-8")
    (source / "new.bin").write_bytes(bytes(range(32)))
    git(source, "add", "base.txt", "new.bin")
    git(source, "commit", "-m", "feature one")
    (source / "renamed.txt").write_text("rename target\n", encoding="utf-8")
    git(source, "add", "renamed.txt")
    git(source, "commit", "-m", "feature two")

    git(source, "switch", "dev")
    (source / "dev-only.txt").write_text("dev advanced\n", encoding="utf-8")
    git(source, "add", "dev-only.txt")
    git(source, "commit", "-m", "dev advanced")
    return source, fork


class BranchPatchSkillTests(unittest.TestCase):
    def test_status_cleans_stale_outputs(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            stale = Path(td) / "git-branch-patch-bundle-export" / "exports" / "old.zip"
            stale.parent.mkdir(parents=True)
            stale.write_bytes(b"old")
            old = time.time() - 90000
            os.utime(stale, (old, old))
            code, result = invoke({"skill_action": "status", "temp_root": td})
            self.assertEqual(code, 0, result)
            self.assertEqual(result["cleanup"]["removed_count"], 1)
            self.assertFalse(stale.exists())

    def test_resolve_direct_repository(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            source, _ = create_repo(Path(td))
            code, result = invoke({
                "skill_action": "resolve",
                "repo": str(source),
                "temp_root": td,
            })
            self.assertEqual(code, 0, result)
            self.assertEqual(result["source_type"], "local")
            self.assertEqual(result["resolved_source"], source.resolve().as_uri())

    def test_reject_embedded_credentials(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            code, result = invoke({
                "skill_action": "resolve",
                "repo": "https://user:secret@example.com/repo.git",
                "temp_root": td,
            })
            self.assertNotEqual(code, 0)
            self.assertEqual(result["code"], "credentials_in_url")

    def test_auto_analysis_selects_dev(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            source, fork = create_repo(root)
            code, result = invoke({
                "skill_action": "analyze",
                "repo": str(source),
                "target_branch": "fix/toolbar-noop-writeback",
                "temp_root": td,
            })
            self.assertEqual(code, 0, result)
            analysis = result["analysis"]
            self.assertEqual(analysis["selected_base_branch"], "dev")
            self.assertEqual(analysis["merge_base"], fork)
            self.assertEqual(analysis["target_ahead"], 2)
            self.assertEqual(analysis["base_ahead"], 1)
            self.assertEqual(analysis["base_inference"]["mode"], "automatic")

    def test_export_bundle_and_patch_verification(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            source, fork = create_repo(root)
            code, result = invoke({
                "skill_action": "export",
                "repo": str(source),
                "target_branch": "fix/toolbar-noop-writeback",
                "temp_root": td,
                "archive_name": "vcp-fix-toolbar-noop-writeback.zip",
            })
            self.assertEqual(code, 0, result)
            self.assertEqual(result["analysis"]["merge_base"], fork)
            self.assertEqual(result["verification"]["apply_check"], "ok")
            self.assertTrue(result["verification"]["tree_match"])
            bundle = Path(result["archive_path"])
            self.assertTrue(bundle.exists())
            with zipfile.ZipFile(bundle) as zf:
                self.assertEqual(sorted(zf.namelist()), ["content.patch", "source-origin.zip"])
                patch = zf.read("content.patch")
                origin_bytes = zf.read("source-origin.zip")
            self.assertGreater(len(patch), 0)
            self.assertGreater(len(origin_bytes), 0)
            inner = root / "origin.zip"
            inner.write_bytes(origin_bytes)
            with zipfile.ZipFile(inner) as zf:
                names = zf.namelist()
            self.assertTrue(any(name.endswith("base.txt") for name in names))
            self.assertFalse(any(name.endswith("dev-only.txt") for name in names))
            self.assertFalse(any(".git" in Path(name).parts for name in names))

    def test_explicit_base_has_high_confidence(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            source, _ = create_repo(root)
            code, result = invoke({
                "skill_action": "analyze",
                "repo": str(source),
                "target_branch": "fix/toolbar-noop-writeback",
                "base_branch": "dev",
                "temp_root": td,
            })
            self.assertEqual(code, 0, result)
            inference = result["analysis"]["base_inference"]
            self.assertEqual(inference["mode"], "explicit")
            self.assertEqual(inference["confidence"], "high")


if __name__ == "__main__":
    unittest.main()
