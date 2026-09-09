---
name: github-development-plan-generator
description: "用于把已经明确或需要先经过前置 Gate 的需求、结论或缺陷永久解决方向转换成可直接交给小模型/Coding Agent 的 GitHub 开发计划。用户明确请求开发/实施计划时由本 Skill 先承接并执行 Spec Gate；若进入 ready_for_spec，再转入 github-spec 或按用户明确选择记录跳过。默认采用 small-model-strict：以当前源码建立来源索引、传播图、文件结构、契约和自包含 Task DAG，冻结 Read Before Edit、Entry Preconditions、Allowed/Forbidden、Write Set、Stop Conditions、Expected Diff Shape、逐 symbol Implementation Steps、Behavior Cases、验证义务与验收。该 Skill 只负责规划，不修改源码或运行完整真实测试。"
phase: planning
optional_uses: "development/github-incidental-bug-capture"
---

# GitHub Development Plan Generator / 开发计划生成器

## 唯一目标

把**已经明确的目标**转换成一套可直接交给小模型/Coding Agent 执行、审计和验收的 GitHub 实施计划。计划必须基于当前源码，提前消除实现歧义，并把每个可测试代码 Task 写成明确的 **TDD 执行合同：Red → Green → Refactor → Regression**。

计划只负责规划，不修改生产代码；计划完整也不等于代码或测试已经完成。

共享规则：`../../shared/github-core/references/collaboration-policy.md`、`../../shared/github-core/references/plan-authoring.md`；GitHub 不可写时使用 handoff protocol。

## Skill Composition

- 规划期间发现独立生产缺陷，可按现有条件组合 `development/github-incidental-bug-capture`；主任务仍是实施计划。
- 已有业务测试方案时，把当前 Task 直接相关的业务场景/不变量写回 Task；不能只留链接。
- 已有技术测试方案时，把当前 Task 直接相关的 Risk/Case/Evidence 写回 Task；**技术测试方案不能替代 Task 内 TDD、Behavior Cases 或 focused regression**。
- 没有独立业务/技术测试方案时，实施计划仍必须完整可执行；不要为了形式自动创建额外测试 Issue。

## 前置 Gate

1. **目标成熟度**：重大产品/架构决定未确认 → 返回讨论；当前实现事实不足 → 先调研/API/缺陷调查。
2. **Spec Gate**：
   - 有当前有效【结论】 → 记录 `spec_source` 并继续；
   - 上游明确 `spec_not_required` + 理由 → 可继续；
   - `ready_for_spec` 且无结论 → 不静默跳过，先进入 Spec 或由用户明确记录 `spec_skipped_by_user`；
   - 无法判断是否需要 Spec → 返回调研/讨论。
3. **最低输入**：目标/非目标、当前源码/工作区、已确认上游来源、适用 `AGENTS.md`；GitHub 持久化时确认目标仓库。

证据不足时只输出证据支持的部分和阻塞项，不能用占位符伪装完整计划。

## 不可妥协的计划边界

- 当前源码、测试、配置和适用 `AGENTS.md` 是实现事实源；历史 Issue/文档只补背景。
- 每个 Task 一条自包含派工评论；小模型只读该 Task、`Read Before Edit` 和当前源码即可开始，不依赖规划者脑内上下文。
- 跨 Task Contract 在消费者 Task 中展开签名、Schema、Invariant、错误语义和兼容要求。
- Bug 计划解决根因；功能计划冻结最终合同。禁止吞错、无依据 retry、隐藏状态或“后面再补”。
- 正常路径只有 GitHub 主 Issue + 规划评论 + Task 评论；不生成 `plan.json`、本地计划镜像或实施状态 JSON。
- 用户没有在当前规划请求中明确要求 Patch 时，计划不为了 Patch 人为新增 Task 或验收步骤。

## TDD Gate（强制）

所有能够通过自动测试表达目标行为的生产代码 Task，默认 `TDD: REQUIRED`：

```text
Red      → 先写/修改最小测试并真实运行，确认因目标能力缺失而失败
Green    → 做根因级最小完整实现，使该 Red 变 Green
Refactor → 在测试保护下整理，不扩大已冻结范围
Regression → 跑当前 Task 的 focused regression 和必要合同验证
```

- 环境错误、命令不存在、依赖缺失不能冒充 Red。
- 新测试若直接 Green，必须先判断功能是否已存在或测试是否没有命中目标；不能直接进入实现。
- 纯文案、纯静态资源、无法形成有意义行为 Red 的 Task 才允许 `TDD: N/A`，并写清证据和替代验证。

详细字段读取 `references/task-contract.md`。

## 计划流程

1. Gate 通过后读取 `references/plan-construction.md`：建立源码快照、Source/Fact、搜索覆盖、传播图、持久化/架构边界、File Structure、Contract Catalog 与 Task DAG。
2. 按 `small-model-strict` 拆 Task；每个 Task 的自包含合同、TDD、Behavior Cases 和验证精度读取 `references/task-contract.md`。
3. 真实依赖决定 DAG；共享合同先于消费者，冲突写集/资源串行。
4. 复杂跨 Task 测试架构、Harness/Fixture/故障注入/Fresh Run 如确有独立价值，可衔接技术测试方案；普通改动不把它当强制前置产物。
5. 主体完成后读取 `references/delivery-and-audit.md`：专项风险、完整性审计、GitHub 发布和下游 Coding Agent Goal。

## 真实性边界

- 文件、symbol、命令和测试入口必须来自真实仓库证据；
- 未实际运行的测试命令只能写成下游义务，不得声称已通过；
- 规划阶段不写生产代码或测试代码；
- GitHub 写入只有工具真实成功后才能声明完成。
