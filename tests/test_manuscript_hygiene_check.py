from __future__ import annotations

from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "plugins/writing/shared/fiction/scripts/manuscript-hygiene-check.py"


class ManuscriptHygieneCheckTests(unittest.TestCase):
    def run_check(self, directory: Path, *extra: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), str(directory), *extra],
            text=True,
            capture_output=True,
            check=False,
        )

    def test_clean_numbered_manuscript_passes_with_fixed_ending(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "001.md").write_text("# 第一章　开始\n\n“你好。⃝\n", encoding="utf-8")
            (root / "002.md").write_text(
                "# 第二章　结束\n\n空白输入框。\n\n闪烁光标。\n", encoding="utf-8"
            )
            result = self.run_check(
                root,
                "--expect-penultimate-line", "空白输入框。",
                "--expect-final-line", "闪烁光标。",
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("OK files=2", result.stdout)

    def test_checker_reports_mechanical_failures(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "001.md").write_text(
                "# 第一章　开始  \n\n“你好。 下一句\n", encoding="utf-8"
            )
            (root / "003.md").write_text("# 第三章　跳号\n", encoding="utf-8")
            result = self.run_check(root)
            self.assertEqual(result.returncode, 1)
            self.assertIn("TRAILING_WHITESPACE", result.stdout)
            self.assertIn("SPACE_AFTER_CJK_PUNCT", result.stdout)
            self.assertIn("UNBALANCED_DOUBLE_QUOTE", result.stdout)
            self.assertIn("CHAPTER_SEQUENCE_GAP", result.stdout)


if __name__ == "__main__":
    unittest.main()
