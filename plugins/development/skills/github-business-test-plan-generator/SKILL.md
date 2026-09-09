---
name: github-business-test-plan-generator
description: "用于把已经确认或需要先与用户校准的一轮业务范围，整理成可交给下游 Test Agent 执行的业务测试方案。用户明确请求业务测试方案/业务用例时由本 Skill 先承接并执行 Spec Gate；若进入 ready_for_spec，再转入 github-spec 或按用户明确选择记录跳过。随后回显 Business Understanding，与用户或已确认结论对齐 Expected Business Contract，再建立 Feature/状态维度/跨对象不变量/Gherkin/业务 Evidence。适合‘给我业务测试方案/业务用例/按用户流程怎么测/这个功能有哪些业务场景’。不负责选择 Unit/Integration/E2E、设计 Harness/故障注入或编写测试代码；这些进入技术测试方案。"
phase: planning
optional_uses: "development/github-incidental-bug-capture"
---

# GitHub Business Test Plan Generator / 业务测试方案生成器

公共质量合同：`../../shared/testing-core/test-plan-quality-contract.md`。

## Skill Composition

读取源码/日志/测试时确认独立生产 Bug → 组合 `development/github-incidental-bug-capture`；证据不足 mismatch、未实现能力、合同未决、测试/Harness 问题按真实类别记录。

## 唯一目标

回答“**业务应该怎么工作、用户怎么验收**”，把已确认业务范围转成 Feature、状态维度、跨对象不变量、Scenario/Gherkin 和业务 Evidence。技术测试层级、Harness、故障注入和自动化维护交技术测试方案。

## 前置 Gate

1. 用户明确要业务测试方案/业务用例；已有方案只需审计时转 `github-test-plan-audit`；核心产品决定仍未确认时先回讨论。
2. **Spec Gate 与权威输入（强制）**：
   - `required` + 有有效【结论】 → 记录 `spec_source` 后继续；
   - `required` + 无结论 → `ready_for_spec`，不创建最终业务测试方案；
   - `not_required` → 记录 `spec_not_required` 与具体理由；
   - `undetermined` → 返回调研/讨论；
   - 用户明确跳过 required 结论 → 记录 `spec_skipped_by_user` 与风险，未决关键合同仍阻塞。
3. **Business Alignment**：Spec Gate 负责“合同是否冻结”，Alignment 负责“AI 是否理解正确”，两者分别执行。没有可靠已确认来源且业务预期存在歧义时，先回显理解并取得确认。
4. 必须区分 Expected Business Contract 与 Current Implementation；`pending_alignment` 时可给 `DRAFT / UNCONFIRMED`，不能创建最终方案 Issue。

## 工作流

Gate 通过后读取 `references/business-plan-contract.md`：Business Understanding Card → Alignment 状态 → Expected/Current 分离 → Feature Catalog → State Matrix → Cross-object Invariants → Scenario/Gherkin → Business Evidence Contract → Technical Test Handoff。

主体完成后，需要 GitHub 持久化或下游 Test Agent Goal 时读取 `references/delivery-and-goal.md`。

## 真实性边界

业务方案定义预期和验收，不声称真实环境测试已执行；用户未确认的业务规则不能写成已确定合同。
