# 用户磁盘报告/缓存清理 CLI

## 使用前提

当前 Linux 普通用户运行 Node.js 18.15+（使用 `fs.statfs`）；清理 `npm-cache` 还需宿主安装 npm CLI。全部操作不依赖 sudo、Docker 或数据库。CLI 位置：已安装的 `tools` 插件 `shared/scripts/linux-disk-cleanup.mjs`。本仓库根目录示例：

```bash
CLI=plugins/tools/shared/scripts/linux-disk-cleanup.mjs
node "$CLI" --help
node "$CLI" doctor
node "$CLI" report
```

- `doctor` 只检查当前运行身份、用户 home 是否安全以及固定 scope 清单。
- `report` 只读查看 home 所在文件系统空间和 home 顶层目录前 25 个逻辑字节热点；默认扫描至多 20,000 项，`truncated=true` 时数值仅为已访问部分的下限，不具备全量准确性；不会读文件正文、删除数据或调用 shell。
- 这个报告不是 `du`/`ncdu` 的完整替代，也不会自动覆盖整个服务器所有磁盘分区。容器卷、系统日志、用户数据库等只能据实提出诊断结果，当前无自动删除。

## 固定支持的清理范围

| `--scope` | 唯一允许删除的路径 | 说明 |
| --- | --- | --- |
| `user-cache` | `~/.cache` | 当前用户的 XDG 常见缓存目录（不自动跟随 `XDG_CACHE_HOME` 指向其它位置） |
| `npm-cache` | `~/.npm/_cacache` | 只读扫描全目录，经用户本地终端确认后由 `npm cache verify` 原生维护，**不能按文件年龄清理** |
| `npm-logs` | `~/.npm/_logs` | npm 历史日志 |

这些目录必须属于当前运行 UID，根目录及中间目录不能是软链接、不能被其他用户写入，也不能跨挂载点。**user-cache / npm-logs** 才会挑选当前 UID 拥有、最后修改超过阈值、单链接的普通文件，保守跳过项目标记、数据库、私密环境文件和密钥。**npm-cache 不选择单个旧文件**：扫描所有 `_cacache` 项的安全元数据，发现不安全项就拒绝将目录交给 npm，授权后调用 npm 自己的 `verify`。无法承诺 npm 本身会回收哪些文件。不会删除任意目录、修改项目源码、自动关闭进程或提升权限。

## 先扫描再清理

```bash
node "$CLI" scan --scope user-cache --older-than 30
node "$CLI" scan --scope npm-logs --older-than 30
node "$CLI" scan --scope npm-cache
# 普通缓存返回 eligible_count、estimated_bytes、sample、plan；
# npm-cache 返回 strategy=npm_cache_verify、inspected_count、inspected_bytes、plan，
# eligible_count / estimated_bytes 均为 null。
```

`scan` 完全只读，最大扫描 50,000 项，超出上限时**停止并拒绝产生可执行计划**；无目录返回 `missing_target`。普通缓存的预计释放量按候选文件逻辑字节求和，可能与实际磁盘回收量不同；**npm-cache 只报扫描规模，无法估算回收量，也不支持 `--older-than`**。

只有用户通过对话审阅清单，并决定执行，才把对应命令交给用户在**目标 Linux 的本地交互终端亲自运行**：

```bash
node "$CLI" clean --scope user-cache --older-than 30 \
  --plan <scan-json-plan-sha256>

# npm _cacache 只能用 npm 原生完整性维护：
node "$CLI" clean --scope npm-cache --plan <npm-scan-plan-sha256>
```

`clean` **拒绝 `--confirm yes`**。只有检测到真实控制终端 `/dev/tty` 且 stdin/stderr 均为 TTY 时才显示当前路径、计划、范围，要求用户手动键入 `DELETE <scope> <plan 前12位>`。无终端返回 `approval_required`，短语不一致返回 `approval_denied`。执行前及用户输入后分别重新校验清单。普通缓存执行逐项 `lstat`、`O_NOFOLLOW` 身份复核后 `unlink`；npm-cache 只能运行 `npm cache verify --cache ~/.npm --offline --ignore-scripts`，由 npm 自行清理冗余/损坏内容，返回 `maintenance_completed`，无法提前知道回收数量。不要在 Agent 工具中伪造 TTY 或代输入；若没有可信的本地终端，保持只读。

**信任边界**：这个 TTY 门禁阻止 headless Agent 直接清理，但与 Agent 共享 UID 和 shell 权限的终端输入并不能证明是真人；真正无法由 Agent 伪造的审批需要独立宿主授权服务或不同安全主体。当前没有这种额外审批基础设施，因此不可声称具备密码学级人工授权。

## 安全告警与结果

- `clean` **不可逆**，不使用回收站；缓存可能仍被活跃软件使用。普通缓存默认 30 天阈值不代表文件一定安全；npm 官方 `verify` 按自身缓存一致性规则回收，不遵守文件年龄要求，必须明确区分后再确认。
- 普通缓存的 `estimated_bytes` 是逻辑字节数；npm-cache 的 `estimated_bytes=null`，表示执行 npm 原生维护前无法预测回收量。真实释放空间受压缩、稀疏文件、未关闭句柄等影响；需复测时重新执行 `report`。
- CLI 只防护常见符号链接替换与元数据竞态，Node 的路径 `unlink` 不是原子性的 `unlinkat(dirfd)`，存在同 UID 恶意并发修改目录时的局限；必要时停止运行中的写入应用，或手工选择更严格的现场处理。
- `scan_limit` 表示扫描不完整，不能作为可执行计划；`unsafe_directory` 表示缓存目录不可信，不能绕过；`stale_plan` 表示预览后变化，必须重新确认；`approval_required`/`approval_denied` 表示没有可靠的本机终端输入，未删除；`partial_change` 表示普通缓存已有部分删除；`maintenance_failed` 表示 npm 原生命令失败，可能已经改变缓存内部状态，需核对后再决定。
- 该 CLI 不支持 `/tmp`、`/var/log`、Docker、数据库、回收站、项目源码或任意自定义 `--path`。需要这些能力应另行明确范围，当前版本禁止直接用 `rm -rf` 旁路保护。
