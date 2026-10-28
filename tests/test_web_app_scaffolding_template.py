from pathlib import Path
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
        self.assertIn("DROP TABLE", (TEMPLATE/'apps/api/drizzle/0002_move_auth_state_to_redis.sql').read_text())
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
