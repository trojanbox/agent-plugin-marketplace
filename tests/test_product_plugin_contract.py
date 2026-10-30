"""Product v1 contracts: real discovery/host/relocation checks plus text guardrails.

These tests validate the executable Runtime and Skill contracts. They do not
claim to run a product UI or to measure an LLM router's accuracy; the separately
recorded semantic review covers natural-language routing and phase boundaries.
"""
from __future__ import annotations

import csv
import json
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRODUCT = ROOT / 'plugins/product'
PUBLIC = {
    'product-planning': 'planning', 'product-research': 'research',
    'product-discussion': 'discussion', 'product-conclusion': 'specification',
    'product-experience-review': 'verification', 'product-acceptance': 'verification',
}
INTERNAL = 'product-context-discovery'


def run_json(*args: str, root: Path = ROOT) -> dict:
    result = subprocess.run(['node', str(root / 'skill-runtime.js'), *args, '--json'],
                            cwd=root, check=True, text=True, capture_output=True)
    return json.loads(result.stdout)


def text(relative: str) -> str:
    return (PRODUCT / relative).read_text(encoding='utf-8')


class ProductDiscoveryTests(unittest.TestCase):
    def test_separate_registered_plugin_with_six_public_one_internal(self):
        listing = run_json('list', 'product')
        self.assertEqual(listing['publicSkillCount'], 6)
        self.assertEqual(listing['internalSkillCount'], 1)
        catalog = run_json('catalog')['skills']
        self.assertEqual({s['id'] for s in catalog if s['id'].startswith('product/')},
                         {'product/' + name for name in PUBLIC})
        self.assertNotIn('product/' + INTERNAL, {s['id'] for s in catalog})

    def test_real_direct_read_and_conditional_internal_composition(self):
        for name, phase in PUBLIC.items():
            with self.subTest(name=name):
                s = run_json('skill', 'product/' + name)['skill']
                self.assertEqual(s['phase'], phase)
                self.assertEqual(s['rootKind'], 'public')
                self.assertIn('product/' + INTERNAL, s['optionalUses'])
                self.assertEqual(s['uses'], [])
        internal = run_json('skill', 'product/' + INTERNAL)['skill']
        self.assertEqual(internal['visibility'], 'internal')
        self.assertEqual(internal['rootKind'], 'internal')

    def test_generated_host_manifests_only_discover_public_skills(self):
        for host in ('.claude-plugin', '.codex-plugin'):
            manifest = json.loads(text(host + '/plugin.json'))
            self.assertEqual(manifest['name'], 'product')
            self.assertNotIn('internal-skills', json.dumps(manifest))
        subprocess.run(['node', 'scripts/validate-host-manifests.mjs'],
                       cwd=ROOT, check=True, capture_output=True)

    def test_discovery_and_internal_refs_survive_relocation(self):
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp)
            shutil.copy(ROOT / 'skill-runtime.js', target)
            shutil.copytree(PRODUCT, target / 'plugins/product')
            (target / 'marketplace.json').write_text(json.dumps({
                'schemaVersion': 1, 'name': 'relocation-fixture', 'version': '1.0.0',
                'plugins': [{'name': 'product', 'source': './plugins/product', 'category': 'Business'}],
            }), encoding='utf-8')
            info = run_json('skill', 'product/product-discussion', root=target)['skill']
            self.assertTrue(Path(info['path']).is_relative_to(target))
            host_fallback = Path(info['path']).parent / '../../internal-skills/product-context-discovery/SKILL.md'
            self.assertTrue(host_fallback.resolve().is_file())
            self.assertEqual(run_json('list', 'product', root=target)['publicSkillCount'], 6)

    def test_all_local_markdown_links_and_progressive_refs_exist(self):
        for path in PRODUCT.rglob('*.md'):
            if any(p in path.parts for p in ('.claude-plugin', '.codex-plugin')):
                continue
            content = path.read_text(encoding='utf-8')
            refs = re.findall(r'`((?:\.\./|references/)[^`\n]+\.md)`', content)
            refs += re.findall(r'\]\(([^)]+\.md)(?:#[^)]*)?\)', content)
            for ref in refs:
                if '://' not in ref:
                    with self.subTest(path=path, ref=ref):
                        self.assertTrue((path.parent / ref).resolve().is_file())

    def test_bounded_metadata_and_no_project_runtime_coupling(self):
        for path in list(PRODUCT.glob('skills/*/SKILL.md')) + list(PRODUCT.glob('internal-skills/*/SKILL.md')):
            s = path.read_text(encoding='utf-8')
            self.assertLessEqual(len(s), 5000)
            self.assertLessEqual(len(s.splitlines()), 500)
            for forbidden in ('/data/users/', 'node_171df2', 'trojanbox/project-documents'):
                self.assertNotIn(forbidden, s)
        self.assertLessEqual((PRODUCT / 'plugin.json').stat().st_size, 8192)
        for path in PRODUCT.glob('shared/references/*.md'):
            self.assertLessEqual(len(path.read_text(encoding='utf-8')), 6000)


class ProductQualityContractTests(unittest.TestCase):
    def test_six_skills_have_full_lifecycle_and_native_shared_fallback(self):
        for name in PUBLIC:
            s = text(f'skills/{name}/SKILL.md')
            with self.subTest(name=name):
                for heading in ('## 目标与边界', '## 输入与前置', '## Skill Composition',
                                '## 工作流', '## 交付与完成', '## 停止条件'):
                    self.assertIn(heading, s)
                self.assertIn('../../shared/references/product-policy.md', s)
                self.assertIn('../../internal-skills/product-context-discovery/SKILL.md', s)

    def test_source_depth_freshness_and_project_isolation(self):
        s = text('shared/references/context-contract.md')
        for item in ('AGENTS.md', 'HEAD', 'dirty', '项目隔离', '受影响',
                     '源码', '新产品', '已有产品', '未验证', 'locator', 'as_of'):
            self.assertIn(item, s)
        for item in ('首次', '变化', '重新读取'):
            self.assertIn(item, text('internal-skills/product-context-discovery/SKILL.md'))

    def test_evidence_categories_and_no_fictional_user_research(self):
        s = text('shared/references/product-policy.md')
        for item in ('verified_fact', 'user_decision', 'inference', 'assumption',
                     'deferred', 'out_of_scope', '访谈', '未实现', '后台'):
            self.assertIn(item, s)

    def test_discussion_ledger_dependencies_and_authorization(self):
        s = text('skills/product-discussion/references/decision-ledger.md')
        for item in ('Q-', 'D-', 'depends_on', 'supersedes', '批量',
                     'ready_for_product_conclusion', '授权', '冲突'):
            self.assertIn(item, s)
        self.assertIn('不自动', text('skills/product-discussion/SKILL.md'))

    def test_conclusion_traceability_without_history_dependency(self):
        s = text('skills/product-conclusion/references/conclusion-contract.md')
        for item in ('来源 →', '结论 →', 'R-', 'A-', '自包含',
                     '未决', '写后', '授权', '历史讨论'):
            self.assertIn(item, s)

    def test_acceptance_never_infers_pass_from_code_or_a_screenshot(self):
        s = text('skills/product-acceptance/references/acceptance-matrix.md')
        for item in ('pass', 'failed', 'unverified', 'not_applicable',
                     'blocked_missing_contract', 'blocked_missing_evidence',
                     '截图', '源码', '持久化', '需求变更', '总体'):
            self.assertIn(item, s)

    def test_review_and_acceptance_keep_different_primary_goals(self):
        review = text('skills/product-experience-review/SKILL.md')
        acceptance = text('skills/product-acceptance/SKILL.md')
        self.assertIn('体验问题', review)
        self.assertIn('已确认', acceptance)
        self.assertIn('测试方案', acceptance)
        self.assertIn('design/visual-artifact-design', review)

    def test_persistence_uses_real_capabilities_and_explicit_repo(self):
        s = text('shared/references/delivery-and-handoff.md')
        for item in ('目标仓库', '授权', '写后', 'Markdown',
                     'spec_skipped_by_user', '缺失', 'development'):
            self.assertIn(item, s)
        self.assertNotIn('trojanbox/project-documents', s)

    def test_optional_helpers_have_real_ids_and_trigger_conditions(self):
        ids = {s['id'] for s in run_json('catalog')['skills']}
        ids.add('product/' + INTERNAL)
        for path in list(PRODUCT.glob('skills/*/SKILL.md')) + list(PRODUCT.glob('internal-skills/*/SKILL.md')):
            info = run_json('skill', 'product/' + path.parent.name)['skill']
            for dep in info['optionalUses']:
                self.assertIn(dep, ids)
                self.assertIn(dep, path.read_text(encoding='utf-8').split('---', 2)[2])

    def test_provenance_covers_all_confirmed_decisions_and_adapted_sources(self):
        s = text('PROVENANCE.md')
        for n in range(1, 15):
            self.assertIn(f'D-{n:03}', s)
        for item in ('github-spec', 'github-research-document-generator',
                     'github-discussion-facilitator', 'SKILL_COMPOSITION', '局限'):
            self.assertIn(item, s)

    def test_iteration_feedback_keeps_regression_and_no_auto_publish(self):
        s = text('shared/references/iteration.md')
        for item in ('回归', '原始', '来源', '授权', '未经', '验证', '失败样例'):
            self.assertIn(item, s)

    def test_semantic_corpus_has_all_buckets_and_six_positive_targets(self):
        with (ROOT / 'tests/product-semantic-routing-cases.csv').open(encoding='utf-8') as stream:
            rows = list(csv.DictReader(stream))
        self.assertGreaterEqual(len(rows), 30)
        self.assertEqual(len({r['id'] for r in rows}), len(rows))
        self.assertTrue({'positive', 'negative', 'regression', 'adversarial',
                         'composition', 'conflict', 'gate', 'multi-turn'} <= {r['bucket'] for r in rows})
        targets = {r['expected_primary'] for r in rows if r['bucket'] == 'positive'}
        self.assertTrue({'product/' + n for n in PUBLIC} <= targets)
        # An expectation corpus alone is never a claimed execution result.
        self.assertNotIn('result', rows[0])


class ProductArtifactSampleTests(unittest.TestCase):
    def test_fixture_executes_real_sample_without_fake_ui_claims(self):
        sample = ROOT / "tests/fixtures/product/existing-app.mjs"
        result = subprocess.run(["node", str(sample), "--sample"], check=True,
                                text=True, capture_output=True)
        payload = json.loads(result.stdout)
        self.assertTrue(payload["fixture"])
        self.assertEqual(payload["result"], 'title,status\n"Draft","done"')
        self.assertNotIn("owner", payload["result"])

    def test_sample_reviews_preserve_unverified_acceptance(self):
        report = (ROOT / "tests/evidence/product-artifact-review.md").read_text(encoding="utf-8")
        for item in ("synthetic", "待验证，不能报告产品验收通过", "unverified",
                     "不是为 #316 新建开发结论", "没有实际页面"):
            self.assertIn(item, report)

    def test_semantic_report_records_ambiguities_instead_of_forcing_product(self):
        report = (ROOT / "tests/product-semantic-routing-eval.md").read_text(encoding="utf-8")
        self.assertIn("不是独立模型批量执行器", report)
        self.assertIn("PRD040", report)
        self.assertIn("原始输入", report)
        self.assertIn("PASS_CONFLICT", report)
        with (ROOT / "tests/product-semantic-routing-cases.csv").open(encoding="utf-8") as stream:
            cases = {row["id"]: row for row in csv.DictReader(stream)}
        self.assertEqual(cases["PRD040"]["expected_primary"], "conflict")
        self.assertEqual(cases["PRD048"]["expected_primary"], "product/product-research")


if __name__ == '__main__':
    unittest.main()
