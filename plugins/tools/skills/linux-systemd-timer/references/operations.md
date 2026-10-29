# Linux 用户级 systemd Timer CLI

## 前置条件与边界

需要 Node.js 18+、Linux 用户 systemd 管理器、`systemctl`、`journalctl`、`systemd-analyze`；所有管理操作仅针对当前普通用户。程序入口位于已安装 tools Plugin 的 `shared/scripts/systemd-timer.mjs`，在本仓库根目录可写：

```bash
CLI=plugins/tools/shared/scripts/systemd-timer.mjs
node "$CLI" --help
node "$CLI" doctor
node "$CLI" calendar '*-*-* 03:00:00'
```

`calendar` 使用**目标机器**的 `systemd-analyze calendar --iterations=3` 验证表达式并返回系统输出的接下来触发时间，**只读**。系统本地时区由宿主决定，不能把 ChatGPT 的时区默认为服务器时区；需要特定时区时先检查当前 systemd 是否支持指定表达式。`calendar` 在没有运行中用户管理器时仍可能执行，但创建始终需要管理器可用。

## 创建一个定时任务

人类用户直接描述「每天晚上 11 点跑这个脚本」即可，Agent 必须先按 `guided-creation.md` 逐项核对、预览、最终确认，然后自行调用命令。下列写法是**Agent 操作示例**，可执行文件/脚本目录需要替换成目标服务器已验证的真实路径：

```bash
node "$CLI" create nightly-backup \
  --exec /usr/bin/python3 \
  --arg /home/example/scripts/backup.py \
  --cwd /home/example/scripts \
  --calendar '*-*-* 23:00:00' \
  --description 'Nightly backup' \
  --persistent no \
  --accuracy 1min
```

生成：

- `~/.config/systemd/user/nightly-backup.service`：`Type=oneshot`，每次触发运行一次脚本；不含 service 自启 `[Install]`。
- `~/.config/systemd/user/nightly-backup.timer`：`OnCalendar=*-*-* 23:00:00`、`Persistent=no`、`AccuracySec=1min`、`Unit=nightly-backup.service`、`WantedBy=timers.target`。

`create` 只创建文件 + `systemctl --user daemon-reload`，**不会 start/enable/立即执行脚本**。`Persistent=no`（默认不补跑 timer 停用期间错过的定时事件）；`yes` 可能在 timer 恢复/激活时立即补运行一次。`AccuracySec` 可选 `1s/1min/5min`，默认 1 分钟；受系统调度影响，无法承诺精确到秒。`--arg` 可重复；`--env-file` 只支持当前用户拥有、权限不高于 0600 的现有文件。

## 管理、查询与显式立即执行

```bash
node "$CLI" list
node "$CLI" status nightly-backup
node "$CLI" logs nightly-backup --lines 100
node "$CLI" start nightly-backup                  # 激活 timer，不直接执行 service
node "$CLI" stop nightly-backup                   # 停止未来调度，不会中断正在运行的 service
node "$CLI" enable nightly-backup                 # 随用户管理器启动 timer
node "$CLI" enable nightly-backup --now           # 同时启动 timer，可能触发 Persistent 补跑
node "$CLI" disable nightly-backup --now
node "$CLI" run-now nightly-backup --confirm yes   # 明确要求立即运行一次
```

`status` 报告管理器返回的 `timer_state`、`service_state`、`NextElapseUSecRealtime`、`LastTriggerUSec` 和 `linger`。`list` 列出当前用户可见的 timer unit files，**不限于本工具创建的 Timer**，但任何修改操作只接受本工具标记创建的成对 unit。`logs` 读取配套 `NAME.service` 最近 1..500 行记录。`run-now` 可能执行有副作用的脚本，需要用户单独授权；成功请求仍需结合日志与 `Result` 判断程序实际效果。

## 修改计划、移除

```bash
node "$CLI" update nightly-backup \
  --calendar 'Mon..Fri *-*-* 06:30:00' --persistent no --confirm yes

# update 仅修改 .timer 的 OnCalendar/Persistent/AccuracySec；
# 未指定的计划字段保留，.service 启动命令不被修改。
node "$CLI" restart nightly-backup

node "$CLI" disable nightly-backup --now
# 确认配套 service 没有在运行后：
node "$CLI" remove nightly-backup --confirm yes
```

`update` 仅维护计划字段，若 timer 活跃，更新完成后需要用户单独确认是否 `restart` 才能确保新触发规则生效；启用 `Persistent=yes` 的重启可能立即补跑。`remove` 要求 timer 已停止、禁用且 service 已不在运行；只删除当前工具标记文件，持久化 `Persistent=yes` 的 timestamp 会在删除前通过 `systemctl --user clean --what=state` 清理，失败时停止删除，避免后续同名任务使用旧补跑状态。修改命令/工作目录等配套 service 内容尚未提供直接更新功能，出现此需求须清楚指出并停止自动修改。

## 无登录运行与错误处理

默认随用户管理器工作；如需服务器重启后**没有登录会话仍然定时运行**，要先由用户明确授权，再复用 `systemd-user.mjs linger status` / `linger enable --confirm yes`。本 Timer CLI 不调用 sudo、不自动设置 linger。`linger=yes` 是无人登录运行的前提之一；必须由真实主机重启/触发记录验证实际行为。

关键状态：`invalid_calendar`（真实 parser 拒绝规则）、`already_exists`（同名 timer 或 service，拒绝覆盖）、`not_managed`（非本工具文件）、`timer_busy`（删除前必须停用）、`partial_change`（文件已经变化但后续失败）、`user_manager_unavailable`（当前用户 systemd/DBus 不可访问）。出现错误需核对真实状态并报告，不盲目自动重试。
