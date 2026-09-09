---
name: github-discussion-facilitator
description: "在需要围绕技术、产品、架构或实现主题与用户进行可追踪讨论时使用。正式讨论前创建或续用一个【讨论】Issue，以源码证据、当前实现/目标方案/差距、决策树、待决项和 Mermaid 图示为核心表达，按决策依赖逐步确认高杠杆问题，并在每次回答后追加可追溯的决定、理由、边界和未决项；无法写入 GitHub 时使用标准化本地交接包持续记录。"
phase: discussion
optional_uses: "development/github-incidental-bug-capture"
---

# GitHub 讨论主持

## 唯一目标

把“还没有定案”的产品/技术/架构问题推进成**可追溯的决策过程**：先建立事实和边界，再按依赖顺序讨论关键决策，记录已确认决定与未决项，最后判断是否需要【结论】。

共享研发规则见 `../../shared/github-core/references/collaboration-policy.md`。GitHub 写操作异常时先读取 `../../shared/github-core/references/github-remote-write-recovery.md` 完成恢复 Gate；只有 Gate 确认远端能力确实不可用时，才按 `../../shared/github-core/references/handoff-protocol.md` 文件化交接。

## 什么时候使用

- 用户明确说“创建讨论/咱们讨论一下/这个方案怎么定”；
- 当前问题存在多个合理方案，需要用户做产品、技术或架构决定；
- 已有同一轮未结束讨论，需要继续推进。

已确认目标只需冻结合同 → `github-spec`；独立故障根因 → `github-bug-investigation`；只需梳理当前实现 → 调研 Skill。

## Skill Composition / 旁路缺陷捕获

讨论过程中读取源码/日志等证据，若确认独立生产 Bug，组合 `development/github-incidental-bug-capture` 留痕后回到讨论。证据不足、未实现需求、合同未决、测试/Harness 问题不自动报生产 Bug。

## 核心流程

1. **连续性检查**：判断新建还是续用同一轮【讨论】；讨论类 Issue 可复用同一轮，避免重复创建。
2. **证据与范围门**：涉及当前实现时必须先读足够源码；建立当前实现、目标、差距、范围/非目标。需要详细证据索引、决策树或图示时读取 `references/evidence-and-decision-model.md`。
3. **建立/续用记录**：正式讨论前创建或续用【讨论】Issue；写入结构与决策记录时读取 `references/issue-recording.md`。
4. **逐项决策**：一次优先推进一个高杠杆待决项；给出必要上下文和推荐理由，用户回答后记录 `决定 / 理由 / 边界 / 影响 / 仍未决`。
5. **持续刷新状态**：已确认决定不能被后续评论静默覆盖；条件变化时显式记录替代关系。
6. **收口**：所有关键决策完成后，才判断下一阶段。准备进入实施计划、业务测试方案或技术测试方案时读取 `references/closure-and-spec-gate.md`，对所有下游计划执行 Spec Gate。

## 真实性边界

- 未读源码时不编造当前实现；
- 计划中的目标不能写成已实现；
- GitHub 写入异常时先区分 PATH / CLI / Shell 命令形态 / 认证 / 远端拒绝；`gh: not found` 或复杂命令被宿主拒绝不能直接触发 handoff；
- GitHub 写入失败时不能声称已创建/更新 Issue；
- 用户尚未确认的方案只能标记为建议或待决；
- 讨论结束不等于代码已实现或测试已通过。
