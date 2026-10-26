"""Explicit authorization is required to freeze conclusions after discussions."""
from __future__ import annotations

import csv
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEV = ROOT / "plugins" / "development"
WRITING = ROOT / "plugins" / "writing"
ROUTES = ROOT / "plugins/ai-workflow/skills/skill-system-design/references/semantic-routing-regression.csv"


def read(p):
    return p.read_text(encoding="utf-8")


class ConclusionAuthorizationGateTests(unittest.TestCase):
    def test_development_gate_requires_separate_permission(self):
        discussion = read(DEV / "skills/github-discussion-facilitator/SKILL.md")
        closure = read(DEV / "skills/github-discussion-facilitator/references/closure-and-spec-gate.md")
        spec = read(DEV / "skills/github-spec/SKILL.md")
        issue = read(DEV / "skills/github-spec/references/delivery-and-issue.md")
        policy = read(DEV / "shared/github-core/references/collaboration-policy.md")
        self.assertIn("明确询问用户是否创建独立【开发·结论】", discussion)
        self.assertIn("未经用户明确同意", discussion)
        self.assertIn("ready_for_spec", closure)
        self.assertIn("不构成", closure)
        self.assertIn("不能把问题本身当“同意创建”", closure)
        self.assertIn("spec_creation_not_authorized", closure)
        self.assertIn("明确创建授权 Gate", spec)
        self.assertIn("开始写入", spec) if "开始写入" in spec else self.assertIn("写入结论 Issue", spec)
        self.assertIn("均不是创建【开发·结论】的授权", policy)
        self.assertIn("此处所有“创建/更新【开发·结论】”操作都必须先通过", issue)
        self.assertIn("只有通过用户明确授权 Gate", closure)

    def test_creative_discussion_is_also_non_automatic(self):
        discussion = read(WRITING / "skills/fiction-discussion/SKILL.md")
        decision = read(WRITING / "skills/fiction-discussion/references/decision-loop.md")
        conclusion = read(WRITING / "skills/fiction-conclusion/SKILL.md")
        self.assertIn("先问用户是否创建【创作·结论】", discussion)
        self.assertIn("能收口吗", discussion)
        self.assertIn("不是用户已授权创建【创作·结论】", decision)
        self.assertIn("用户授权 Gate", conclusion)
        self.assertIn("用户只是询问“能否收口”", conclusion)

    def test_positive_negative_and_prior_authorization_examples(self):
        with ROUTES.open(encoding="utf-8", newline="") as fp:
            rows = list(csv.DictReader(fp))
        cases = {row["id"]: row for row in rows if row["id"].startswith("CAG")}
        self.assertEqual(len(cases), 14)
        self.assertEqual(len(rows), len({row["id"] for row in rows}))
        self.assertTrue({"positive", "negative", "gate", "multi-turn", "adversarial"}
                        .issubset({row["bucket"] for row in cases.values()}))
        self.assertIn("只评估", cases["CAG001"]["expected"])
        self.assertIn("不能自动创建", cases["CAG002"]["expected"])
        self.assertIn("明确创建授权", cases["CAG005"]["expected"])
        self.assertIn("明确预授权", cases["CAG007"]["expected"])
        self.assertIn("writing/fiction-discussion", cases["CAG011"]["expected"])
        self.assertIn("writing/fiction-conclusion", cases["CAG012"]["expected"])


if __name__ == "__main__":
    unittest.main()
