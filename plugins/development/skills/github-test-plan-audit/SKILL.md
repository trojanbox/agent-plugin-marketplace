---
name: github-test-plan-audit
description: "用于审查已经存在的业务测试方案、技术测试方案或两者组合，检查 Spec Gate/权威来源是否完整、它们是否与当前源码/已确认目标合同一致、覆盖是否充分、是否可交给下游 Agent 执行。业务计划重点审 Business Alignment、Expected Contract、Feature/State/Invariant/Gherkin；技术方案重点审 Risk/Layer、Harness/Fixture/Reset、Evidence、Fresh Run、Resilience 与自动化可维护性。默认只审计和给修改建议，不运行真实测试、不编写测试代码、不修改产品代码。"
phase: verification
optional_uses: "development/github-incidental-bug-capture"
---

# GitHub Test Plan Audit / 测试方案审计

## Skill Composition

- 审计源码/测试/日志时发现已确认独立生产 Bug → `development/github-incidental-bug-capture`；
- 其它疑似问题按真实类别写入审计，不误报生产 Bug。

公共质量合同：`../../shared/testing-core/test-plan-quality-contract.md`。

## 唯一目标

回答：**这份测试方案到底在测什么、预期从哪里来、有没有漏掉关键业务/技术风险、步骤能不能由下游执行环境实现、有没有把现有 Bug 当成标准、有没有用错误测试层或脆弱 Harness 掩盖问题？**

本 Skill 不从零创建整份计划、不执行测试、不写测试代码。

# 一、识别 Plan Type

- `BUSINESS_PLAN`：业务理解、Feature/Scenario/Gherkin/业务验收为主；
- `TECHNICAL_PLAN`：测试层、Harness、Fixture、自动化、稳定性为主；
- `COMBINED_PLAN`：两类内容都存在；
- `UNKNOWN`：无法判断或材料不完整。

没有现成计划、目标是“从零生成”时转对应 Generator。

# 二、事实源与合同

优先级：用户明确决定 → 当前有效【结论】/【讨论】 → 当前源码/测试/配置/日志 → 计划文本 → 历史 Issue/文档。必须读取适用 `AGENTS.md`。

计划里的“预期行为”不能因为与当前源码一致就自动视为正确；没有可追溯来源时标记 `EXPECTED_CONTRACT_SOURCE_GAP`。

## 2.1 Spec Gate / 权威来源审计

检查计划是否明确记录以下一种合法状态：

- `spec_source`：高传播合同由当前有效【结论】覆盖；
- `spec_not_required` + 具体理由：范围局部、低传播且位于既有合同内；
- `spec_skipped_by_user` + 风险边界：用户明确跳过 required 结论。

高传播合同没有有效结论、低传播跳过没有具体理由、Gate 状态与范围明显矛盾，均记为 `BLOCKER`。`undetermined` 状态不得被包装成最终可执行方案。

# 三、业务测试方案审计

## 3.1 Business Alignment

检查 AI 业务理解是否回显、是否有 `confirmed_by_user / confirmed_source / alignment_skipped_by_user`、未确认项是否显式标记。没有可追溯业务合同却把源码行为直接写成 Expected → `BLOCKER`。

## 3.2 Expected / Current 分离

检查 Expected Business Contract、Current Implementation Baseline、Gap 对账，以及未实现能力与 Bug 是否区分。

## 3.3 Feature / State / Invariant / Scenario

| Feature | 状态维度 | Scenario | Invariant | 状态 |
|---|---|---|---|---|
| F01 | ... | S01 | INV-01 | COVERED/PARTIAL/MISSING/OUT_OF_SCOPE |

重点查：只有 happy path、缺失败/取消、漏 reload/reopen、没检查非目标对象、历史回归无 Scenario、组合爆炸或重复。

## 3.4 Gherkin 可执行性

Given 不依赖隐藏 DB 改写；When 使用真实用户/公开入口；Then 证明业务结果和不变量，不能用“200 / no exception / 页面没报错”代替成功。

## 3.5 技术越界

业务计划若大段定义测试框架、Fixture、Fault Seam 或自动化代码结构，应建议拆到技术测试方案。

# 四、技术测试方案审计

## 4.1 Risk / Impact Map

检查测试对象和风险是否明确，以及数据、权限、异步、并发、外部依赖、迁移/兼容等真实影响有没有遗漏。

## 4.2 Existing Test Reuse

检查 retain/extend/migrate/replace/delete 是否有证据，是否重复 E2E，是否把 flaky 测试当长期基线。

## 4.3 Test Layer Matrix

典型错误：所有场景都 Playwright；只测 Unit 却要证明跨服务合同；Build/Lint 替代行为测试；Contract 风险没 Contract Test；并发/恢复没有可控 Fault/Concurrency 方案。

## 4.4 Harness / Environment / Fixture / Reset

检查运行环境、外部系统所有权、Fixture、Reset、并发污染和 Stop Condition。

## 4.5 Resilience Profile

适用时检查确定性 Fault Seam、Recovery Matrix、duplicate side-effect 负向断言、identity continuity、Service Virtualization/Contract Drift、有界 Real-stack Exploration、`retries=0` Fresh Run，以及禁止 random failure/fixed sleep/blind retry。

## 4.6 Evidence / Fresh Run / Flake

检查每个关键风险是否有通过/失败证据、非目标对象检查、Fresh Run 条件、flake 退出条件，并确认“计划证据”没有写成“已验证”。

# 五、Combined Plan 交叉一致性

检查关键 Business Scenario 是否映射技术执行面、技术测试有没有发明业务 Expected、业务 Invariant 是否被技术证据覆盖、技术方案是否漏业务高风险、Scenario/Risk ID 是否能追踪、非目标是否一致。

# 六、问题严重度

- `BLOCKER`：无法可靠执行，或预期合同来源错误/未确认；
- `MAJOR`：关键 Feature/Risk/Invariant/层级/Harness 缺失；
- `MINOR`：可读性、冗余、非关键证据或维护性问题。

每个 Finding 给稳定 ID：`A-01`。

# 七、总体结论

只允许：

- `PASS`：无 Blocker/Major，计划可作为下游执行合同；
- `PASS_WITH_GAPS`：无 Blocker，存在不阻塞执行的明确缺口；
- `REWORK_REQUIRED`：存在 Blocker 或关键 Major。

这是**计划质量结论**，不是产品测试通过结论。

# 八、默认输出

至少包含 Plan Type、Audit Result、Spec Gate/权威来源状态、Business Contract Source、Source Baseline、覆盖概览、Findings、覆盖矩阵、应保留设计、未覆盖/不应覆盖和真实性边界。

# 九、修改原计划

用户明确要求直接修正时，可以更新对应测试方案文本/Issue，但仍属于**计划编辑**：不写测试代码、不跑真实测试、不因为修改计划就声称产品问题已修复。

# 十、与其它 Skill 衔接

- 从零业务测试方案 → `github-business-test-plan-generator`；
- 从零技术测试方案 → `github-technical-test-plan-generator`；
- 产品行为未决 → `github-discussion-facilitator`；
- 需要冻结目标合同 → `github-spec`；
- 需要开发任务拆解 → `github-development-plan-generator`；
- 已确认独立产品 Bug → 主任务保持不变，旁路 `github-incidental-bug-capture`。

如果用户要求真实执行测试或写测试代码，本 Runtime 只负责准备/完善方案和下游 Agent Goal，不声称当前容器具备完整执行环境。

# 十一、强制检查

- [ ] 已识别 Plan Type；
- [ ] 已读 `AGENTS.md`（存在时）；
- [ ] 已检查 Spec Gate 与权威来源状态；
- [ ] 业务计划已检查 Alignment 与 Expected 来源；
- [ ] 技术计划已检查 Risk/Layer/Harness/Reset/Evidence；
- [ ] Combined Plan 已检查交叉追踪；
- [ ] 未实现能力没有误算测试遗漏；
- [ ] 已确认 Bug 已旁路留痕；
- [ ] 审计结论没有冒充真实测试结果；
- [ ] 没有写测试代码或产品代码。
