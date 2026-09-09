---
name: github-technical-test-plan-generator
description: "用于为已有需求、缺陷、实施计划或业务测试范围设计可交给下游 Test/Coding Agent 执行的技术测试方案。用户明确请求技术测试方案/自动化回归设计时由本 Skill 先承接并执行 Spec Gate；若进入 ready_for_spec，再转入 github-spec 或按用户明确选择记录跳过。随后重点回答‘技术上怎么测’：测试层级、现有测试复用、Harness/Environment、Fixture/Reset、Contract/E2E、故障注入、并发/恢复、Evidence、Fresh Run 与自动化维护。适合‘给我技术测试方案/自动化回归怎么做/哪些测试要迁移/怎么构建稳定可回测环境/这个改动要测哪些层’。不负责定义业务应该怎么工作，不编写测试代码，也不在当前容器声称真实测试已通过。"
phase: planning
optional_uses: "development/github-incidental-bug-capture"
---

# GitHub Technical Test Plan Generator / 技术测试方案生成器

公共质量合同：`../../shared/testing-core/test-plan-quality-contract.md`。

## Skill Composition

读取源码/测试/日志时确认独立生产 Bug → 组合 `development/github-incidental-bug-capture`；测试/Harness/环境问题按真实类别记录，不自动报生产 Bug。

## 唯一目标

回答“**技术上如何稳定、可重复地证明这些行为**”，设计测试层级、资产复用、Harness/Fixture/Reset、故障恢复、Evidence/Fresh Run 与自动化边界。业务应该怎么工作由业务测试方案负责。

## 前置 Gate

1. 用户明确要技术测试/自动化/回归/可回测环境；已有计划仅需审计时转 `github-test-plan-audit`。
2. **Spec Gate 与权威输入（强制）**：
   - `required` + 有有效【结论】 → 记录 `spec_source` 后继续；
   - `required` + 无结论 → `ready_for_spec`，不创建最终技术测试方案；
   - `not_required` → 记录 `spec_not_required` 与具体理由；
   - `undetermined` → 返回调研/讨论，不能把源码现状/测试断言当目标合同；
   - 用户明确跳过 required 结论 → 记录 `spec_skipped_by_user` 与风险，未决关键合同仍阻塞。
   测试任务本身不会自动要求 Spec，判断依据仍是合同传播范围。
3. **启动输入**：测试范围、当前源码/结构证据、适用 `AGENTS.md`、目标合同来源、现有测试与入口；若写 GitHub，还要确认目标仓库。
4. 目标业务合同不足时输出可设计部分与 `CONTRACT_CONFLICT / DECISION_REQUIRED`，不能从当前实现反推 Expected Behavior。

## 工作流

Gate 通过后读取 `references/technical-plan-contract.md`，依次建立：Test Target/Risk Map → 现有测试资产 → 最低充分测试层 → Harness/Environment/Fixture/Reset → Resilience Profile → 执行批次 → Evidence/Fresh Run/Flake Policy → 与业务测试方案的交接。

主体完成后，只有需要 GitHub 持久化或下游 Agent Goal 时再读取 `references/delivery-and-goal.md`。

## 真实性边界

本 Skill 设计方案，不编写测试代码，也不把未运行测试写成通过；方案中命令必须来自真实项目或明确标为待下游确认。
