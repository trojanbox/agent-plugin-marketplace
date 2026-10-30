# Linux Ops CLI 合同

## 运行前提与数据位置

Linux 普通用户、Node.js **20.12+**、`/bin/bash`。可执行文件在已安装 tools 插件的 `shared/scripts/linux-ops.mjs`，无运行时 npm 第三方依赖。示例：

```bash
CLI=/path/to/tools/shared/scripts/linux-ops.mjs
node "$CLI" --help
node "$CLI" init
node "$CLI" doctor
```

默认用户运行根 `~/.linux-ops`，和邮箱、OneDrive 的 `~/.agent-plugin-marketplace` 无关。可通过命令行 `--root /absolute/path` 或 `LINUX_OPS_HOME` 指定唯一根；CLI 参数优先。根目录和 `bin/` 均 0700，`.env` 0600，脚本 0700。拒绝 root、软/硬链接、不安全权限，不自动修宽权限，也不覆盖已存在文件；`init` 可重复调用。

## 配置维护：元信息输出，不回显值

```bash
node "$CLI" config list
node "$CLI" config list --prefix DEV_DB_
node "$CLI" config check --keys DEV_DB_HOST,DEV_DB_USER,DEV_DB_PASSWORD
node "$CLI" config set DEV_DB_PASSWORD       # 用户本地终端隐藏输入
node "$CLI" config set DEV_DB_HOST --stdin  # 值从可信本地管道读取，不放 argv
node "$CLI" config unset DEV_DB_OLD_KEY
node "$CLI" config import --from /home/example/private-config.env
node "$CLI" config import --from /home/example/private-config.env --replace
```

`list` 仅输出键名/空值键；`check` 输出存在/缺失状态，不返回原值；缺必需项时 CLI 返回退出码 2。`set` 无 `--stdin` 时需用户本机终端，输入不回显；Agent 不得为获取真实密码要求用户在聊天发送。`--stdin` 供可信本地程序/用户管道使用，普通脚本执行没有这项输入门禁。

`import` 只读取用户明确选择的本人 0600 单链接文件，先完整解析，再原子合并；有同名键时默认拒绝，明确 `--replace` 才覆盖。同名检查只显示键名，不泄露值。已有注释/无关配置保留；修改/新增的条目规范化为双引号形式。`unset` 不存在的键返回 unchanged。

共享 dotenv 采用单行 `KEY=value` / 可选 `export` / 单引号 / JSON兼容双引号转义；`#` 注释、空值、包含等号的 URL 均支持。不会 `source`、变量插值或执行 `$(...)`。重复键、无效格式、NUL、文件超过128KiB会停止。带换行的私钥应在单行双引号里编码转义，不接受原始跨行文本。

写操作通过独占 `.lock` + 临时文件原子替换完成。锁忙返回 `busy`，不重试、不自动删别人的锁；异常退出的遗留锁须由用户确认进程已终止后处理。数据文件不是数据库或加密存储，也不会上传到远端。

## 持久化脚本管理

```bash
node "$CLI" scripts list
node "$CLI" scripts show dev-db.sh
node "$CLI" scripts put dev-db.sh --from /tmp/dev-db.sh
node "$CLI" scripts put app-logs.sh --stdin < /tmp/app-logs.sh
node "$CLI" scripts put dev-db.sh --from /tmp/updated-dev-db.sh --replace
node "$CLI" scripts remove obsolete.sh
```

文件名只能为字母开头的 ASCII 字母/数字/点/横线/下划线，不允许目录穿越；脚本须含 shebang、无NUL、大小不超过1MiB。CLI 复制到 `<root>/bin/NAME` 并设为0700，支持 Bash/Python/Node 等解释器；真实解释器要在目标主机可用。Bash 在保存时仅做语法检查，**保存不会执行**。同名文件必须显式 `--replace`；删除只作用于选中的单个安全脚本，普通目录和链接不删除。

脚本头前40行可写：

```bash
#!/usr/bin/env bash
# linux-ops: prefixes=DEV_DB_,LOG_
# linux-ops: requires=DEV_DB_HOST,DEV_DB_PASSWORD
# linux-ops: project-env=off
```

前两项分别声明默认前缀、必需变量；第三项可选 `auto/off`。CLI 显式 `--prefix` 替代头部默认前缀；`--require` 与脚本头部必需键合并。不需要每个脚本的独立注册表/数据库白名单。

## 像 Bash 一样执行

```bash
# -- 后必须是一个完整命令字符串，单引号避免调用者提前展开变量。
node "$CLI" exec --prefix DEV_DB_ -- 'printf "%s\n" "$DEV_DB_HOST" | head -1'
node "$CLI" exec --cwd /home/example/app --prefix DEV_DB_ --mode development -- 'pnpm dev'
node "$CLI" exec --prefix DEV_DB_ --prefix LOG_ --require DEV_DB_HOST -- 'python3 inspect.py'
node "$CLI" exec --timeout 30 -- 'some-long-command > result.txt 2> error.txt'

# 持久化脚本读取头部前缀；--后的参数保持原样，不拼接进shell字符串。
node "$CLI" run dev-db.sh -- 'query argument containing spaces'
node "$CLI" run app-logs.sh -- my-app.service today
```

`exec` 使用 `/bin/bash --noprofile --norc -c`，支持变量展开、管道、重定向、复合命令及替换；不强加 `set -e` / `pipefail`（用户可自行写进命令/脚本）。`run` 按保存文件的 shebang 执行，参数数组保持原样，其 Bash 脚本仍有完整 Shell 能力。不存在固定数据库引擎/SQL白名单。

stdout、stderr、stdin **直接继承**，不设 `maxBuffer`，不截断、不脱敏、不加 JSON 输出包裹，退出码直接传回。宿主 UI/执行工具可能有自己的显示上限，需要保留大日志时可利用普通重定向。无默认超时，适合 `pnpm dev`；显式 `--timeout` 到期停止并返回124。SIGINT/SIGTERM/SIGHUP 转发子进程；无TTY调用使用独立进程组将取消传到后代，交互式TTY保留前台行为。

管理命令返回 JSON。执行器准备失败时错误 JSON 写到 stderr、返回1；命令不存在/解释器缺失返回127或126；进程因信号结束返回128+信号号。执行成功不等于业务数据库/日志内容正确，按实际输出判断。
