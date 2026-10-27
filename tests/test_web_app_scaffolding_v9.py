from __future__ import annotations

import hashlib
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "plugins/web-app-scaffolding/skills/react-nestjs-fullstack-scaffold"
TEMPLATE = SKILL / "assets/fullstack-monorepo-template-v9"

EXPECTED_COUNT = 155
EXPECTED_TREE_SHA256 = "7ab1e1422a075c5cb384da6dcd3ba886840b88d380a30431bc37aa74f4e1de0c"


class FullstackTemplateV9Tests(unittest.TestCase):
    def test_frozen_source_tree_has_original_content(self) -> None:
        files = sorted(
            (
                path.relative_to(TEMPLATE).as_posix(),
                hashlib.sha256(path.read_bytes()).hexdigest(),
            )
            for path in TEMPLATE.rglob("*")
            if path.is_file()
        )
        self.assertEqual(len(files), EXPECTED_COUNT)
        manifest = "".join(f"{name}:{checksum}\n" for name, checksum in files)
        self.assertEqual(
            hashlib.sha256(manifest.encode()).hexdigest(), EXPECTED_TREE_SHA256
        )

    def test_entrypoints_and_sqlite_baseline(self) -> None:
        self.assertTrue((TEMPLATE / "AGENTS.md").is_file())
        self.assertTrue((TEMPLATE / ".github/workflows/ci.yml").is_file())
        self.assertTrue((TEMPLATE / "pnpm-lock.yaml").is_file())
        self.assertTrue((TEMPLATE / "apps/web/src/router.tsx").is_file())
        self.assertTrue((TEMPLATE / "apps/api/drizzle/0000_initial.sql").is_file())
        self.assertTrue((TEMPLATE / "packages/contracts/src/index.ts").is_file())
        self.assertIn(
            "dialect: 'sqlite'",
            (TEMPLATE / "apps/api/drizzle.config.ts").read_text(),
        )

    def test_skill_routes_to_saved_v9_baseline(self) -> None:
        skill = (SKILL / "SKILL.md").read_text()
        reference = (SKILL / "references/template-v9.md").read_text()
        self.assertIn("assets/fullstack-monorepo-template-v9/", skill)
        self.assertIn("references/template-v9.md", skill)
        self.assertIn("SQLite", reference)


if __name__ == "__main__":
    unittest.main()
