---
name: github-discussion-facilitator
description: "在围绕技术、架构、实现方案或明确要求【开发·讨论】进行可追踪讨论时使用。正式讨论前创建或续用 Issue，以源码证据、当前实现/目标方案/差距、决策树和待决项逐项确认；GitHub 不可写时按恢复 Gate 交接。独立产品用户行为、需求范围和体验取舍归 product/product-discussion。"
phase: discussion
optional_uses: "github/github-issue-manager,development/github-incidental-bug-capture"
---

# GitHub 讨论主持

## 产品阶段边界

明确要求【开发·讨论】、工程架构/API/状态归属/技术可行性时继续由本 Skill 主导；只讨论用户如何使用、产品范围和体验取舍且无工程主目标时，进入 `product/product-discussion`。继承当前有效阶段，泛指“继续讨论”不能因产品词汇重新开另一轮。

## 唯一目标

把“还没有定案”的产品/技术/架构问题推进成**可追溯的决策过程**：先建立事实和边界，再按依赖顺序讨论关键决策，记录已确认决定与未决项，最后判断是否具备【开发·结论】条件；**只检查或收口不等于授权创建，必须先问用户并获得明确确认**。

共享研发规则见 `../../shared/github-core/references/collaboration-policy.md`。GitHub 写操作异常时先读取 `<github-shared>/references/github-remote-write-recovery.md` 完成恢复 Gate；只有 Gate 确认远端能力确实不可用时，才按 `<github-shared>/references/handoff-protocol.md` 文件化交接。

## 什么时候使用

- 用户明确说“创建讨论/咱们讨论一下/这个方案怎么定”；
- 当前问题存在多个合理方案，需要用户做产品、技术或架构决定；
- 已有同一轮未结束讨论，需要继续推进。

已确认目标需要冻结合同时，先确认用户**明确要求创建/生成结论**才进入 `github-spec`；仅询问“能否形成结论/是否收口”仍在本 Skill 报告评估并征求授权；独立故障根因 → `github-bug-investigation`；只需梳理当前实现 → 调研 Skill。

## Skill Composition / 旁路缺陷捕获

- 需要 GitHub 持久化或写入恢复时组合 `github/github-issue-manager`。`<github-shared>` 指该 Skill 所属 github Plugin 的真实 `shared/` 目录：自用 Runtime 读取 `skill github/github-issue-manager` 的 `sharedRoot`；宿主按已发现 Skill 路径定位，不假设 Plugin 相邻安装。未安装时报告依赖缺失，不猜路径。

讨论过程中读取源码/日志等证据，若确认独立生产 Bug，组合 `development/github-incidental-bug-capture` 留痕后回到讨论。证据不足、未实现需求、合同未决、测试/Harness 问题不自动报生产 Bug。

## 核心流程

1. **连续性检查**：判断新建还是续用同一轮【开发·讨论】；讨论类 Issue 可复用同一轮，避免重复创建。
2. **证据与范围门**：涉及当前实现时必须先读足够源码；建立当前实现、目标、差距、范围/非目标。需要详细证据索引、决策树或图示时读取 `references/evidence-and-decision-model.md`。
3. **建立/续用记录**：正式讨论前创建或续用【开发·讨论】Issue；写入结构与决策记录时读取 `references/issue-recording.md`。
4. **逐项决策**：一次优先推进一个高杠杆待决项；给出必要上下文和推荐理由，用户回答后记录 `决定 / 理由 / 边界 / 影响 / 仍未决`。
5. **持续刷新状态**：已确认决定不能被后续评论静默覆盖；条件变化时显式记录替代关系。
6. **收口与授权 Gate**：所有关键决策完成后，先在讨论中报告是否 Ready、剩余阻塞及 `Spec Gate`。即使 `ready_for_spec`，也必须**明确询问用户是否创建独立【开发·结论】**；未经用户明确同意，不调用 `github-spec`、不创建/更新结论 Issue、不提前关闭讨论以假装结论已生成。准备进入实施计划、业务测试方案或技术测试方案时读取 `references/closure-and-spec-gate.md`，**对所有下游计划执行 Spec Gate**，但不得把 Spec Gate 当作创建授权。

## 真实性边界

- 未读源码时不编造当前实现；
- 计划中的目标不能写成已实现；
- GitHub 写入异常时先区分 PATH / CLI / Shell 命令形态 / 认证 / 远端拒绝；`gh: not found` 或复杂命令被宿主拒绝不能直接触发 handoff；
- GitHub 写入失败时不能声称已创建/更新 Issue；
- 用户尚未确认的方案只能标记为建议或待决；
- 讨论结束不等于代码已实现或测试已通过。
