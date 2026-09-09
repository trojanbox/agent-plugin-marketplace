# 业务测试方案发布、下游 Goal 与强制检查

方案主体完成、准备 GitHub 留痕或交给 Test Agent 时读取。

# 十一、GitHub 发布

创建前查重开放和已关闭计划；同一轮业务目标已有有效计划时复用/更新。

标题：`【业务测试方案】<业务目标>`。

仓库存在 `test-plan` 标签时添加；标签不存在不阻塞创建，只报告 `label_missing`。

正文建议：Spec Gate/权威来源、Alignment 状态、Business Understanding、Expected Contract、Current Baseline/Gap、Feature、State、Invariants、Scenario、Gherkin、Business Evidence、Technical Handoff、非目标/Stop Conditions、真实性边界、下游 Goal。

GitHub 不可写时按 handoff 协议生成交接包，不得声称 Issue 已创建。

# 十二、下游 Test Agent Goal

Goal 只告诉具备真实测试环境的 Agent：读取业务测试方案、当前源码与 `AGENTS.md`；按 Scenario 从真实用户/公开入口执行；保留 Business Evidence；不自行改变 Expected Contract；Harness 问题按技术测试方案或报告 blocker；产品缺陷冻结证据；未执行项如实报告。

本 Skill 不执行 Goal。

# 十三、最终回复

至少包含 Spec Gate/权威来源状态、Alignment 状态、业务理解摘要、计划 Issue/交接文件、Feature/Scenario 数、需要技术方案的场景和真实性边界。

`pending_alignment` 时优先展示 Business Understanding Card 和待确认项，不伪装成最终计划。

# 十四、强制检查

- [ ] 已读取 `AGENTS.md`（存在时）；
- [ ] 已执行 Spec Gate，并记录 `spec_source / spec_not_required / spec_skipped_by_user` 中适用项；
- [ ] 已执行 Business Alignment Gate；
- [ ] 没有重复询问用户已经确认的决定；
- [ ] Expected Business Contract 没有从当前源码静默推导；
- [ ] 已建立 Feature / State / Invariant / Scenario；
- [ ] Gherkin 从业务入口表达；
- [ ] 没把 Unit/E2E/Harness/Fault Seam 设计塞进业务方案；
- [ ] 未实现能力没有误报 Bug；
- [ ] 已确认 Bug 已旁路留痕；
- [ ] 没有声称真实测试已经执行；
- [ ] GitHub 写入结果真实。
