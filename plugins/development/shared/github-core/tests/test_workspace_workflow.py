from __future__ import annotations

import argparse
import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "workspace_workflow.py"
spec = importlib.util.spec_from_file_location("github_workflow", SCRIPT)
workflow = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(workflow)


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
