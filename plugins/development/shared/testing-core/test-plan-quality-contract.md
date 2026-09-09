# Development 测试方案公共质量合同

本文件由 `development` 下的技术测试方案、业务测试方案与测试方案审计共享。它定义**如何设计可执行、可审计的测试方案**，不授权当前 Skill Runtime 编写生产代码、编写测试代码、部署系统或宣称真实测试已经通过。

## 1. 事实与目标必须分开

测试设计至少区分四类信息：

- `verified_fact`：当前源码、测试、配置、日志、截图或可复现结果直接证明；
- `user_decision`：用户已经明确确认的业务/技术决定；
- `inference`：基于证据推导但不是直接事实；
- `assumption`：为了继续设计而暂时采用、仍需确认的假设。

**当前实现不能自动成为预期行为。** 如果源码行为与用户已确认合同冲突，应记录为差距；不能把现有 Bug 固化成测试期望。

## 2. 当前实现基线与目标合同

测试方案必须能回答：

1. 当前系统实际有什么入口、状态、依赖和测试能力；
2. 本轮要验证的目标合同是什么；
3. 两者之间是否存在差距或未决项；
4. 哪些测试只能在具备真实环境的下游 Test/Coding Agent 中执行。

访问项目源码时读取根目录及适用子目录 `AGENTS.md`。

## 2.1 Spec Gate 与合同权威状态

进入最终【业务测试方案】或【技术测试方案】前必须执行与实施计划相同的 Spec Gate：

- `required`：高传播合同必须由当前有效【结论】覆盖，并记录 `spec_source`；尚无有效结论时状态进入 `ready_for_spec`，不能直接发布最终测试方案；
- `not_required`：局部、低传播、完全位于既有合同内的验证范围可以跳过结论，但必须记录 `spec_not_required` 与具体理由；
- `undetermined`：仍缺事实或高影响决定，返回调研/讨论，不能让测试设计替代产品决策；
- 用户在 `required` 状态下明确跳过时，记录 `spec_skipped_by_user` 与风险边界；关键决定仍未确认时不能使用该覆盖。

测试方案不会因为名称中包含“测试”就自动要求结论。Business Alignment Gate 负责确认业务理解，Spec Gate 负责确认高传播合同是否已经冻结，两者必须分别处理。

## 3. 不越过系统所有权

测试数据、Fixture、Reset、故障注入前先判断资源所有权：

- 当前项目拥有：可以规划可控创建、变更、故障注入与精确清理；
- 外部系统拥有：只使用公开契约、沙盒/测试租户和 Provider 明确支持的测试生命周期；禁止为了测试稳定性直接修改外部 DB、私有状态或管理口。

## 4. Environment / Harness / Fixture / Reset

技术测试方案应显式说明适用项：

- 测试运行环境与依赖；
- Harness、Fixture、Seed、Mock/Stub/Service Virtualization；
- 唯一命名空间、测试账号、租户、站点或资源；
- Reset 方式与清理边界；
- 不能安全 Reset 时的隔离方案；
- 环境或权限不足时的 `BLOCKED` 条件。

业务测试方案只描述业务前置数据和用户可见状态；Harness/Fixture 的实现细节交给技术测试方案。

## 5. Evidence Contract

所有测试方案都要定义**计划采集什么证据**，但不能把“计划采集”写成“已经采集”。

常见证据：

- 用户入口与关键页面状态；
- API 请求/响应与错误合同；
- 关键持久化或公开可观察状态；
- 日志、事件、任务状态；
- 目标对象与非目标对象的前后对比；
- 故障注入已命中与恢复完成的证据。

证据必须能对应 Scenario / Risk / Invariant，而不是只保存“成功截图”。

## 6. 等待、重试与稳定性

测试设计禁止把下列方式当作最终稳定方案：

- 固定 `sleep`；
- 无依据重试；
- 失败后刷新页面赌成功；
- 跳过真实入口直接改 DB/内部状态；
- 关闭校验；
- 把 flaky 现象用高重试次数掩盖。

异步流程应规划条件等待、明确超时、可观察完成条件和失败证据。

## 7. System Resilience Profile（仅技术测试）

当风险来自 crash / retry / reconnect / race / partial completion / recovery / duplicate delivery / identity continuity 时，技术测试方案增加：

- System Under Test 与关键 ownership；
- 原子故障点与确定性 Fault Seam；
- 故障前状态、注入条件、故障后可观察状态；
- Recovery Matrix；
- 幂等、重入、重复副作用和 identity continuity 不变量；
- 外部服务契约虚拟化与 Contract Drift 检测；
- 必要时先做有界 Real-stack Exploration，再固化 Harness；
- 正式稳定性 Fresh Run 默认 `retries=0`，重试不能掩盖竞态或恢复缺陷。

## 8. 失败分类

测试方案与审计统一使用以下分类描述执行期可能结果：

- `PRODUCTION_BUG`：产品实现违反已确认目标合同；
- `TEST_BUG`：测试断言、选择器、步骤或测试代码自身错误；
- `HARNESS_BUG`：Harness 实现错误；
- `HARNESS_GAP`：缺少必要测试能力；
- `ENVIRONMENT_BLOCKER`：权限、依赖、网络、服务或环境阻塞；
- `EXTERNAL_BLOCKER`：外部系统通过公开契约仍无法满足前置；
- `CONTRACT_DRIFT`：外部/内部公开合同发生漂移；
- `CONTRACT_CONFLICT`：目标合同本身相互冲突或未决。

当前 Runtime 只设计分类与处理策略，不声称实际发生了哪一种，除非用户已经提供真实执行证据。

## 9. 旁路 Bug 捕获

设计或审计过程中读取源码、日志、测试或截图时，如果发现**已经有证据支持的独立生产 Bug**，主 Skill 保持不变；一旦满足“已确认独立生产 Bug”条件，必须组合 `development/github-incidental-bug-capture` 完成查重与留痕后继续。

证据不足、未实现需求、合同未决、纯测试/Harness/环境问题不得误报生产 Bug，但要在当前输出中按真实类别说明。

## 10. 真实性边界

Development 测试类 Skill 可以交付：

- 测试范围；
- Scenario / Risk / Invariant；
- 测试分层与 Harness 设计；
- 执行顺序；
- Evidence Contract；
- Fresh Run / 稳定性要求；
- 下游 Test/Coding Agent 执行 Goal。

不能因为计划完整就声称：

- 测试代码已经写好；
- 浏览器/API/系统测试已经执行；
- Fresh Run 已通过；
- 功能已经验证完成。
