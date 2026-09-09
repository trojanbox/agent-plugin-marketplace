---
name: github-bug-investigation
description: "在用户提供源码、日志、复现步骤、测试、截图或补丁，需要调查软件 Bug 时使用。以当前源码和证据确定症状、影响、根因或待验证假设、严重级别、永久解决方向、复杂度和验收要求。默认完成调查而不自动创建 Issue；用户明确要求在调查后留痕时才执行查重/Issue 持久化。根因确认后若用户要直接 `.patch`，先做 S/M/L 与 Patch Fast Lane Gate；仅 S 级合格项进入 source-patch-implementation。"
phase: investigation
optional_uses: "reasoning/scientific-reasoning"
---

# GitHub Bug Investigation / Bug 根因调查

## 唯一目标

把真实软件故障调查到足以让后续研发可靠决策的程度。

调查结果必须覆盖：

- 症状、复现条件、影响和严重级别；
- 当前源码/日志/测试证据；
- 根因，或明确的待验证竞争假设；
- 永久解决方向；
- `S/M/L` 复杂度与 Patch Fast Lane 资格；
- 测试要求和验收标准；
- 真实性边界。

默认**不自动创建 GitHub Issue**，也不修改源码。用户明确要求留痕时，Issue 写入属于调查后的持久化步骤；根因已经完整、当前只剩写 Issue 时切换 `github-issue-manager`。

## Skill Composition

当根因存在多个实质性竞争假设、需要显式预测/证伪时，可按需组合 `reasoning/scientific-reasoning`。Bug 的工程证据、严重级别、复杂度和后续流程仍由本 Skill 决定。

## 一、什么时候使用

高信号：

- “这个报错是什么原因”；
- “这个功能为什么有时候失效”；
- “结合源码帮我查 Bug”；
- 用户给了日志、截图、复现步骤和源码，希望确定根因；
- “分析清楚后创建 Bug Issue” → 先调查，完成后再做持久化。

不使用：

- 已有完整根因报告，只要求创建/更新 Issue → `github-issue-manager`；
- 根因 confirmed + S + 用户明确说“直接 patch” → 通过 Gate 后 `source-patch-implementation`；
- 系统性盘点当前实现 → `github-research-document-generator`；
- 产品/架构行为本身仍未定 → `github-discussion-facilitator`；
- M/L 目标已明确，要拆开发 Task → `github-development-plan-generator`；
- 要设计业务/技术测试 → 对应 Testing Skill。

## 二、事实源

优先级：用户当前描述与复现 → 当前源码/配置/测试 → 日志/截图/抓包/运行证据 → 当前有效 Issue/Discussion/Spec → 历史文档。

访问项目必须读取根目录及适用子目录 `AGENTS.md`。没有源码证据时不得编造文件、函数、调用链和根因。

## 三、先判断是不是 Bug

至少区分：

- `PRODUCTION_BUG`：已实现能力违反已确认合同；
- `NOT_IMPLEMENTED`；
- `CONTRACT_UNDECIDED`；
- `TEST_BUG`；
- `HARNESS/ENVIRONMENT`；
- `DOCUMENTATION_DRIFT`；
- `TECH_DEBT/MAINTENANCE`；
- `INSUFFICIENT_EVIDENCE`。

只有 `PRODUCTION_BUG` 进入缺陷修复/Issue 流程。其它类别按真实类型报告。

## 四、根因调查

建立最小调用/状态链：

```text
Trigger → Entry → State / Contract → Producer / Consumer
→ Persistence / External Boundary → Failure Point → User-visible Symptom
```

关键结论标记 `verified_fact / inference / hypothesis / unknown`。只有假设时说明支持证据、反例、区分假设所需的下一条证据，以及目前不能冻结的结论。

## 五、严重级别

- `P0`：核心链路大面积不可用、不可逆数据破坏、活跃安全/隐私事件等灾难性影响；
- `P1`：关键业务严重受损，影响范围大、稳定复现或有明显数据/兼容风险；
- `P2`：明确业务影响，需要正常排期修复；
- `P3`：低影响但有证据证明违反当前合同。

体验优化、技术债、新需求或未确认产品选择不能为了低优先级归入 P3。

## 六、复杂度与后续 Gate

按共享 `../../shared/github-core/references/collaboration-policy.md` 判断：

- `S + patch_fast_lane_eligible`：如果用户明确要直接修改 → `source-patch-implementation`；
- `S` 但存在高影响未决策 → 进入讨论/Spec，不直接 Patch；
- `M/L`：继续完整流程，需要任务拆解时进入 `github-development-plan-generator`；
- 根因仍是 hypothesis → 留在本 Skill，不能因为用户点名 `.patch` 跳阶段。

## 七、永久解决方向

说明应修正的责任边界/状态/合同、受影响消费者或数据、必须保持的不变量，以及禁止的临时假修复（吞错、固定延时、无依据重试、关闭校验、硬编码、旁路数据）。临时止损必须有退出条件。

本 Skill 不展开逐文件实施手册。

## 八、测试与验收

至少记录：原始复现场景、相关回归范围、关键非目标对象/不变量、适用的失败/恢复路径和业务验收结果。详细 Feature/Gherkin 或 Unit/Integration/E2E/Harness 进入对应 Testing Skill。

## 九、Issue 持久化（仅用户明确要求时）

创建/重开执行类 Issue 前必须查重开放与已关闭记录：同根因开放项补证；同根因关闭项复发优先重开；不同根因新建并关联历史。一个 Issue 只承载一个可独立复现、修复、验收的根因。

无法读取/写入 GitHub 时明确 `triage_unavailable` 或写入能力缺失，并按 `../../shared/github-core/references/handoff-protocol.md` 生成交接；不得声称远端已完成。

## 十、最终回复

至少说明：

- Bug 是否成立；
- 根因状态：confirmed / hypothesis / blocked；
- 严重级别；
- 复杂度与 Patch Fast Lane：eligible / blocked + 理由；
- 永久解决方向与验收要求；
- 如果用户要求 Issue：真实查重/写入状态；
- 当前最合适的下一主 Skill（仅在确实需要下一阶段时）。

## 十一、强制检查

- [ ] 已读取当前源码与适用 `AGENTS.md`；
- [ ] 已区分真实 Bug 与未实现/未决合同/Test/Harness/Environment；
- [ ] 根因和假设强度与证据一致；
- [ ] 已给出 `S/M/L` 与 Fast Lane 判定；
- [ ] 永久解决方向不是临时遮掩；
- [ ] 已包含测试与验收要求；
- [ ] 默认没有擅自创建 Issue 或修改源码；
- [ ] 用户要求 Issue 时已真实查重，GitHub 操作有真实工具结果；
- [ ] 没有声称未执行的修复/测试已通过。
