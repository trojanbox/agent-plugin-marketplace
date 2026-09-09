---
name: github-issue-triage
description: "用于把‘查重/是否复发/复用还是新建/是否该重开’本身作为当前主要目标时，搜索目标仓库开放和已关闭 Issue，比较根因、症状和历史解决状态并给出决策。若用户已经明确要求创建/重开等写操作，主路由由 github-issue-manager 承接，本 Skill 作为写前 Triage Gate；无法读取 GitHub 时生成标准化查重交接条目。"
phase: operations
---

# GitHub Issue Triage

系统消息和当前用户消息始终优先。共享证据与范围规则见 `../../shared/github-core/references/collaboration-policy.md`。

## 目标

在执行类 Issue 创建操作前完成查重，避免重复记录、错误重开和历史割裂。

## 路由所有权

- 用户当前只要求“查一下有没有重复 / 这个问题是不是复发 / 应该补充、重开还是新建”，尚未要求执行写操作：本 Skill 是主 Skill。
- 用户已经明确要求“创建 Issue / 重开 Issue / 根据查重结果直接完成写操作”，且上游内容/领域判断已经完成：`github-issue-manager` 是主 Skill，本 Skill 作为其强制 Triage Gate；不能因为 Gate 尚未完成就把两个 Skill 并列成主候选。
- 如果“创建 Issue”只是 Bug 调查、讨论、结论、计划或测试方案等领域工作流的持久化步骤，仍由对应领域 Skill 主导；本 Skill 只在其查重阶段提供决策，不把纯副作用提升为新的主目标。
- 用户明确说“先查重，我看结果后再决定要不要创建”时，本轮只执行 Triage，后续用户决定写入再进入 Manager。

`【讨论】` Issue 使用 `github-discussion-facilitator` 的 Discussion Continuity Check：判断“是否同一轮尚未结束的决策过程”，不套用 Bug/Feature 的同根因去重语义。

## 能力分流

先确认目标仓库与 GitHub Issues 读取能力。

- 有读取能力：搜索开放和已关闭 Issue；
- 只有写入能力：仍禁止创建，因为无法查重；
- 无读取能力：生成本地 triage 条目，相关 Issue 保持 `dedupe_status: pending`、`sync_status: blocked_by_triage`；
- 不得把“本地材料没有重复项”表述成“GitHub 没有重复 Issue”。

文件化协议见 `../../shared/github-core/references/handoff-protocol.md`。使用共享 CLI 生成和校验文件，不手写 manifest：

```bash
CORE=../../shared/github-core/scripts/github_workflow.py
python3 "$CORE" handoff add --bundle <bundle> --kind triage \
  --title "查重：<主题>" --body-file <triage-body.md>
```

## 输入

至少需要：

- 目标仓库；
- 症状、影响和关键技术词；
- 已确认的模块、文件、接口、错误文本或调用链；
- 希望执行的动作，例如记录、补证或确认复发。

没有目标仓库时，只能整理查重指纹，不能声称完成仓库查重。

## 查重流程

### 1. 提取多组指纹

组合使用：

- 用户可见症状；
- 稳定错误文本、错误码；
- 模块、文件、接口、路由、类型；
- 已确认根因或根因假设；
- 版本、环境和触发条件；
- 历史标题可能使用的同义词。

避免只用完整标题搜索。

### 2. 搜索开放 Issue

先精确后放宽。记录查询、候选编号、状态、标签和相关证据。

### 3. 搜索已关闭 Issue

重点检查：历史修复是否覆盖同一根因、当前是否复发、关闭原因是否仍成立、是否曾被标为重复或 `not_planned`。

### 4. 比较候选

比较以下维度：

- 根因是否相同；
- 触发条件和受影响路径是否重合；
- 修复边界是否一致；
- 历史验收是否覆盖当前情况；
- 当前材料是否只是新证据或新版本复发。

症状相似不等于同一问题；标题不同也不等于不同根因。

## 决策

- **复用开放 Issue**：同一根因且范围仍有效，追加新证据；
- **补充开放 Issue**：主题一致，但需扩充复现、影响或验收；
- **重开已关闭 Issue**：同一根因复发，且历史关闭理由已不成立；
- **新建并关联历史项**：根因或交付边界不同；
- **新建**：没有足够相似候选；
- **暂缓**：证据不足，不能可靠判断。

重开前必须证明同一根因。不能仅凭相似症状重开。

## 输出

```markdown
## 查重结论
- 决策：复用 / 补充 / 重开 / 新建 / 暂缓
- 目标 Issue：#<number> / 本地 <handoff_id>

## 依据
- 查询：
- 候选比较：
- 根因判断：
- 历史状态判断：

## 下一步
- 建议操作：
- 仍缺证据：
```

未获得 GitHub 搜索结果时，清楚标注“待远端查重”。
