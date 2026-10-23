# Description 保守压缩语义路由回归

本轮只改 Plugin / Skill 的 `description` 文本，不改触发词、Group、phase、uses/optional_uses 或 SKILL.md 正文。改动集中在 6 个 Plugin（`ai-workflow`、`business`、`data`、`design`、`education`、`github`），其余 Plugin 未动。

回归范围按“受影响 Plugin 复用已有基准样本”选取，覆盖 positive / breadth-positive / negative / adversarial / multi-turn 桶；未覆盖的 Plugin 因描述未改，不在本轮范围内。

| ID | 受影响 Plugin | Expected | Current decision | Result |
|---|---|---|---|---|
| P001 | ai-workflow | skill-system-design | skill-system-design | PASS |
| P002 | ai-workflow | skill-system-design | skill-system-design | PASS |
| P003 | business | competitive-analysis | competitive-analysis | PASS |
| P004 | business | competitive-analysis | competitive-analysis | PASS |
| P005 | business | product-marketing-context | product-marketing-context | PASS |
| P006 | business | product-marketing-context | product-marketing-context | PASS |
| P007 | data | data-exploration | data-exploration | PASS |
| P008 | data | data-exploration | data-exploration | PASS |
| P009 | data | data-validation | data-validation | PASS |
| P010 | data | data-validation | data-validation | PASS |
| P011 | data | data-visualization | data-visualization | PASS |
| T060 | data | data-validation | data-validation | PASS |
| D001 | design | visual-artifact-design | visual-artifact-design | PASS |
| D002 | design | visual-artifact-design | visual-artifact-design | PASS |
| D003 | design | visual-artifact-design | visual-artifact-design | PASS |
| D004 | design | visual-artifact-design | visual-artifact-design | PASS |
| D006 | design | design-system-authoring | design-system-authoring | PASS |
| D007 | design | design-system-authoring | design-system-authoring | PASS |
| A012 | education | k12-lesson-planning | k12-lesson-planning | PASS |
| P025 | education | k12-lesson-planning | k12-lesson-planning | PASS |
| P026 | education | k12-lesson-planning | k12-lesson-planning | PASS |
| P027 | education | k12-lesson-differentiation | k12-lesson-differentiation | PASS |
| P028 | education | k12-lesson-differentiation | k12-lesson-differentiation | PASS |
| P019 | github | github-issue-handoff-sync | github-issue-handoff-sync | PASS |
| P020 | github | github-issue-handoff-sync | github-issue-handoff-sync | PASS |
| P021 | github | github-issue-manager | github-issue-manager | PASS |
| P022 | github | github-issue-manager | github-issue-manager | PASS |
| P023 | github | github-issue-triage | github-issue-triage | PASS |
| P024 | github | github-issue-triage | github-issue-triage | PASS |

结论：本轮删除的是 Plugin 描述里的 Skill 枚举和少量冗余从句，没有删除 Skill 级触发词与邻居边界；受影响 6 个 Plugin 的 29 条样本路由结果与预期一致。

边界：这是单模型对相关子集的逐条判断，不构成总体准确率；完整 420 条基准未全跑。若后续决定压缩例句与能力覆盖清单，必须扩大回归范围。
