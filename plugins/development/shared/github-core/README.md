# GitHub Workflow Core

本目录由多个 GitHub Skill 共享，不作为独立 Skill 激活。

## 设计边界

共享脚本只负责可确定、可验证、容易重复出错的机械操作：handoff 目录与模板、ID、哈希、同步状态、归档安全、Git 工作区快照和 Patch 检查。

开发计划本身直接写入 GitHub `【实施计划】` 主 Issue 与评论；不通过本地计划 JSON、Markdown 渲染文件、评论 manifest 或实施状态 JSON 驱动。Development Runtime 不维护下游 Coding/Test Agent 的实施状态；仅 `source-patch-implementation` 可在 S 级 Patch Fast Lane 内直接实施局部源码修改。

Skill 负责语义判断：问题边界、严重级别、查重结论、根因、架构、风险、Task 拆分、依赖/Wave、Contract、测试与验收，以及安全信息应进入何种渠道。

跨 Skill 的证据优先、决策门、防需求扩散、外部系统所有权、图表继承、完整审查和复杂度自适应规则统一见 `references/collaboration-policy.md`。专项 Skill 可以更严格，但不得绕过该公共规则。

## 运行要求

- Python 3.10+
- Git（仅 Git 工作区/Patch 相关命令需要）

## CLI

```bash
python3 scripts/github_workflow.py --help
```

主要命令：

```text
handoff init | add | validate | refresh-hashes | next-actions | record-sync
archive extract
workspace snapshot
patch inspect | check | export
```

所有命令仅操作本地 handoff、归档或 Git 工作区，不会直接访问 GitHub。

## 开发计划约定

- 正常路径的唯一计划载体是 GitHub 主 Issue + 评论；
- 每个 Task 一条自包含派工评论；
- 跨 Task Contract 在消费者 Task 中完整展开；
- 不创建 `DEVELOPMENT-PLAN.md`、计划 JSON、评论 manifest 或 `.issues/todos/...json`。

GitHub 写操作异常时先执行 `references/github-remote-write-recovery.md`；只有恢复 Gate 确认远端写能力确实不足后才进入 handoff。该交接包属于能力降级产物，不是正常计划事实源。
