from __future__ import annotations

import json
import re
import subprocess
import tempfile
import shutil
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLUGINS = ROOT / "plugins"
RUNTIME = ROOT / "skill-runtime.js"


def all_skill_paths() -> list[Path]:
    return sorted(
        list(PLUGINS.glob("*/skills/*/SKILL.md"))
        + list(PLUGINS.glob("*/internal-skills/*/SKILL.md"))
    )


def frontmatter(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise AssertionError(f"missing frontmatter: {path}")
    parts = text.split("---", 2)
    if len(parts) < 3:
        raise AssertionError(f"unterminated frontmatter: {path}")
    return parts[1]


def runtime_json(*args: str) -> dict:
    completed = subprocess.run(
        ["node", str(RUNTIME), *args],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


class RuntimeContractTests(unittest.TestCase):
    def test_visibility_counts_are_explicit_and_consistent(self) -> None:
        doctor = runtime_json("doctor")
        catalog = runtime_json("catalog")
        categories = runtime_json("list")
        development = runtime_json("list", "development")

        self.assertTrue(doctor["ok"])
        self.assertEqual(doctor["contractIssues"], [])
        self.assertEqual(
            doctor["skillCount"],
            doctor["publicSkillCount"] + doctor["internalSkillCount"],
        )
        self.assertEqual(catalog["skillCount"], doctor["publicSkillCount"])
        self.assertEqual(catalog["publicSkillCount"], doctor["publicSkillCount"])
        self.assertEqual(catalog["internalSkillCount"], doctor["internalSkillCount"])
        self.assertEqual(development["internalSkillCount"], 1)
        self.assertEqual(
            development["internalSkillCount"],
            development["hiddenInternalSkillCount"],
        )
        development_category = next(
            item for item in categories["categories"] if item["name"] == "development"
        )
        self.assertTrue(development_category["skillCountIncludesInternal"])
        self.assertEqual(
            development_category["skillCount"],
            development["publicSkillCount"] + development["internalSkillCount"],
        )

    def test_legacy_physical_skills_root_is_removed(self) -> None:
        self.assertFalse((ROOT / "skills").exists())

    def test_skill_tree_does_not_depend_on_gitlab_mapping_file(self) -> None:
        forbidden = "/mnt/data/" + "gitlab-" + "mapping.txt"
        offenders: list[str] = []
        for path in sorted(PLUGINS.rglob("*")):
            if not path.is_file() or "__pycache__" in path.parts:
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            if forbidden in text:
                offenders.append(str(path.relative_to(ROOT)))
        self.assertEqual(offenders, [])

    def test_marketplace_plugin_architecture_preserves_legacy_cli_ids(self) -> None:
        listing = runtime_json("list")
        self.assertEqual(listing["architecture"], "marketplace-plugin-skill")
        self.assertEqual(listing["pluginCount"], listing["categoryCount"])
        self.assertEqual(
            {item["name"] for item in listing["plugins"]},
            {item["name"] for item in listing["categories"]},
        )
        direct = runtime_json("skill", "development/github-bug-investigation")
        self.assertEqual(direct["skill"]["plugin"], "development")
        self.assertEqual(direct["skill"]["category"], "development")
        self.assertTrue(direct["skill"]["path"].endswith(
            "plugins/development/skills/github-bug-investigation/SKILL.md"
        ))

    def test_runtime_is_relocatable_as_a_directory(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            relocated = Path(td) / ("runtime-moved-" + "x" * 96)
            shutil.copytree(ROOT, relocated, ignore=shutil.ignore_patterns("__pycache__"))
            completed = subprocess.run(
                ["node", str(relocated / "skill-runtime.js"), "doctor"],
                cwd=Path(td),
                check=True,
                capture_output=True,
                text=True,
            )
            data = json.loads(completed.stdout)
            self.assertTrue(data["ok"])
            self.assertEqual(data["runtimeRoot"], str(relocated))
            self.assertTrue(data["marketplacePath"].startswith(str(relocated)))
            direct = subprocess.run(
                [
                    "node",
                    str(relocated / "skill-runtime.js"),
                    "skill",
                    "development/github-bug-investigation",
                ],
                cwd=Path(td),
                check=True,
                capture_output=True,
                text=True,
            )
            skill = json.loads(direct.stdout)["skill"]
            self.assertTrue(skill["path"].startswith(str(relocated)))
            self.assertTrue(skill["pluginRoot"].startswith(str(relocated)))

    def test_every_skill_has_explicit_phase(self) -> None:
        missing: list[str] = []
        for path in all_skill_paths():
            if not re.search(r"^phase\s*:\s*\S+", frontmatter(path), re.MULTILINE):
                missing.append(str(path.relative_to(ROOT)))
        self.assertEqual(missing, [])

    def test_optional_dependencies_have_composition_rules(self) -> None:
        missing: list[str] = []
        heading = re.compile(
            r"^#{1,6}\s+.*(?:Composition|能力组合)",
            re.IGNORECASE | re.MULTILINE,
        )
        for path in all_skill_paths():
            metadata = frontmatter(path)
            if re.search(r"^optional_uses\s*:", metadata, re.MULTILINE):
                text = path.read_text(encoding="utf-8")
                if not heading.search(text):
                    missing.append(str(path.relative_to(ROOT)))
        self.assertEqual(missing, [])


class ProgressiveDisclosureContractTests(unittest.TestCase):
    def test_ai_usage_is_thin_bootstrap(self) -> None:
        path = ROOT / "AI_USAGE.md"
        text = path.read_text(encoding="utf-8")
        self.assertLessEqual(path.stat().st_size, 4096)
        self.assertLessEqual(len(text.splitlines()), 80)
        self.assertIn("node skill-runtime.js list", text)
        self.assertIn("node skill-runtime.js catalog", text)
        self.assertIn("node skill-runtime.js skill", text)
        self.assertNotIn("Development Category 的固定边界", text)
        self.assertNotIn("主 Skill 冲突处理（强制）", text)
        self.assertNotRegex(text, r"github-[a-z0-9-]+")

    def test_marketplace_and_plugin_manifests_are_thin_metadata(self) -> None:
        marketplace_path = ROOT / "marketplace.json"
        marketplace = json.loads(marketplace_path.read_text(encoding="utf-8"))
        self.assertEqual(marketplace["schemaVersion"], 1)
        self.assertLessEqual(marketplace_path.stat().st_size, 8192)
        self.assertEqual(len(marketplace["plugins"]), 10)

        oversized: list[str] = []
        for path in sorted(PLUGINS.glob("*/plugin.json")):
            data = json.loads(path.read_text(encoding="utf-8"))
            if path.stat().st_size > 8192:
                oversized.append(str(path.relative_to(ROOT)))
            self.assertEqual(data["schemaVersion"], 1)
            self.assertEqual(data["skills"], "./skills")
            if "internalSkills" in data:
                self.assertEqual(data["internalSkills"], "./internal-skills")
            self.assertTrue(data["name"])
            self.assertTrue(data["version"])
            self.assertTrue(data["description"])
        self.assertEqual(oversized, [])

    def test_groups_are_manifest_metadata_not_physical_directories(self) -> None:
        for manifest_path in sorted(PLUGINS.glob("*/plugin.json")):
            data = json.loads(manifest_path.read_text(encoding="utf-8"))
            skill_root = manifest_path.parent / "skills"
            internal_root = manifest_path.parent / "internal-skills"
            physical = {p.parent.name for p in skill_root.glob("*/SKILL.md")}
            physical.update(p.parent.name for p in internal_root.glob("*/SKILL.md"))
            nested = list(skill_root.glob("*/*/SKILL.md"))
            nested.extend(internal_root.glob("*/*/SKILL.md"))
            self.assertEqual(nested, [])
            grouped: set[str] = set()
            for members in data.get("groups", {}).values():
                grouped.update(members)
            self.assertTrue(grouped <= physical)

    def test_skill_files_stay_within_progressive_disclosure_budget(self) -> None:
        violations: list[tuple[str, int, int]] = []
        for path in all_skill_paths():
            text = path.read_text(encoding="utf-8")
            chars = len(text)
            lines = len(text.splitlines())
            if chars > 5000 or lines > 500:
                violations.append((str(path.relative_to(ROOT)), chars, lines))
        self.assertEqual(violations, [])

    def test_markdown_references_are_focused(self) -> None:
        oversized: list[tuple[str, int]] = []
        for path in sorted(PLUGINS.glob("*/skills/*/references/*.md")):
            chars = len(path.read_text(encoding="utf-8"))
            if chars > 6000:
                oversized.append((str(path.relative_to(ROOT)), chars))
        self.assertEqual(oversized, [])

    def test_local_skill_reference_targets_exist_and_are_one_level(self) -> None:
        missing: list[str] = []
        nested: list[str] = []
        pattern = re.compile(r"`references/([^`]+)`")
        for skill in all_skill_paths():
            text = skill.read_text(encoding="utf-8")
            for target in pattern.findall(text):
                if "<" in target or ">" in target:
                    continue
                if "/" in target:
                    nested.append(f"{skill.relative_to(ROOT)} -> references/{target}")
                    continue
                if not (skill.parent / "references" / target).exists():
                    missing.append(f"{skill.relative_to(ROOT)} -> references/{target}")
        self.assertEqual(nested, [])
        self.assertEqual(missing, [])

    def test_skill_system_design_documents_progressive_disclosure(self) -> None:
        skill = (
            PLUGINS / "ai-workflow/skills/skill-system-design/SKILL.md"
        ).read_text(encoding="utf-8")
        reference = (
            PLUGINS
            / "ai-workflow/skills/skill-system-design/references/progressive-disclosure.md"
        )
        self.assertTrue(reference.exists())
        self.assertIn("Progressive Disclosure Gate", skill)
        self.assertIn("references/progressive-disclosure.md", skill)
        rules = reference.read_text(encoding="utf-8")
        self.assertIn("5,000 tokens", rules)
        self.assertIn("500 行", rules)
        self.assertIn("AI_USAGE.md", rules)
        self.assertIn("plugin.json", rules)
        self.assertIn("marketplace.json", rules)


class HostManifestContractTests(unittest.TestCase):
    def test_host_manifest_generator_and_validator_are_idempotent(self) -> None:
        first = subprocess.run(
            ["node", str(ROOT / "scripts/generate-host-manifests.mjs")],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        generated = json.loads(first.stdout)
        self.assertEqual(generated["pluginCount"], 10)
        self.assertEqual(generated["artifactCount"], 22)
        self.assertEqual(generated["written"], 0)
        self.assertEqual(generated["removed"], 0)

        validated = subprocess.run(
            ["node", str(ROOT / "scripts/validate-host-manifests.mjs")],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        result = json.loads(validated.stdout)
        self.assertTrue(result["ok"])
        self.assertEqual(result["artifactCount"], 22)

    def test_claude_and_codex_marketplaces_cover_all_canonical_plugins(self) -> None:
        canonical = json.loads((ROOT / "marketplace.json").read_text(encoding="utf-8"))
        claude = json.loads(
            (ROOT / ".claude-plugin/marketplace.json").read_text(encoding="utf-8")
        )
        codex = json.loads(
            (ROOT / ".agents/plugins/marketplace.json").read_text(encoding="utf-8")
        )
        canonical_names = [item["name"] for item in canonical["plugins"]]
        self.assertEqual([item["name"] for item in claude["plugins"]], canonical_names)
        self.assertEqual([item["name"] for item in codex["plugins"]], canonical_names)
        self.assertEqual(claude["owner"], canonical["owner"])
        self.assertEqual(codex["interface"]["displayName"], "Agent Plugin Marketplace")

        for entry in codex["plugins"]:
            self.assertEqual(entry["source"]["source"], "local")
            self.assertEqual(entry["source"]["path"], f"./plugins/{entry['name']}")
            self.assertEqual(entry["policy"]["installation"], "AVAILABLE")
            self.assertEqual(entry["policy"]["authentication"], "ON_INSTALL")
            self.assertTrue(entry["category"])

    def test_generated_plugin_manifests_match_canonical_versions(self) -> None:
        required_interface = {
            "displayName",
            "shortDescription",
            "longDescription",
            "developerName",
            "category",
            "capabilities",
            "defaultPrompt",
        }
        for canonical_path in sorted(PLUGINS.glob("*/plugin.json")):
            canonical = json.loads(canonical_path.read_text(encoding="utf-8"))
            plugin_root = canonical_path.parent
            claude = json.loads(
                (plugin_root / ".claude-plugin/plugin.json").read_text(encoding="utf-8")
            )
            codex = json.loads(
                (plugin_root / ".codex-plugin/plugin.json").read_text(encoding="utf-8")
            )
            for generated in (claude, codex):
                self.assertEqual(generated["name"], canonical["name"])
                self.assertEqual(generated["version"], canonical["version"])
                self.assertEqual(generated["description"], canonical["description"])
                self.assertEqual(generated["author"]["name"], "trojanbox")
            self.assertEqual(codex["skills"], "./skills/")
            self.assertTrue(required_interface <= set(codex["interface"]))
            self.assertTrue(codex["interface"]["capabilities"])
            self.assertTrue(codex["interface"]["defaultPrompt"])

    def test_internal_skills_are_physically_excluded_from_host_discovery(self) -> None:
        internal_root = PLUGINS / "development/internal-skills"
        internal = internal_root / "github-incidental-bug-capture/SKILL.md"
        self.assertTrue(internal.is_file())
        self.assertFalse(
            (PLUGINS / "development/skills/github-incidental-bug-capture").exists()
        )
        for path in [
            ROOT / ".claude-plugin/marketplace.json",
            ROOT / ".agents/plugins/marketplace.json",
            *PLUGINS.glob("*/.claude-plugin/plugin.json"),
            *PLUGINS.glob("*/.codex-plugin/plugin.json"),
        ]:
            self.assertNotIn("internal-skills", path.read_text(encoding="utf-8"))



class DevelopmentWorkflowContractTests(unittest.TestCase):
    def test_unified_issue_title_vocabulary_has_no_legacy_aliases(self) -> None:
        documents = [ROOT / "AI_USAGE.md", ROOT / "SKILL_COMPOSITION.md"]
        documents.extend(sorted((PLUGINS / "development").rglob("*.md")))
        corpus = "\n".join(path.read_text(encoding="utf-8") for path in documents)

        legacy_prefixes = [
            "【调研文档】",
            "【规格】",
            "【开发计划】",
            "【测试计划】",
            "【BUG】",
        ]
        for prefix in legacy_prefixes:
            self.assertNotIn(prefix, corpus)

        removed_skill_ids = [
            "github-patch-review",
            "github-tdd-implementation",
            "github-system-e2e-test-plan-generator",
        ]
        for skill_id in removed_skill_ids:
            self.assertNotIn(skill_id, corpus)

        policy = (
            PLUGINS
            / "development/shared/github-core/references/collaboration-policy.md"
        ).read_text(encoding="utf-8")
        for prefix in (
            "【讨论】",
            "【调研】",
            "【结论】",
            "【实施计划】",
            "【技术测试方案】",
            "【业务测试方案】",
            "【缺陷】P0|P1|P2|P3",
        ):
            self.assertIn(prefix, policy)

    def test_incidental_bug_capture_is_the_only_internal_skill(self) -> None:
        doctor = runtime_json("doctor")
        internal = [
            skill
            for skill in doctor["skills"]
            if skill.get("visibility") == "internal"
        ]
        self.assertEqual(len(internal), 1)
        self.assertEqual(internal[0]["name"], "github-incidental-bug-capture")
        self.assertEqual(
            internal[0]["uses"],
            ["development/github-issue-triage", "development/github-issue-manager"],
        )
        self.assertEqual(internal[0]["rootKind"], "internal")
        self.assertIn(
            "plugins/development/internal-skills/github-incidental-bug-capture/SKILL.md",
            internal[0]["path"].replace("\\", "/"),
        )
        self.assertFalse(
            (PLUGINS / "development/skills/github-incidental-bug-capture").exists()
        )

        expected_consumers = {
            "api-contract-audit",
            "github-development-plan-generator",
            "github-discussion-facilitator",
            "github-research-document-generator",
            "github-spec",
            "github-business-test-plan-generator",
            "github-technical-test-plan-generator",
            "github-test-plan-audit",
        }
        actual_consumers = {
            skill["name"]
            for skill in doctor["skills"]
            if "development/github-incidental-bug-capture"
            in skill.get("optionalUses", [])
        }
        self.assertEqual(actual_consumers, expected_consumers)

    def test_source_patch_fast_lane_is_bounded_to_s_level(self) -> None:
        doctor = runtime_json("doctor")
        by_name = {skill["name"]: skill for skill in doctor["skills"]}
        patch = by_name["source-patch-implementation"]
        self.assertEqual(patch["phase"], "implementation")

        skill = (
            PLUGINS
            / "development/skills/source-patch-implementation/SKILL.md"
        ).read_text(encoding="utf-8")
        policy = (
            PLUGINS
            / "development/shared/github-core/references/collaboration-policy.md"
        ).read_text(encoding="utf-8")
        category = (PLUGINS / "development/plugin.json").read_text(encoding="utf-8")
        bug = (
            PLUGINS / "development/skills/github-bug-investigation/SKILL.md"
        ).read_text(encoding="utf-8")

        self.assertIn("Patch Fast Lane Gate", skill)
        self.assertIn("用户说“直接 patch”只表达期望交付物", skill)
        self.assertIn("patch_fast_lane_eligible", policy)
        self.assertIn("用户点名“直接 patch”不豁免 Gate", policy)
        for blocked in ("数据模型", "外部 API", "复杂状态机", "DECISION_REQUIRED"):
            self.assertIn(blocked, policy)
        self.assertIn("S 级局部源码 Patch", category)
        self.assertIn("默认**不自动创建 GitHub Issue**", bug)
        self.assertIn("S/M/L", bug)

    def test_spec_gate_covers_all_downstream_plan_types(self) -> None:
        policy = (
            PLUGINS
            / "development/shared/github-core/references/collaboration-policy.md"
        ).read_text(encoding="utf-8")
        quality = (
            PLUGINS
            / "development/shared/testing-core/test-plan-quality-contract.md"
        ).read_text(encoding="utf-8")
        discussion = (
            PLUGINS
            / "development/skills/github-discussion-facilitator/SKILL.md"
        ).read_text(encoding="utf-8")
        spec = (
            PLUGINS / "development/skills/github-spec/SKILL.md"
        ).read_text(encoding="utf-8")
        business = (
            PLUGINS
            / "development/skills/github-business-test-plan-generator/SKILL.md"
        ).read_text(encoding="utf-8")
        technical = (
            PLUGINS
            / "development/skills/github-technical-test-plan-generator/SKILL.md"
        ).read_text(encoding="utf-8")
        audit = (
            PLUGINS / "development/skills/github-test-plan-audit/SKILL.md"
        ).read_text(encoding="utf-8")

        closure = (
            PLUGINS
            / "development/skills/github-discussion-facilitator/references/closure-and-spec-gate.md"
        ).read_text(encoding="utf-8")

        for document in (policy, discussion, spec, closure):
            for title in ("实施计划", "技术测试方案", "业务测试方案"):
                self.assertIn(title, document)

        self.assertIn("对所有下游计划执行 Spec Gate", discussion)
        self.assertNotIn("仅当下一阶段是开发计划时", closure)
        self.assertIn("Spec Gate 与合同权威状态", quality)
        self.assertIn("Spec Gate 与权威输入（强制）", business)
        self.assertIn("Spec Gate 与权威输入（强制）", technical)
        self.assertIn("Spec Gate / 权威来源审计", audit)


    def test_data_common_workflows_have_explicit_composition_ownership(self) -> None:
        doctor = runtime_json("doctor")
        by_name = {skill["name"]: skill for skill in doctor["skills"]}

        self.assertIn(
            "data/data-visualization",
            by_name["data-exploration"].get("optionalUses", []),
        )
        self.assertIn(
            "data/data-visualization",
            by_name["statistical-analysis"].get("optionalUses", []),
        )
        self.assertEqual(
            set(by_name["data-validation"].get("optionalUses", [])),
            {"data/statistical-analysis", "data/data-visualization"},
        )
        exploration = (PLUGINS / "data/skills/data-exploration/SKILL.md").read_text(encoding="utf-8")
        statistical = (PLUGINS / "data/skills/statistical-analysis/SKILL.md").read_text(encoding="utf-8")
        validation = (PLUGINS / "data/skills/data-validation/SKILL.md").read_text(encoding="utf-8")
        self.assertIn("本 Skill 保留主路由", exploration)
        self.assertIn("本 Skill 为主，组合 `data/data-visualization`", statistical)
        self.assertIn("本 Skill 为主，组合 `data/statistical-analysis`", validation)

    def test_writing_humanizer_is_explicit_style_composition(self) -> None:
        doctor = runtime_json("doctor")
        by_name = {skill["name"]: skill for skill in doctor["skills"]}
        for name in (
            "executive-communication",
            "popular-science-explainer",
            "practical-usage-guide",
        ):
            self.assertIn(
                "writing/humanizer",
                by_name[name].get("optionalUses", []),
                name,
            )

        executive = (PLUGINS / "writing/skills/executive-communication/SKILL.md").read_text(encoding="utf-8")
        self.assertIn("本 Skill 保留主路由", executive)
        humanizer = (PLUGINS / "writing/skills/humanizer/SKILL.md").read_text(encoding="utf-8")
        self.assertIn("更具体的内容交付物", humanizer)
        self.assertIn(
            "writing/clear-writing",
            by_name["humanizer"].get("optionalUses", []),
        )

    def test_github_remote_write_recovery_precedes_handoff(self) -> None:
        recovery = (
            PLUGINS
            / "development/shared/github-core/references/github-remote-write-recovery.md"
        ).read_text(encoding="utf-8")
        handoff = (
            PLUGINS
            / "development/shared/github-core/references/handoff-protocol.md"
        ).read_text(encoding="utf-8")
        manager = (
            PLUGINS / "development/skills/github-issue-manager/SKILL.md"
        ).read_text(encoding="utf-8")
        discussion = (
            PLUGINS
            / "development/skills/github-discussion-facilitator/SKILL.md"
        ).read_text(encoding="utf-8")

        self.assertIn("$HOME/.local/bin/gh", recovery)
        self.assertIn("--body-file", recovery)
        self.assertIn("不能单独判定为 GitHub 不可写", recovery)
        self.assertIn("最多两次", recovery)
        self.assertIn("用户明确要求不要生成 handoff", recovery)
        self.assertIn("github-remote-write-recovery.md", handoff)
        self.assertIn("不能直接触发 handoff", handoff)
        self.assertIn("github-remote-write-recovery.md", manager)
        self.assertIn("github-remote-write-recovery.md", discussion)
        self.assertIn("复杂命令被宿主拒绝不能直接触发 handoff", discussion)

    def test_issue_write_gate_has_single_route_owner(self) -> None:
        doctor = runtime_json("doctor")
        by_name = {skill["name"]: skill for skill in doctor["skills"]}
        self.assertIn(
            "development/github-issue-triage",
            by_name["github-issue-manager"].get("optionalUses", []),
        )
        manager = (
            PLUGINS / "development/skills/github-issue-manager/SKILL.md"
        ).read_text(encoding="utf-8")
        triage = (
            PLUGINS / "development/skills/github-issue-triage/SKILL.md"
        ).read_text(encoding="utf-8")
        self.assertIn("本 Skill 拥有主路由", manager)
        self.assertIn("领域工作流的持久化步骤", manager)
        self.assertIn("`github-issue-manager` 是主 Skill", triage)
        self.assertIn("Issue Write Gate", manager)
        self.assertIn("不抢主路由", manager)

    def test_skill_system_design_requires_semantic_routing_eval(self) -> None:
        skill = (
            PLUGINS / "ai-workflow/skills/skill-system-design/SKILL.md"
        ).read_text(encoding="utf-8")
        reference = (
            PLUGINS
            / "ai-workflow/skills/skill-system-design/references/semantic-routing-eval.md"
        )
        self.assertTrue(reference.exists())
        self.assertIn("references/semantic-routing-eval.md", skill)
        maintenance = (
            PLUGINS
            / "ai-workflow/skills/skill-system-design/references/runtime-maintenance-and-delivery.md"
        ).read_text(encoding="utf-8")
        self.assertIn("Semantic Routing Eval Gate", maintenance)
        self.assertIn("PASS_COMPOSITION", maintenance)
        self.assertIn("PASS_CONFLICT", reference.read_text(encoding="utf-8"))

    def test_domain_knowledge_builder_has_bounded_composition_and_model_contract(self) -> None:
        doctor = runtime_json("doctor")
        by_name = {skill["name"]: skill for skill in doctor["skills"]}
        builder = by_name["domain-knowledge-builder"]
        self.assertEqual(builder["phase"], "learning")
        self.assertEqual(
            set(builder.get("optionalUses", [])),
            {
                "research/deep-research",
                "research/knowledge-synthesis",
                "research/community-research",
                "reasoning/scientific-reasoning",
            },
        )
        skill = (
            PLUGINS / "research/skills/domain-knowledge-builder/SKILL.md"
        ).read_text(encoding="utf-8")
        self.assertIn("Decision Ready", skill)
        self.assertIn("Decision Catalogue", skill)
        self.assertIn("FACT / MODEL / HEURISTIC / HYPOTHESIS / UNKNOWN / DEPRECATED", skill)
        self.assertIn("business/product-marketing-context", skill)
        self.assertIn("references/domain-model-contract.md", skill)
        self.assertIn("references/practice-and-persistence.md", skill)

    def test_skill_system_design_bundles_portable_semantic_regression_corpus(self) -> None:
        import csv

        corpus = (
            PLUGINS
            / "ai-workflow/skills/skill-system-design/references/semantic-routing-regression.csv"
        )
        self.assertTrue(corpus.exists())
        with corpus.open(encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        self.assertEqual(len(rows), 238)
        buckets = {row["bucket"] for row in rows}
        for bucket in (
            "baseline-regression",
            "breadth-positive",
            "adversarial",
            "cross-category",
            "multi-turn",
            "skill-system-behavior",
            "plugin-architecture",
        ):
            self.assertIn(bucket, buckets)
        self.assertTrue(all(row["prompt"].strip() and row["expected"].strip() for row in rows))

    def test_spec_side_bug_uses_incidental_capture(self) -> None:
        spec = (
            PLUGINS / "development/skills/github-spec/SKILL.md"
        ).read_text(encoding="utf-8")
        self.assertIn(
            "development/github-incidental-bug-capture",
            spec,
        )
        delivery = (
            PLUGINS
            / "development/skills/github-spec/references/delivery-and-issue.md"
        ).read_text(encoding="utf-8")
        self.assertIn(
            "组合 `github-incidental-bug-capture` 完成查重与留痕",
            delivery,
        )
        self.assertNotIn(
            "生成结论时发现独立缺陷：使用 `github-bug-investigation`",
            spec + delivery,
        )


if __name__ == "__main__":
    unittest.main()
