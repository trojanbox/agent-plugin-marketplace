"""Writing v4 migration: only 10 public entries, preserved mode-specific contracts."""

from __future__ import annotations

import csv
import json
import re
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WRITING = ROOT / "plugins/writing"
SKILLS = WRITING / "skills"
FICTION_REFS = WRITING / "shared/fiction/references"
CORPUS = ROOT / "plugins/ai-workflow/skills/skill-system-design/references/semantic-routing-regression.csv"

RETIRED = {
    "fiction-character-review", "fiction-continuity-review",
    "fiction-expression-review", "fiction-readability-review",
    "fiction-pacing-review", "fiction-final-review",
    "fiction-manuscript-readiness", "humanizer",
    "popular-science-explainer", "practical-usage-guide",
}
FICTION = {
    "fiction-discussion", "fiction-conclusion", "fiction-outline",
    "fiction-manuscript-drafting", "fiction-prose-editing",
    "fiction-review", "fiction-revision-validation",
}
GENERAL = {"clear-writing", "executive-communication", "explanatory-writing"}


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def runtime(*args: str) -> dict:
    return json.loads(subprocess.run(
        ["node", str(ROOT / "skill-runtime.js"), *args, "--json"],
        cwd=ROOT, text=True, capture_output=True, check=True,
    ).stdout)


class WritingV4ContractTest(unittest.TestCase):
    def test_public_ids_and_two_soft_groups(self):
        data = runtime("list", "writing")
        self.assertEqual(data["publicSkillCount"], 10)
        self.assertEqual(data["internalSkillCount"], 0)
        self.assertEqual({
            group["name"]: {item["name"] for item in group["skills"]}
            for group in data["groups"]
        }, {"fiction": FICTION, "general-writing": GENERAL})
        self.assertEqual({p.parent.name for p in SKILLS.glob("*/SKILL.md")}, FICTION | GENERAL)
        manifest = json.loads(read(WRITING / "plugin.json"))
        self.assertEqual(manifest["version"], "4.0.2")
        self.assertEqual({k: set(v) for k, v in manifest["groups"].items()}, {
            "fiction": FICTION, "general-writing": GENERAL,
        })
        all_ids = {s["id"] for s in runtime("catalog")["skills"]}
        for name in RETIRED:
            self.assertNotIn("writing/" + name, all_ids)
            self.assertFalse((SKILLS / name).exists())
        for name in FICTION | GENERAL:
            self.assertIn("writing/" + name, all_ids)

    def test_review_modes_are_focused_and_canon_bound(self):
        skill = read(SKILLS / "fiction-review/SKILL.md")
        self.assertIn('optional_uses: "writing/fiction-prose-editing"', skill)
        self.assertIn("默认只诊断", skill)
        self.assertIn("Evidence First", skill)
        self.assertIn("按需", skill)
        for name, phrases in {
            "review-character-mode.md": ["默认社交基线", "Character Voice", "Knowledge / Permission / Memory Boundary"],
            "review-continuity-mode.md": ["前一章 → 当前章 → 后一章", "关系阶段"],
            "review-expression-mode.md": ["State-conditioned Voice Gate", "Voice Baseline", "Protect"],
            "review-readability-mode.md": ["第一次阅读", "术语", "阅读"],
            "review-pacing-mode.md": ["Reader Pull", "情感投资", "不为提高 Reader Pull"],
            "review-full-book-mode.md": ["Version Binding Gate", "Publication Readiness", "Protect / No Change Gate"],
        }.items():
            with self.subTest(mode=name):
                path = FICTION_REFS / name
                body = read(path)
                self.assertLessEqual(len(body), 6000)
                self.assertIn(name, skill)
                for phrase in phrases:
                    self.assertIn(phrase, body)
        self.assertIn("publication-proofread.md", skill)
        self.assertIn("完成整本", read(FICTION_REFS / "review-full-book-mode.md"))

    def test_readiness_only_does_not_generate_and_draft_keeps_postflight(self):
        s = read(SKILLS / "fiction-manuscript-drafting/SKILL.md")
        self.assertIn("READINESS_ONLY", s)
        self.assertIn("绝不写正文", s)
        self.assertIn("没有逐章章纲本身不构成 Not Ready", s)
        self.assertIn("DRAFT", s)
        self.assertIn("初稿及 Reader Pass", s)
        self.assertIn("Voice Calibration", s)
        self.assertIn("Protect / No Change", s)
        self.assertNotIn("uses: \"writing/fiction-manuscript-readiness\"", s)
        self.assertIn('optional_uses: "writing/fiction-prose-editing"', s)
        self.assertIn("Writing Simulation Test", read(FICTION_REFS / "manuscript-readiness.md"))
        self.assertIn("Manuscript Readiness: Ready | Not Ready",
                      read(FICTION_REFS / "manuscript-readiness-mode.md"))
        loop = read(FICTION_REFS / "drafting-authoring-loop.md")
        self.assertIn("Chapter Engine", loop)
        self.assertIn("Feedback Delta", loop)
        self.assertIn("Postflight", loop)
        self.assertLessEqual(len(loop), 6000)

    def test_clear_and_humanizer_one_owner(self):
        main = read(SKILLS / "clear-writing/SKILL.md")
        humanizer = read(SKILLS / "clear-writing/references/humanizer-mode.md")
        self.assertIn("Humanizer", main)
        self.assertIn("references/humanizer-mode.md", main)
        self.assertIn("False-positive Guard", humanizer)
        self.assertIn("写作样本优先", humanizer)
        self.assertIn("保留每个 claim", humanizer)
        self.assertIn("writing/fiction-prose-editing", main)
        self.assertTrue((SKILLS / "clear-writing/references/humanizer-upstream.md").is_file())
        executive = runtime("skill", "writing/executive-communication")["skill"]
        self.assertEqual(executive["optionalUses"], ["writing/clear-writing"])

    def test_explainer_preserves_two_distinct_source_bounded_flows(self):
        main = read(SKILLS / "explanatory-writing/SKILL.md")
        self.assertIn("Science Explanation", main)
        self.assertIn("Practical Guide", main)
        for name in ("science-explanation-mode.md", "usage-guide-mode.md",
                     "explanation-craft.md", "narrative-patterns.md",
                     "source-derived-notes.md"):
            self.assertIn(name, main) if name != "source-derived-notes.md" else None
            self.assertTrue((SKILLS / "explanatory-writing/references" / name).is_file())
        sci = read(SKILLS / "explanatory-writing/references/science-explanation-mode.md")
        guide = read(SKILLS / "explanatory-writing/references/usage-guide-mode.md")
        self.assertIn("最小模型", sci)
        self.assertIn("认知缺口", sci)
        self.assertIn("以“任务”组织", guide)
        self.assertIn("没有的能力", guide)
        self.assertEqual(set(runtime("skill", "writing/explanatory-writing")["skill"]["optionalUses"]), {
            "research/deep-research", "research/knowledge-synthesis", "writing/clear-writing",
        })

    def test_mode_references_resolve_after_move(self):
        # Moved mode references must resolve relative filenames from their
        # current parent folder, not from their retired public Skill roots.
        sources = list(FICTION_REFS.glob("review-*-mode.md")) + [
            FICTION_REFS / "manuscript-readiness-mode.md",
            FICTION_REFS / "drafting-authoring-loop.md",
        ] + list((SKILLS / "explanatory-writing/references").glob("*-mode.md"))
        self.assertEqual(len(sources), 10)
        checked_links = 0
        for source in sources:
            body = read(source)
            self.assertNotIn("../../shared/fiction/references/", body, source)
            links = re.findall(r"`([a-zA-Z0-9._-]+\.md)`", body)
            checked_links += len(links)
            for name in links:
                with self.subTest(source=source.name, linked=name):
                    self.assertTrue((source.parent / name).is_file())
        self.assertGreater(checked_links, 10)

    def test_frozen_discrete_owners_are_preserved(self):
        discussion = read(SKILLS / "fiction-discussion/SKILL.md")
        conclusion = read(SKILLS / "fiction-conclusion/SKILL.md")
        validation = read(SKILLS / "fiction-revision-validation/SKILL.md")
        editing = read(SKILLS / "fiction-prose-editing/SKILL.md")
        self.assertIn("creative_open", discussion)
        self.assertIn("Standalone Reader Gate", conclusion)
        self.assertIn("双向完整性审计", conclusion)
        self.assertIn("Diff / Baseline First", validation)
        self.assertIn("Preserve Set", validation)
        self.assertIn("对白逐字保留", editing)
        self.assertIn("Protect / No Change", editing)
        self.assertTrue((WRITING / "MIGRATION-v4.0.md").is_file())

    def test_live_frontmatter_has_no_removed_owner_references(self):
        # Historic fixture prose and migration notes may intentionally mention retired IDs.
        for p in SKILLS.glob("*/SKILL.md"):
            body = read(p)
            frontmatter = body.split("---", 2)[1]
            for name in RETIRED:
                self.assertNotIn("writing/" + name, frontmatter, p)
        with CORPUS.open(encoding="utf-8", newline="") as stream:
            corpus = list(csv.DictReader(stream))
        self.assertEqual(len({r["id"] for r in corpus}), len(corpus))
        for row in corpus:
            for name in RETIRED:
                self.assertNotIn("writing/" + name, row["expected"], row["id"])
        for prefix in ("W4",):
            samples = [r for r in corpus if r["id"].startswith(prefix)]
            self.assertGreaterEqual(len(samples), 28)
            self.assertTrue({"positive", "negative", "composition",
                             "conflict", "multi-turn", "gate", "adversarial"}
                            .issubset({r["bucket"] for r in samples}))
        for key, expected in {
            "FIC029": "fiction-review", "FIC035": "fiction-review",
            "FIC041": "fiction-review", "FIC053": "fiction-review",
            "FIC059": "fiction-review", "FIC069": "fiction-manuscript-drafting",
            "FIC061": "explanatory-writing", "P053": "clear-writing",
        }.items():
            row = next(r for r in corpus if r["id"] == key)
            self.assertIn(expected, row["expected"])


if __name__ == "__main__":
    unittest.main()
