---
name: git-branch-patch-bundle-export
description: 当用户要求分析 Git 目标分支的分叉基线，并导出 origin.zip 与 content.patch 时使用；直接接收 AgentDock 可访问的仓库 URL 或路径，由 AgentDock 完成 Git、验证、打包和发布。
phase: delivery
version: 1.2.0
---

# Git Branch Patch Bundle Export

## 目标

为目标分支生成一个可复现 Bundle：

```text
<repo>-<target-branch>.zip
├── <repo>-origin.zip   # merge-base 的完整仓库树
└── content.patch       # merge-base → target tip 的完整 binary-safe diff
```

## 输入与边界

需要提供 AgentDock 可直接访问的目标仓库和目标分支；可选显式基线分支。当前会话负责确认输入和交付结果，Git clone/fetch/merge-base/diff/验证/打包在 AgentDock 环境执行。

`repo` 必须是可直接使用的 HTTPS / SSH / Git URL、`file://` URL 或 AgentDock 可访问的绝对路径。本 Skill 不负责仓库别名映射，也不读取固定 mapping 文件。

本 Skill 只用于用户明确要求分支基线 + `origin.zip` + `content.patch` 的交付，不替代普通源码调研或单一 Patch 生成。

## 执行流程

1. 从用户输入取得 **AgentDock 可访问的真实仓库地址**，不猜远程 URL。
2. 将 repo/target/base（若有）传给 AgentDock。
3. AgentDock 侧按 `references/agentdock-procedure.md` 确定 merge-base、导出基线树、生成 binary-safe patch，并验证 patch 能重建目标状态。
4. 清理临时 clone/worktree 后发布最终 ZIP。
5. 当前会话确认交付文件真实存在，再提供下载链接和基线/tip 摘要。

## 完成条件

- `origin.zip` 对应实际选定 merge-base；
- `content.patch` 覆盖该基线到目标 tip 的完整变化；
- Patch/重建验证真实成功；
- 最终 ZIP 可读取且包含两项产物；
- 未成功的 AgentDock/Git/验证操作不能写成已完成。
