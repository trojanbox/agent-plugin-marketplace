# 讨论收口与下游 Spec Gate

只有讨论准备收口、进入实施计划/业务测试方案/技术测试方案时读取。

## 讨论结束

### 先判断下一阶段类型

讨论准备收口时，先确定用户当前真正要进入的下一阶段。不要把所有讨论都强制导向实施计划。

#### A. 实施计划

如果下一步是把已确认目标拆成开发 Task，候选交接状态为 `ready_for_development_plan`。真实代码实现不由本 Runtime 承担。

#### B. 业务测试方案

如果下一步是从用户视角定义业务验收，并且用户目标、入口、成功/失败语义、核心状态和业务不变量已经足够明确，候选交接状态为 `ready_for_business_test_plan`，转交 `github-business-test-plan-generator`。业务测试方案会先回显 Business Understanding；已有讨论决定可作为 `confirmed_source`，不重复询问已经确认的内容。

#### C. 技术测试方案

如果下一步是定义 Unit/Integration/Contract/E2E 分层、Harness/Fixture/Reset、自动化迁移、故障注入、并发/恢复、Evidence 或 Fresh Run，并且目标合同已经明确，候选交接状态为 `ready_for_technical_test_plan`，转交 `github-technical-test-plan-generator`。技术测试方案不能替用户决定产品业务行为。

### 对所有下游计划执行 Spec Gate

确定目标交付物后，按主 `SKILL.md` 已声明的共享研发协作策略与 `github-spec` 对实施计划、业务测试方案、技术测试方案执行同一套 Gate：

- `required`：已有当前有效【结论】完整覆盖时，记录 `spec_source` 后进入所选计划；尚无有效结论时状态进入 `ready_for_spec`；
- `not_required`：记录 `spec_not_required` 与具体理由后，进入所选计划；
- `undetermined`：继续补事实或讨论，不能进入任一下游计划。

测试路径不会因为名称中包含“测试方案”就自动要求结论。业务测试方案的 Business Alignment Gate 仍需独立执行，不能用 Spec Gate 代替业务理解确认。

不得因为用户没有主动说“结论”就静默绕过 Gate。如果用户在 `required` 状态下明确选择跳过结论，记录 `spec_skipped_by_user` 与风险边界后，才允许转向所选计划；关键决策仍未确认时不能使用该覆盖。

结束条件：

- 目标范围内的重大决策已确认；
- 决策树的有效分支均已 `resolved / pruned / deferred`，且 待决项为空；
- 延期项和非目标明确；
- 决定之间没有明显冲突；
- 当前实现、目标方案、差距清楚；
- 必要的流程图和时序图与当前共识一致；
- 源码事实、产品决定、推断和假设已区分；
- 用户明确结束，或剩余项不影响目标下游交付物。

追加讨论总结，包含：

- 最终有效决定；
- 关键理由；
- 当前实现 → 目标方案 变化；
- 下游执行约束；
- 延期项 / 非目标；
- 源码验证状态；
- 仍需后续 Issue 处理的事项；
- 当前交接状态。

交接状态只能是：

- `discussion_in_progress`：仍需继续讨论；
- `ready_for_business_test_plan`：业务目标和关键不变量已明确，且已有当前有效 `spec_source`、Spec Gate=`not_required` 已记录理由，或用户已明确记录 `spec_skipped_by_user`；
- `ready_for_technical_test_plan`：技术测试目标、目标合同和主要风险已明确，且已有当前有效 `spec_source`、Spec Gate=`not_required` 已记录理由，或用户已明确记录 `spec_skipped_by_user`；
- `ready_for_spec`：所选下游计划涉及高传播合同、当前尚无有效【结论】，可以生成正式结论；
- `ready_for_development_plan`：实施目标已明确，且已有当前有效 `spec_source`、Spec Gate=`not_required` 已记录理由，或用户已明确记录 `spec_skipped_by_user`；信息已足以生成实施计划；
- `blocked`：缺少源码、外部决定或关键事实，无法可靠进入目标下一阶段。

需要业务测试方案时转交 `github-business-test-plan-generator`；需要技术测试方案时转交 `github-technical-test-plan-generator`；需要结论时转交 `github-spec`；需要实施计划时转交 `github-development-plan-generator`。本 Skill 不自动创建后续计划或修改源码。

## 安全与真实性

敏感漏洞、凭证和个人数据不进入公开讨论。没有 GitHub 工具成功结果时，不得声称 Issue 或评论已写入。未获得源码或测试证据时，不得把假设描述为事实。
