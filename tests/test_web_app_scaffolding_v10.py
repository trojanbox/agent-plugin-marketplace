from pathlib import Path
import hashlib
import unittest

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / 'plugins/web-app-scaffolding/skills/react-nestjs-fullstack-scaffold'
V10 = SKILL / 'assets/fullstack-monorepo-template-v10'
V9 = SKILL / 'assets/fullstack-monorepo-template-v9'


class V10PostgreSqlTemplateTest(unittest.TestCase):
    def test_pg_schema_and_lifecycle_fields(self):
        auth = (V10/'apps/api/src/modules/infrastructure/database/schema/auth.schema.ts').read_text()
        catalog = (V10/'apps/api/src/modules/infrastructure/database/schema/item.schema.ts').read_text()
        for content in [auth, catalog]:
            self.assertIn("from 'drizzle-orm/pg-core'", content)
            self.assertIn("updated_at", content)
            self.assertIn("deleted_at", content)
            self.assertIn("withTimezone: true", content)

    def test_pg_driver_and_test_isolation(self):
        pkg = (V10/'apps/api/package.json').read_text()
        db = (V10/'apps/api/src/modules/infrastructure/database/database.service.ts').read_text()
        reset = (V10/'apps/api/scripts/reset-test-db.ts').read_text()
        self.assertIn('"pg":', pkg)
        self.assertNotIn('better-sqlite3', pkg)
        self.assertIn("drizzle-orm/node-postgres", db)
        self.assertIn("NODE_ENV", reset)
        self.assertIn("TEST_DATABASE_URL", reset)

    def test_default_skill_points_to_v10(self):
        skill = (SKILL/'SKILL.md').read_text()
        self.assertIn('fullstack-monorepo-template-v10', skill)
        self.assertIn('PostgreSQL', skill)

    def test_v9_is_retained_unchanged(self):
        files = sorted((p.relative_to(V9).as_posix(), hashlib.sha256(p.read_bytes()).hexdigest())
                       for p in V9.rglob('*') if p.is_file())
        digest = hashlib.sha256(''.join(f'{name}:{h}\n' for name,h in files).encode()).hexdigest()
        self.assertEqual(len(files), 155)
        self.assertEqual(digest, '7ab1e1422a075c5cb384da6dcd3ba886840b88d380a30431bc37aa74f4e1de0c')
