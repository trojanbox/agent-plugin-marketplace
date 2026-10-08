from __future__ import annotations

import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / 'plugins/reasoning/skills/divergent-ideation/SKILL.md'
REFERENCE = SKILL.parent / 'references/ideation-lab.md'


def runtime(*args: str) -> dict:
    result = subprocess.run(
        ['node', str(ROOT / 'skill-runtime.js'), *args],
        cwd=ROOT,
        capture_output=True,
        check=True,
        text=True,
    )
    return json.loads(result.stdout)


class DivergentIdeationContractTests(unittest.TestCase):
    def test_discoverable_as_public_exploration_skill(self) -> None:
        found = runtime('skill', 'reasoning/divergent-ideation')['skill']
        self.assertEqual(found['phase'], 'exploration')
        self.assertEqual(found['visibility'], 'workflow')
        self.assertEqual(found['uses'], [])
        self.assertEqual(found['optionalUses'], [])
        listing = runtime('list', 'reasoning')
        self.assertEqual(listing['publicSkillCount'], 3)
        self.assertIn('divergent-ideation', {s['name'] for s in listing['ungroupedSkills']})

    def test_ideation_is_bounded_to_seeds_and_branches(self) -> None:
        skill = SKILL.read_text(encoding='utf-8')
        reference = REFERENCE.read_text(encoding='utf-8')
        for keyword in ['广域爆破', '单点深挖', '去同质化', '好奇', '小说', '现实', '停止']:
            self.assertIn(keyword, skill)
        self.assertIn('仅在用户要求多轮发散', reference)
        self.assertIn('references/ideation-lab.md', skill)
        self.assertNotIn('uses:', skill.split('---')[1])

    def test_routing_eval_includes_neighbor_and_feedback_cases(self) -> None:
        samples = (
            ROOT / 'plugins/ai-workflow/skills/skill-system-design/references/'
            'semantic-routing-regression.csv'
        ).read_text(encoding='utf-8')
        for case in ['DI001', 'DI007', 'DI009', 'DI011', 'DI015', 'DI017', 'DI019', 'DI024']:
            self.assertIn(case, samples)
        self.assertTrue((ROOT / 'tests/divergent-ideation-semantic-routing-eval.md').is_file())


if __name__ == '__main__':
    unittest.main()
