---
name: git-shallow-zip-export
description: 当用户要求把任意 Git 仓库的指定分支浅克隆、移除 Git 历史、打成 ZIP、校验并通过 AgentDock 插件发布下载时使用；直接接收 AgentDock 可访问的仓库 URL 或仓库路径，不依赖仓库映射文件。
phase: delivery
version: 1.3.0
---

# Git Shallow ZIP Export

通过 **当前 ChatGPT 容器 + AgentDock 插件**把指定仓库分支导出为不含 `.git` 的 ZIP。当前会话负责收集输入和交付结果，AgentDock 负责 Git、打包、校验和发布。

## 适用范围

适用于只需要某个远端分支当前快照的场景：

- 单分支浅克隆：`--depth 1 --single-branch`；
- 删除 `.git` 后打包；
- 校验 ZIP CRC、条目数、SHA-256 和 `.git` 排除情况；
- 发布 ZIP Artifact；
- 每次运行前清理本 Skill 超过 1 天的临时产物。

不用于完整历史备份、镜像仓库、推送、修改远端、自动初始化子模块或保证 Git LFS 指针已展开。

## 输入

| 字段 | 必填 | 默认值 | 说明 |
|---|---:|---|---|
| `repo` | 是 | — | AgentDock 可直接访问的 Git URL、`file://` URL 或本地仓库绝对路径 |
| `branch` | 是 | — | 要导出的分支 |
| `archive_name` | 否 | `<repo>-<branch>.zip` | 输出文件名 |
| `overwrite` | 否 | `false` | 是否覆盖同名临时 ZIP |
| `temp_root` | 否 | AgentDock 的系统临时目录 | Skill 专属临时根目录的父目录 |

仓库地址、分支和输出名称全部来自运行时输入，不得写死。拒绝 URL 内嵌用户名、密码或 Token。

## 环境边界

当前 ChatGPT 容器与 AgentDock 是独立文件系统。传入 `repo` 前必须保证该地址在 **AgentDock 环境可访问**：

- HTTPS / SSH / Git URL 可以直接传入；
- `file://` 或绝对路径只能指向 AgentDock 本机真实可访问的位置；
- 当前 ChatGPT 容器里的本地路径不能因为“当前会话能看到”就假定 AgentDock 也能看到。

本 Skill 不负责仓库别名到真实地址的映射，也不读取任何固定 mapping 文件。

## AgentDock 插件流程

1. 从用户输入取得 AgentDock 可访问的 `repo` 与 `branch`。
2. 调用 `server_info` 确认 AgentDock 主机路径模型；本地仓库路径场景必须确认路径真实可访问。
3. 读取包内 `scripts/export_snapshot.py`，通过 `file_edit` 写入 AgentDock 临时 runner 目录。
4. 调用 `exec_command` 执行临时脚本，直接传入 `repo`、`branch` 和可选输出参数。
5. 脚本在 AgentDock 内完成仓库来源校验、浅克隆、删除 `.git`、ZIP、校验和中间目录清理。
6. 调用 `file_publish` 发布 `archive_path`。
7. 返回分支、提交 SHA、大小、条目数、SHA-256、清理数量和下载链接。

## 脚本调用

脚本从 stdin 读取 JSON：

```json
{
  "skill_action": "export",
  "repo": "https://gitlab.example.com/group/vcp.git",
  "branch": "dev",
  "archive_name": "vcp-dev.zip"
}
```

支持动作：

- `status`：检查 Git、临时目录并执行过期清理；
- `resolve`：验证并规范化直接传入的仓库地址；
- `export`：完成浅克隆、ZIP 和校验。

## 临时文件清理

每次脚本启动都会清理专属目录：

```text
<TMPDIR>/git-shallow-zip-export/
```

只删除该目录下修改时间超过 1 天的运行目录和导出文件，不扫描、不删除其他临时目录。当前运行文件和刚生成 ZIP 不会被清理。已发布的 AgentDock Artifact 不受本地临时清理影响。

## 安全与校验

- 分支名不得以 `-` 开头，也不得包含换行或 NUL；
- ZIP 文件名只能是普通文件名，不能路径逃逸；
- 默认不覆盖已有 ZIP；
- 中间目录使用随机名称并在结束时清理；
- ZIP 必须只有一个项目顶层目录；
- ZIP 任何路径段都不能等于 `.git`；
- CRC 检查、SHA-256 和 `.git` 检查全部通过后才能发布；
- 错误输出不得包含凭据。

## 完成标准

- `repo` 在实际执行环境可访问；
- 指定分支完成深度为 1 的单分支克隆；
- `.git` 已删除；
- ZIP 完整性和 SHA-256 已验证；
- 本次中间目录已清理；
- 超过 1 天的 Skill 专属临时产物已在本次启动时清理；
- ZIP 通过 AgentDock `file_publish` 提供下载。
