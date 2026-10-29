---
name: linux-disk-cleanup
description: "Linux 普通用户磁盘诊断与安全缓存清理：只读查看占用、扫描 ~/.cache 和 npm 旧日志；npm _cacache 使用原生 npm cache verify 维护。计划确认后必须由用户在本机交互终端手输挑战短语，无TTY禁止清理。适合‘磁盘快满了’‘清 npm 缓存’。不清源码、数据库、Docker、系统目录；定时任务走 systemd Timer。"
phase: operations
---

# Linux Disk Cleanup / Tools Plugin

## 唯一目标

让 Agent 通过**自然语言对话**帮助当前 Linux 普通用户分析磁盘占用并安全清理明确选定的用户缓存，而不执行盲目批量删除。用户说「磁盘快满了」「帮我清理些缓存」「看看什么占空间」都走本 Skill；当前仅提供可验证的只读分析与有限缓存清理。

CLI 位于已安装 `tools` Plugin 的 `shared/scripts/linux-disk-cleanup.mjs`；源码根目录示例：`node plugins/tools/shared/scripts/linux-disk-cleanup.mjs --help`。原生 JSON 输出。**不再接受 `--confirm yes`**：有副作用的命令要求用户亲自在目标主机的交互终端输入计划绑定挑战短语；无 TTY 时失败关闭，Agent 不能代输。该门禁防止普通无人值守调用，但无法密码学证明同 UID 的终端输入属于真人。

## 必须遵循的工作流

1. **磁盘分析/任何清理意图均先按需读 `references/guided-cleanup.md`**：第一步只读 `doctor`、`report`，解释分区可用容量与家目录热点，已知环境信息不重复询问；每轮只问必需的关键问题。
2. 需要查看候选或执行时按需读 `references/operations.md`：普通缓存 `scan` 返回旧文件数量、估算字节与 SHA256 指纹；`npm-cache` 的 `scan` 只报告原生维护计划，**无法预知 npm 会回收哪些文件、多少空间，不适用年龄过滤**。
3. 若涉及 `clean`、旧数据、目录链接/权限、计划失效或异常恢复，**必须读 `references/security-and-results.md`**。即使用户说「全部清理」也只能在可控范围内先预览、逐项确认，不能跳过确认。
4. Agent 只能先运行只读 `doctor/report/scan`、展示计划并取得**明确用户确认**的意愿。清理时必须让用户在**目标主机本地交互终端**调用 `clean --scope ... --plan SHA256` 并按提示亲自输入挑战短语；**不能传入 `--confirm yes`、模拟审批或自动输入**。无 TTY 则停止；用户完成后再只读核实。

## 操作边界

- 支持当前普通 UID 的三个固定范围：`user-cache` → `~/.cache`、`npm-cache` → `~/.npm/_cacache`、`npm-logs` → `~/.npm/_logs`。**仅 `user-cache/npm-logs` 支持按修改时间清理，默认 30 天**；`npm-cache` 只能调用受校验的官方 `npm cache verify` 维护整份 npm 缓存，不按文件年龄直接删除内部索引或内容。普通缓存不删目录、软硬链接或跨文件系统文件，保守跳过项目与敏感文件。
- 不调用 sudo，不操作 root、其他用户文件、`/var/log`、`/tmp`、`/var/lib/docker`、源码仓库、Node 项目构建目录、数据库、容器卷、下载目录或回收站；这些**当前尚未实现自动清理**，看到相关空间问题只能如实报告与建议另行排查，不允许擅自扩展清理范围。
- `report`/`scan` 全程只读；`clean` 核对 SHA256 快照，执行前经过交互式挑战确认并**再次扫描确认计划未变**。普通缓存删除前逐项复核路径与文件身份；npm 原生维护前检查整个 `_cacache` 目录树的权限与链接安全。超限、路径变更或权限异常则停止。
- 缓存也可能仍被应用使用，删除不可恢复，需向用户说明影响和范围；逻辑字节不能直接等同于系统真正释放的磁盘空间。脚本执行完不代表缓存一定可恢复或程序不会重新下载。
- 只提供一次用户授权下的单一类别清理，不自行创建 systemd Timer、后台定时清理或定期巡检。用户需要真正周期性的清理时，另按 `tools/linux-systemd-timer` 范围及用户明确授权处理；不自动串联。
- 缺少原始用户同意、只有诊断意图、用户要求删除未知业务目录、或存在系统级提权要求时，停留在只读诊断，不允许通过 `rm -rf` / shell 旁路 CLI 安全门禁。
