# 文件化 GitHub 交接协议

> 以下 `../../shared/github-core/...` 相对路径以当前 `plugins/development/skills/<skill>/` Skill 目录为基准。

## 何时启用

GitHub 读取或写入能力不足时，先按 `github-remote-write-recovery.md` 完成能力恢复 Gate。`gh: not found`、PATH 缺失、Shell 转义错误、复杂命令被执行宿主拒绝，都不能直接触发 handoff。

只有恢复 Gate 已确认当前会话确实没有可用远端读/写路径时，才继续完成分析与内容整理，并生成 `github-handoff/<bundle-id>/`。本地文件只表示待同步意图。用户明确要求不要生成 handoff 时，不创建交接包，只报告真实阻塞原因和已经准备好的内容。

## 标准流程

```bash
CORE=../../shared/github-core/scripts/github_workflow.py
python3 "$CORE" handoff init --bundle-id <id> --repo owner/repository
python3 "$CORE" handoff add --bundle github-handoff/<id> --kind triage --title "查重：..." --body-file triage-body.md
python3 "$CORE" handoff add --bundle github-handoff/<id> --kind issue --id BUG-001 --title "【缺陷】P1 ..." --body-file issue-body.md
python3 "$CORE" handoff add --bundle github-handoff/<id> --kind comment --parent BUG-001 --title "缺陷调查补充" --body-file comment-body.md
python3 "$CORE" handoff validate --bundle github-handoff/<id> --strict
```

创建或编辑正文后运行 `refresh-hashes`，交付前必须运行严格校验。

## 权威数据

- `manifest.json` 是文件、顺序、依赖和状态的权威索引；
- Markdown 保存面向人的完整内容；
- `handoff_id` 和 HTML 注释是幂等键；
- `relations.md` 只保存本地关系，远端编号出现后再替换引用；
- `sync-log.md` 只记录 GitHub 工具确认成功的结果。

## 状态

`dedupe_status`：`pending`、`unique`、`duplicate_open`、`duplicate_closed`、`not_required`。

`sync_status`：`blocked_by_triage`、`pending_sync`、`synced`、`partially_synced`、`conflict`、`skipped`、`failed`。

未完成查重的 Issue 必须使用 `dedupe_status: pending` 与 `sync_status: blocked_by_triage`。

## 同步顺序

1. 校验 bundle；
2. 对 pending Issue 查重；
3. 创建、复用或重开 Issue；
4. 更新正文和标签；
5. 按依赖顺序同步评论；
6. 执行生命周期操作；
7. 建立关系；
8. 回写 manifest 和同步日志。

使用 `handoff next-actions` 获取机械顺序；远端写入前仍需执行语义和权限判断。

## 冲突

以下情况停止对应条目：仓库不一致、远端内容在草稿后发生实质变化、关闭/重开依据不足、敏感信息渠道不合适、关系循环、同一本地 ID 映射多个 Issue。不得静默覆盖。
