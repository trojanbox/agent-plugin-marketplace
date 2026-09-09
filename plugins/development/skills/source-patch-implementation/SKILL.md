---
name: source-patch-implementation
description: "用于对用户提供的当前源码执行 S 级局部代码修改并交付可回放 `.patch`。适合根因/目标行为已经确认后用户说‘那直接 patch’‘小问题直接改’‘给我补丁’；必须先通过 Patch Fast Lane Gate：低传播、无高影响未决策、无数据迁移/外部合同/复杂状态并发/跨服务职责变化。Gate 不满足时不得因用户点名 `.patch` 强行实施，应回到缺陷调查、讨论、Spec 或开发计划。"
phase: implementation
---

# Source Patch Implementation / 小修复 Patch 快车道

## 唯一目标

对**已经确认、低传播、风险可控的 S 级修改**直接实施源码变更，完成可执行的局部验证，并交付可审计、可回放的 `.patch`。

本 Skill 是 Development Runtime 唯一受控的生产代码实施快车道；它不承接 M/L 级实现，不替代讨论、Spec、实施计划或完整 Coding Agent 工作流。

## 一、Patch Fast Lane Gate（强制）

只有以下条件全部成立才进入实施：

1. 当前源码/日志/复现证据足以确认根因，或用户要求的目标行为已经明确；
2. 修改属于 `S`：局部、低传播，责任边界和预期 Diff 范围清楚；
3. 不存在 `DECISION_REQUIRED` 的产品/架构/用户体验选择；
4. 不改变模块/服务职责、状态所有权或同步/异步边界；
5. 不涉及数据模型、迁移、持久化语义；
6. 不改变对外 API / RPC / event / schema / error contract；
7. 不涉及复杂状态机、并发、幂等、生命周期或高风险安全权限语义；
8. 当前材料足以定位真实编辑点，且验证边界可以明确说明。

任一条件不成立：**停止 Fast Lane**。根因未明回 `github-bug-investigation`；存在高影响未决策进入 `github-discussion-facilitator`；需要冻结高传播合同进入 `github-spec`；M/L 且目标已明确进入 `github-development-plan-generator`。

用户说“直接 patch”只表达期望交付物，不会豁免本 Gate。

## 二、事实源与范围

- 以用户当前上传/提供源码为事实基线，不从未知镜像替代当前源码；
- 访问项目时读取根目录及适用子目录 `AGENTS.md`；
- 修改前建立最小证据链：`症状/目标 → 根因/合同 → 编辑点 → 受影响消费者 → 验证点`；
- 只修改解决当前根因所必需的文件；发现额外问题按真实类型报告，不顺手扩需求；
- 必要的局部回归测试可以随 Patch 一起修改，但不得借机设计新 Harness、重构完整测试体系或扩大成技术测试方案。

## 三、Workspace 与 Patch

用户提供 ZIP/TAR 或无 Git 历史源码时，读取并遵循 `../../shared/github-core/references/workspace-patch-protocol.md`：

1. 安全解压到隔离工作区；
2. 记录源码归档哈希/文件树；
3. 无 `.git` 时建立 `synthetic_local_baseline`，仅用于可审计 diff；
4. 在隔离副本修改源码；
5. 导出 binary-safe Git Patch；
6. 运行 Patch inspect、apply check，并在同基线临时副本回放。

不能把 synthetic baseline 说成远端真实 branch/HEAD。

## 四、实施约束

- 修根因，不用吞错、固定延时、无依据重试、硬编码、关闭校验或旁路数据冒充永久修复；
- 保持现有代码风格、公开合同和非目标对象不变量；
- 发现修改传播范围超过 S，立即停止继续编辑，报告 Gate 变化并转入对应上游流程；
- 不因为已经改了一半就把 M/L 风险包装成“小修复”。

## 五、验证层级

至少真实完成：

1. `patch inspect`；
2. `patch check` / 同基线回放检查；
3. 当前环境能运行的最小相关 lint/typecheck/build/unit/integration 检查。

有现成复现或局部测试时，应验证原始失败场景。环境不具备行为验证条件时，可以交付 Patch，但必须明确区分：

- `patch_replay_verified`：补丁可回放；
- `targeted_checks_passed`：哪些局部检查真实通过；
- `behavior_not_verified`：哪些业务行为没有真实验证。

只通过 `git apply --check` 不能声称 Bug 已修复验证通过。

## 六、默认交付

至少包含：

- 根因/目标行为摘要；
- 复杂度：`S`，以及 Fast Lane 成立理由；
- 修改文件与关键 Diff；
- 实际执行的验证及结果；
- `delivery.patch`；
- 未验证项和剩余风险。

如果实施过程中 Gate 失效，不生成“半完成修复”作为正式交付；保留证据并说明应该进入的下一主 Skill。

## 七、多轮续接

- 上一轮已经确认根因 + `S`，当前用户说“那直接 patch” → 本 Skill；
- 上一轮仍是 hypothesis，当前说“直接 patch” → 继续缺陷调查；
- 上一轮确认 M/L，当前仍要求 patch → 继续完整流程，不降级为 S；
- Patch 已交付后用户说“创建 Bug Issue” → 当前主目标切到 `github-issue-manager`，必要时执行 Triage Gate。

## 八、强制检查

- [ ] 根因/目标行为已确认；
- [ ] Patch Fast Lane Gate 全部满足；
- [ ] 已读取当前源码与适用 `AGENTS.md`；
- [ ] 没有扩大需求或改变高影响合同；
- [ ] Patch 已 inspect、check、同基线回放；
- [ ] 可运行的局部检查已真实执行；
- [ ] 未真实验证的行为没有写成“已修复验证通过”；
- [ ] 交付 `.patch` 可供用户直接使用。
