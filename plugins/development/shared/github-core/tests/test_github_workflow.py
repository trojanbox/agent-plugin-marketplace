from __future__ import annotations

import argparse
import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "github_workflow.py"
spec = importlib.util.spec_from_file_location("github_workflow", SCRIPT)
workflow = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(workflow)


class HandoffTests(unittest.TestCase):
    def test_init_add_validate(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "handoff"
            workflow.init_bundle(argparse.Namespace(
                root=str(root), bundle_id="demo", repo="owner/repo", mode="offline", force=False
            ))
            bundle = root / "demo"
            body = Path(tmp) / "body.md"
            body.write_text("## 摘要\n\n可复现。\n", encoding="utf-8")
            workflow.add_entry(argparse.Namespace(
                bundle=str(bundle), kind="issue", id="BUG-001", parent=None,
                title="【缺陷】P1 Demo", body_file=str(body), operation=None,
                depends_on=[], dedupe_status=None, sync_status=None, force=False
            ))
            errors, warnings = workflow.validate_bundle_data(bundle, strict=True)
            self.assertEqual(errors, [])
            self.assertEqual(warnings, [])
            manifest = json.loads((bundle / "manifest.json").read_text(encoding="utf-8"))
            self.assertEqual(manifest["entries"][0]["sync_status"], "blocked_by_triage")

    def test_comment_ids_are_unique_across_parents(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "handoff"
            workflow.init_bundle(argparse.Namespace(
                root=str(root), bundle_id="demo", repo="owner/repo", mode="offline", force=False
            ))
            bundle = root / "demo"
            for issue_id in ("BUG-001", "BUG-002"):
                workflow.add_entry(argparse.Namespace(
                    bundle=str(bundle), kind="issue", id=issue_id, parent=None,
                    title=issue_id, body_file=None, operation=None, depends_on=[],
                    dedupe_status=None, sync_status=None, force=False
                ))
                workflow.add_entry(argparse.Namespace(
                    bundle=str(bundle), kind="comment", id=None, parent=issue_id,
                    title="Bug follow-up", body_file=None, operation=None, depends_on=[issue_id],
                    dedupe_status=None, sync_status=None, force=False
                ))
            manifest = workflow.load_manifest(bundle)
            comment_ids = [e["handoff_id"] for e in manifest["entries"] if e["kind"] == "comment"]
            self.assertEqual(comment_ids, ["BUG-001-COMMENT-001", "BUG-002-COMMENT-001"])
            errors, _ = workflow.validate_bundle_data(bundle, strict=True)
            self.assertEqual(errors, [])

    def test_record_sync_updates_manifest_and_markdown(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "handoff"
            workflow.init_bundle(argparse.Namespace(
                root=str(root), bundle_id="demo", repo="owner/repo", mode="offline", force=False
            ))
            bundle = root / "demo"
            workflow.add_entry(argparse.Namespace(
                bundle=str(bundle), kind="issue", id="BUG-001", parent=None,
                title="Bug", body_file=None, operation=None, depends_on=[],
                dedupe_status=None, sync_status=None, force=False
            ))
            workflow.record_sync(argparse.Namespace(
                bundle=str(bundle), id="BUG-001", sync_status="synced",
                dedupe_status="unique", remote_issue_number=42,
                remote_url="https://example.invalid/42", batch="S-001"
            ))
            manifest = workflow.load_manifest(bundle)
            self.assertEqual(manifest["status"], "synced")
            self.assertEqual(manifest["entries"][0]["remote_issue_number"], 42)
            text = (bundle / "issues/BUG-001.md").read_text(encoding="utf-8")
            self.assertIn("sync_status: synced", text)
            self.assertIn("remote_issue_number: 42", text)
            errors, warnings = workflow.validate_bundle_data(bundle, strict=True)
            self.assertEqual(errors, [])
            self.assertEqual(warnings, [])

    def test_hash_change_is_warning_or_error(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "handoff"
            workflow.init_bundle(argparse.Namespace(
                root=str(root), bundle_id="demo", repo="owner/repo", mode="offline", force=False
            ))
            bundle = root / "demo"
            workflow.add_entry(argparse.Namespace(
                bundle=str(bundle), kind="triage", id="TRIAGE-001", parent=None,
                title="Triage", body_file=None, operation=None, depends_on=[],
                dedupe_status=None, sync_status=None, force=False
            ))
            path = bundle / "triage/TRIAGE-001.md"
            path.write_text(path.read_text(encoding="utf-8") + "changed\n", encoding="utf-8")
            errors, warnings = workflow.validate_bundle_data(bundle, strict=False)
            self.assertFalse(errors)
            self.assertTrue(any("sha256" in item for item in warnings))
            errors, _ = workflow.validate_bundle_data(bundle, strict=True)
            self.assertTrue(any("sha256" in item for item in errors))


class ArchiveTests(unittest.TestCase):
    def test_zip_path_traversal_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            archive = Path(tmp) / "bad.zip"
            with zipfile.ZipFile(archive, "w") as zf:
                zf.writestr("../escape.txt", "bad")
            with self.assertRaises(workflow.WorkflowError):
                workflow.extract_archive(argparse.Namespace(
                    archive=str(archive), destination=str(Path(tmp) / "out"), force=False
                ))



if __name__ == "__main__":
    unittest.main()
