# Linux 用户级 systemd 操作手册

## 前置诊断

当前宿主需要 Linux、Node.js 18+、`systemctl` / `loginctl` / `journalctl`、正常可访问的 systemd 用户管理器。以**目标普通用户**身份操作，不使用 `sudo node` 或 `sudo systemctl --user`。

在源码仓库根目录示例：

```bash
CLI=plugins/tools/shared/scripts/systemd-user.mjs
node "$CLI" --help
node "$CLI" doctor
node "$CLI" linger status
node "$CLI" list
```

安装到 Claude / Codex 的 Plugin 之后，`CLI` 要替换为已安装 tools Plugin 的实际 `shared/scripts/systemd-user.mjs` 路径。CLI 返回 JSON，调用者以 `ok`、`status` 和真实命令执行结果判断是否完成。

## 创建一个用户后台服务

**默认从对话开始**：收到新建用户级服务的自然语言请求时，Agent 先按 [`guided-creation.md`](guided-creation.md) 只问缺少的信息、预览并获用户确认，再自行调用下述原 CLI。用户无需手动拼接 `--exec`、`--arg` 等参数。以下命令是供 Agent 执行及用户明确需要命令行调用时使用的参考。

使用绝对可执行程序路径和明确的 argv，`--arg` 可重复。CLI 对 unit 内容做安全引用，不通过 shell 拼接命令行。

```bash
node "$CLI" create myapp \
  --exec /usr/bin/node \
  --arg /home/example/apps/myapp/server.js \
  --cwd /home/example/apps/myapp \
  --description "My app" \
  --restart on-failure
```

命令写入 `~/.config/systemd/user/myapp.service`（权限 0600），然后执行 `systemctl --user daemon-reload`。不自动启动和启用；默认 `Type=simple`、`Restart=on-failure`、`RestartSec=5s`、`WantedBy=default.target`。也支持 `--restart no|always`。

可选 `--env-file /home/example/apps/myapp/app.env`，必须已存在、为当前用户拥有的普通文件且权限不超过 0600。CLI 不创建、修改或输出环境变量值。不要把密码写进 `--arg`、`--description` 或命令日志；systemd 的环境变量亦有可见性风险，机密优先使用宿主的专门凭据机制。

## 启停、自启与诊断

```bash
node "$CLI" status myapp
node "$CLI" start myapp
node "$CLI" restart myapp
node "$CLI" stop myapp
node "$CLI" enable myapp
node "$CLI" enable myapp --now
node "$CLI" disable myapp
node "$CLI" disable myapp --now
node "$CLI" logs myapp --lines 100
```

`enable` 配置在用户管理器启动时启动服务；`--now` 同时立即执行启动或停止。若系统已启用 `linger=yes`，用户管理器可能在登录前开机运行，不能承诺「只在登录后才启动」。`status` 返回 systemctl `LoadState/ActiveState/UnitFileState/MainPID/FragmentPath/Result` 等真实字段，`logs` 读取当前用户的 journal，最多 500 行。

若目标为**服务器启动后无需用户登录就自动运行**：

```bash
node "$CLI" linger status
node "$CLI" linger enable --confirm yes
node "$CLI" doctor
node "$CLI" enable myapp --now
```

`linger enable` 要求用户明确同意且受本机授权策略限制；无授权返回 `permission_required` 和建议管理员执行的命令。真实自启需核实 `linger=yes`、`UnitFileState=enabled` 与重启后的实际状态；未做重启测试不能宣称重启后已验证。

## 修改和移除（只处理本 CLI 创建的 service）

更新是**完整替换运行参数**，不继承旧 `--arg/--cwd/--env-file`。更新已启动服务后需按用户授权另行重启：

```bash
node "$CLI" update myapp --exec /usr/bin/node --arg /home/example/apps/myapp/new-server.js --confirm yes
node "$CLI" status myapp
node "$CLI" restart myapp
```

删除需先停止且禁用；仅本工具标记的普通文件可以删除，系统已安装或手工编写的同名 unit 不会被覆盖或删除：

```bash
node "$CLI" disable myapp --now
node "$CLI" remove myapp --confirm yes
```

拒绝批量通配符、路径穿越与 systemd `@` 模板。已有其他用户级 service 允许在用户明确授权时用 `status/start/stop/restart/enable/disable/logs` 管理，但其 unit 文件不能通过本工具的 `update/remove` 修改。

## 结果判读

- `created/updated/removed`：本地文件操作及 daemon-reload 已成功；`updated` 仍需人工决定是否重启。
- `enabled_now`：enable/start 命令完成；还需读 `linger` 才能判断无登录自启前提。
- `already_exists/not_managed/service_busy`：未覆盖或删除现有配置，先核对实际 unit。
- `user_manager_unavailable`：用户 systemd/DBus 无法访问，停止服务写操作，检查用户会话与 linger。
- `partial_change`：unit 文件已变化但 daemon-reload 失败，需核实文件和管理器状态，不能当作原样未修改。
- `permission_required`：当前用户无法启用 linger，管理员授权前停止。

CLI 不使用 shell、`sudo` 或未知二进制安装；远程执行中由 Agent 操作真实 Linux 机器前必须确认该机器属于用户授权范围。
