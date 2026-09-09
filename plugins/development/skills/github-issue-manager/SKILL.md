---
name: github-issue-manager
description: "用于当 GitHub Issue 生命周期写操作本身是主要目标、且待写内容/上游决定已经明确时执行创建、更新正文、评论、标签、指派、关闭或重开，并核对真实返回。明确创建/重开由本 Skill 承接并把 github-issue-triage 作为写前 Gate；若 Bug 调查、讨论、结论、计划、测试方案等领域工作仍是主任务，Issue 写入只是其持久化副作用，本 Skill 不抢主路由。"
phase: operations
optional_uses: "development/github-issue-triage"
---

# GitHub Issue Manager

## 目标

安全执行已经明确的 GitHub Issue 生命周期操作，并准确报告真实结果。

## Skill Composition / Issue Write Gate

- 用户明确请求**创建新执行类 Issue**或**重开可能复发的 Issue**，且 Issue 内容/根因报告/上游决定已经准备好、当前主要工作只剩生命周期写操作时，本 Skill 拥有主路由；先按需加载 `development/github-issue-triage` 完成查重/复发判断，得到允许动作后再继续写入。
- Triage 是写前 Gate，不因为尚未完成就与本 Skill 形成主 Skill 冲突。
- 用户只要查重或“判断应该新建还是重开”，没有要求执行写操作时，直接以 `github-issue-triage` 为主。
- 对用户已明确指定的现有 Issue 做评论、正文更新、标签、指派或明确关闭，不加载 Triage。
- 如果用户当前还要求“结合源码调查 Bug / 正式开始讨论 / 生成结论 / 生成实施或测试方案 / 审核方案”等领域产物，即使同一句里写了“并创建 Issue”，仍由对应领域 Skill 主导；Issue 写入属于该领域工作流的持久化步骤。
- 专门的交接同步任务继续由 `development/github-issue-handoff-sync` 主导，本 Skill 不因最终会产生 GitHub 写操作而接管。

## 前置条件

所有写操作都必须具备：

- 明确且匹配项目配置的目标仓库；
- 明确目标 Issue 或待创建内容；
- 用户授权当前动作；
- 对应 GitHub 工具和权限。

### 必须先 Triage

以下动作必须先有 `github-issue-triage` 结论：

- 创建新的执行类 Issue；
- 判断当前问题是否已有记录；
- 关闭 Issue 复发后是否应重开；
- 同根因开放/关闭 Issue 之间选择补充、重开或新建。

### 不重复 Triage

用户已经明确指定现有 Issue（例如 `#123`），并明确要求：

- 追加评论；
- 更新正文；
- 添加/删除已有标签；
- 指派；
- 对已知状态执行明确关闭动作；

可以在读取并确认目标仓库/Issue 后直接执行，不为了流程形式重新搜索整个仓库。

讨论类 Issue 仍遵守项目规则：同一轮未结束讨论继续原 Issue；开始新一轮讨论不使用执行类 Issue 的根因查重逻辑。

GitHub 写操作异常时先按 `../../shared/github-core/references/github-remote-write-recovery.md` 区分 CLI/PATH、Shell/宿主、认证与远端拒绝，并执行有限恢复。只有恢复 Gate 确认写能力确实不足时，才继续整理内容并按 handoff 协议生成交接包；用户明确禁止 handoff 时不得生成。任何未获远端成功结果的动作都不得声称已完成。

## 项目边界

- 每次调用显式指定目标仓库；
- 不跨仓库猜测；
- 不擅自创建标签、里程碑、项目或分支；
- 不推送代码、不合并 PR；
- 敏感安全问题进入受限渠道。

## 语义保真

本 Skill 只执行上游已确认写操作，不在写入阶段补做产品/架构决定、扩大范围或改写结论。

## 操作规则

### 创建

只有需要查重的 Issue 已得到“新建”结论后创建。创建后核对编号、URL、标题和仓库。

### 更新正文

先读取当前内容，区分追加、局部修订和整体替换。远端内容在草稿后发生实质变化时停止并报告冲突。

### 评论

评论必须有新增信息。相同 `handoff_id` 或幂等标记已存在时不重复追加。

### 标签

只操作仓库真实存在且语义明确的标签。不存在时如实报告，不用近似标签替代。

### 指派 / 里程碑 / 截止日期

仅在用户明确指定且工具支持时执行，不能从姓名猜测账号。

### 重开

必须有 triage 证据说明同一根因/同一交付仍未解决或复发，并补充新证据。

### 关闭

已知 Issue 的明确关闭请求可直接核对验收/关闭理由后执行，不需要额外全仓查重。不能把“停止计划/迁移任务”伪装成已完成。

## 远端写入恢复与文件化操作

写操作异常先使用 `../../shared/github-core/references/github-remote-write-recovery.md`。确认远端写能力确实不足后，才使用 `../../shared/github-core/references/handoff-protocol.md` 与共享 CLI。需要新 Issue 而尚未完成 triage 时保持 `blocked_by_triage`；对已知现有 Issue 的评论/操作则以目标 Issue 作为依赖。

## 错误处理

以下情况停止对应操作：仓库不匹配、权限不足、Issue 不存在、状态冲突、敏感信息渠道不合适、工具失败或返回不完整。

彼此独立且安全的其它条目可以继续，但必须逐项报告。

## 最终回复

至少说明目标仓库、真实完成的创建/更新/评论/标签/生命周期操作、未完成项与原因，以及哪些内容仅生成本地 handoff。
