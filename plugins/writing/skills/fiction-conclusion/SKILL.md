---
name: fiction-conclusion
description: "【创作·结论】用于把已经完成的一轮小说创作讨论无损冻结成独立、可追溯、可被后续 Agent 直接执行的权威结论。适合‘把刚才讨论整理成结论/创建创作结论/把这轮决定冻结下来/后续按这份结论改 Storybook’。它不继续创作、不重新做方案选择、不直接修改 Storybook；如果仍有高影响创作选择未确认，回 fiction-discussion。"
visibility: workflow
phase: specification
optional_uses: "github/github-issue-manager"
---

# 【创作·结论】

## 唯一目标

把一轮已经结束的【创作·讨论】整理成**可脱离原讨论独立执行**的结论。结论继承已确认决定，不新增世界观、人物、剧情、表达或章纲选择。

## 主流程

1. **完整读取来源**：有 Discussion Issue 时读取正文、全部相关评论和分页；没有 Issue 时读取当前会话中已确认决定、用户补充、Storybook 当前权威文件、相关 Outline / Manuscript 与明确继承的历史结论。
2. **建立有效来源集**：区分 confirmed decision、current fact、inference、candidate、superseded、deferred、non-goal、creative_open、conflict。
3. **建立 Coverage Table**：每个高影响 D-xxx / 当前事实 / Preserve Set / deferred / creative_open 必须映射到结论落点；存在未解决 conflict 时停止并回 Discussion。
4. **无损成文**：保留 Character Voice、人物反应、Knowledge Boundary、Story Movement、信息释放、关系变化、Work Voice / POV、Preserve Set、明确禁止方向等可执行细节，禁止压成“保持自然/保持风格一致”。
5. **Standalone Reader Gate**：一个没参加原讨论的 Agent，只读本结论也能知道背景、当前问题、最终决定、理由、被否决/替代方向、creative_open、Owner 传播、后续调整范围与验收方式。
6. **双向完整性审计**：来源→结论无遗漏/歪曲；结论→来源无新增发明、候选升级或 superseded 复活。
7. **持久化**：创建/更新 `【创作·结论】【书名】<主题>`，写后重新读取真实 Issue；只有真实写入与审计通过后才宣称完成。

## 按需读取

- 需要来源分类、Coverage、Standalone Reader Gate、双向审计时读取 `references/integrity-contract.md`。
- 需要 Issue 结构、命名、跨结论 supersedes 与完成状态时读取 `references/delivery.md`。

## Composition

结论需要长期持久化时组合 `github/github-issue-manager`。远端不可写时可生成完整本地结论交接包，但不得声称 GitHub 结论已创建。

## 停止边界

- 写结论必须新增一个高影响创作选择才能完整 → 停止，回 `writing/fiction-discussion`。
- 本阶段不直接修改 Storybook、Outline 或 Manuscript。
- 完成仅表示本轮讨论已冻结成可执行结论，不表示后续作品调整已经完成。
