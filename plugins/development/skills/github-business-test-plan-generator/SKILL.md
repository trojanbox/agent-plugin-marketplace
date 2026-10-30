---
name: github-business-test-plan-generator
description: "用于把已确认业务范围转成可交给 Test Agent 的业务测试方案、业务用例和 Gherkin，定义业务应该如何验收。先执行 Spec Gate 与业务理解对齐，再建立场景、状态和不变量；测试层级/环境设计归技术测试方案。核对真实交付是否已满足产品需求归 product/product-acceptance；仅设计用例时不声称真实验收通过。"
phase: planning
optional_uses: "github/github-issue-manager,development/github-incidental-bug-capture"
---

# GitHub Business Test Plan Generator / 业务测试方案生成器

公共质量合同：`../../shared/testing-core/test-plan-quality-contract.md`。

## 产品阶段边界

本 Skill 定义业务测试方案、场景和证据要求；对指定交付版本做真实结果核对归 `product/product-acceptance`。产品验收不会改变本 Skill 的 Spec Gate、Business Alignment 或下游技术测试所有权。

## Skill Composition

- 需要 GitHub 持久化时组合 `github/github-issue-manager`，使用其查重、写入恢复与 handoff 协议；本 Skill 保留研发内容与阶段 Gate，不复制通用远端操作。

读取源码/日志/测试时确认独立生产 Bug → 组合 `development/github-incidental-bug-capture`；证据不足 mismatch、未实现能力、合同未决、测试/Harness 问题按真实类别记录。

## 唯一目标

回答“**业务应该怎么工作、用户怎么验收**”，把已确认业务范围转成 Feature、状态维度、跨对象不变量、Scenario/Gherkin 和业务 Evidence。技术测试层级、Harness、故障注入和自动化维护交技术测试方案。

## 前置 Gate

1. 用户明确要业务测试方案/业务用例；已有方案只需审计时转 `github-test-plan-audit`；核心产品决定仍未确认时先回讨论。
2. **Spec Gate 与权威输入（强制）**：
   - `required` + 有有效【开发·结论】 → 记录 `spec_source` 后继续；
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
