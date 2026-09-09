---
name: github-issue-handoff-sync
description: "在当前模型具备目标 GitHub Issues 读写权限后使用。校验 github-handoff 目录，先查重，再按依赖顺序幂等创建、复用、补充、重开、评论、加标签和建立关联，并回写 manifest 与同步日志。"
phase: operations
---

# GitHub Issue Handoff Sync

系统消息和当前用户消息始终优先。共享证据、决策门 与范围规则见 `../../shared/github-core/references/collaboration-policy.md`。

## 目标

把 `github-handoff/<bundle-id>/` 中的本地意图安全、可追踪、幂等地同步到目标仓库。

## 必需能力

开始前确认：

- 目标仓库 Issue 读取能力；
- 目标仓库 Issue 写入能力；
- 交接目录全部文件的读取和回写能力。

任一缺失时不开始部分同步。

## 共享协议与预检

完整协议见 `../../shared/github-core/references/handoff-protocol.md`。

```bash
CORE=../../shared/github-core/scripts/github_workflow.py
python3 "$CORE" handoff validate --bundle <bundle> --strict
python3 "$CORE" handoff next-actions --bundle <bundle>
```

校验失败时先修复本地结构。不要绕过 manifest 直接扫描并写入。

## 输入核对

确认：

- manifest 的目标仓库与系统配置一致；
- `bundle_id`、`handoff_id` 唯一；
- 文件、父子关系、依赖和哈希可解析；
- 没有敏感信息；
- 一个独立问题没有被多个草稿重复定义；
- 远端操作意图明确。

## 同步语义保真

同步只把本地已确认意图映射到远端，不在同步阶段重新设计、补决定或扩大 Scope。交接包中存在 `DECISION_REQUIRED` 或上游冲突时，相关条目保持阻塞；不得为了完成同步自行选择方案。

## 同步工作流

### 1. 查重

所有 `dedupe_status: pending` 的 Issue 先执行 `github-issue-triage`。根据证据选择：复用开放、补充、重开、新建或跳过。`intended_operation: create` 不能覆盖查重结论。

### 2. 建立本地到远端映射

将 `BUG-001`、`PLAN-001` 等稳定 ID 映射到真实 Issue 编号。正文和评论中的本地引用在写入前替换为实际 `#<number>`，同时保留 HTML 幂等标记。

### 3. 同步正文与标签

创建、复用或重开后，再更新标题、正文和标签。远端内容有实质冲突时停止对应条目。

### 4. 同步评论

评论必须等待父 Issue 和所有依赖完成。搜索相同 `handoff_id` 标记，避免重复评论。

### 5. 执行操作与关系

关闭、重开、指派等操作最后执行。关系工具不可用时，使用双向 Issue 引用，不能声称建立了原生关系。

### 6. 回写

每次成功后立即更新 manifest：

```bash
python3 "$CORE" handoff record-sync --bundle <bundle> --id <ID> \
  --dedupe-status <status> --sync-status synced \
  --remote-issue-number <number> --remote-url <url> --batch S-001
```

随后在 `sync-log.md` 追加工具确认的动作、时间、冲突和未同步项。修改 Markdown 后运行 `refresh-hashes` 和严格校验。

## 幂等依据

同步前同时检查：

- Markdown 中的 `<!-- handoff-id: ... -->`；
- manifest 的远端映射；
- `sync-log.md`；
- 远端相同标记；
- 标题、根因和评论内容。

发现已同步时只修复映射或补齐缺失字段，不重复创建和评论。

## 冲突

以下情况停止对应条目：

- 仓库不一致；
- 远端在草稿生成后发生实质修改；
- 关闭、重开或替换正文依据不足；
- 标签或安全渠道不可用；
- 依赖循环；
- 同一本地 ID 映射多个远端 Issue；
- 工具返回结果无法确认。

不要为了完成同步而静默覆盖或降低安全边界。

## 状态收敛

完成批次后，根据条目状态更新 bundle：

- 全部成功：`synced`；
- 部分成功：`partially_synced`；
- 存在需人工决策冲突：`conflict`；
- 工具或权限失败：`failed`。

## 最终回复

```markdown
## 同步结果
- Bundle：
- 目标仓库：
- 新建 / 复用 / 重开 / 补充：
- 评论：
- 生命周期操作与关系：
- 冲突和失败：
- 更新后的 manifest / sync-log：

## 真实性边界
- GitHub 工具已确认：
- 仍是本地意图：
```
