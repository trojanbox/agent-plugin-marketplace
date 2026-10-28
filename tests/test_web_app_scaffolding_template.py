from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / 'plugins/web-app-scaffolding/skills/react-nestjs-fullstack-scaffold'
TEMPLATE = SKILL / 'assets/fullstack-monorepo-template'

class FullstackTemplateTests(unittest.TestCase):
    def test_one_postgres_template_with_shared_infrastructure(self):
        self.assertTrue(TEMPLATE.is_dir())
        self.assertFalse((SKILL / 'assets/fullstack-monorepo-template-v9').exists())
        self.assertFalse((SKILL / 'assets/fullstack-monorepo-template-v10').exists())
        files = [f for f in TEMPLATE.rglob('*') if f.is_file() and 'node_modules' not in f.parts]
        self.assertGreater(len(files), 140)
        self.assertIn('postgresql', (TEMPLATE/'apps/api/drizzle.config.ts').read_text())
        self.assertIn('transaction', (TEMPLATE/'apps/api/src/modules/infrastructure/database/database.service.ts').read_text())
        self.assertIn('RequestContext', (TEMPLATE/'apps/api/src/http/request-context.ts').read_text())
        schema = (TEMPLATE/'apps/api/src/modules/infrastructure/database/schema/auth.schema.ts').read_text()
        self.assertNotIn("pgTable('auth_sessions'", schema)
        self.assertNotIn("pgTable('auth_rate_limits'", schema)
        drizzle = TEMPLATE / 'apps/api/drizzle'
        meta = drizzle / 'meta'
        self.assertEqual([p.name for p in drizzle.glob('*.sql')], ['0000_initial_schema.sql'])
        self.assertEqual([p.name for p in meta.glob('*_snapshot.json')], ['0000_snapshot.json'])
        journal = json.loads((meta / '_journal.json').read_text())
        self.assertEqual([row['tag'] for row in journal['entries']], ['0000_initial_schema'])
        snapshot = json.loads((meta / '0000_snapshot.json').read_text())
        self.assertEqual(set(snapshot['tables']), {'public.users', 'public.items'})
        sql = (drizzle / '0000_initial_schema.sql').read_text()
        self.assertIn('CREATE TABLE "users"', sql)
        self.assertIn('CREATE TABLE "items"', sql)
        self.assertIn('"created_by" uuid', sql)
        self.assertIn('"updated_by" uuid', sql)
        self.assertIn('users_touch_updated_at', sql)
        self.assertIn('items_touch_updated_at', sql)
        self.assertNotIn('DROP TABLE', sql)
        self.assertNotIn('auth_sessions', sql)
        self.assertNotIn('auth_rate_limits', sql)
        self.assertIn('redis', (TEMPLATE/'apps/api/package.json').read_text())
        self.assertIn('RedisService', (TEMPLATE/'apps/api/src/modules/infrastructure/infrastructure.module.ts').read_text())
        self.assertIn('TEST_REDIS_URL', (TEMPLATE/'apps/api/.env.example').read_text())
        self.assertIn('redis:', (TEMPLATE/'compose.yaml').read_text())


    def test_skill_routes_to_single_source(self):
        skill = (SKILL/'SKILL.md').read_text()
        self.assertIn('assets/fullstack-monorepo-template/', skill)
        self.assertNotIn('fullstack-monorepo-template-v9', skill)
        self.assertNotIn('fullstack-monorepo-template-v10', skill)

if __name__ == '__main__':
    unittest.main()
