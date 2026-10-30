# 从任务到持久化脚本

## 1. 了解任务并复用已有能力

用户说「帮我写个查开发数据库的脚本，以后还要用」「查这个服务最近的日志」「用共享环境运行 pnpm dev」时进入本 Skill。根据已有上下文确定目标主机、工作目录、任务和变量前缀；不重复问已知问题。先用 `doctor`、`scripts list` 和必要的 `scripts show NAME` 发现现有脚本，避免反复生成重复文件。

只查询一次的 Shell 命令可以直接 `exec -- '...'`；可重复使用的任务应保存到 `bin/` 再 `run`。不要求每次调用都重新授权。用户仅要求方案时不能提前写文件或访问数据库。

## 2. 初始化和缺配置引导

默认根目录独立于插件安装/旧邮箱配置：

```text
~/.linux-ops/
├── .env                  # 0600；唯一共享默认配置
└── bin/                  # 0700；持续积累的脚本
    ├── dev-db.sh
    └── app-logs.sh
```

没有初始化时，在当前任务允许创建配置后执行 `init`，不会覆盖已有配置。通过 `config list --prefix DEV_DB_` 或 `config check --keys DEV_DB_HOST,DEV_DB_USER` 获取变量名和缺项。缺少密钥时，给用户本机 `config set DEV_DB_PASSWORD` 的命令并提示隐藏输入；不要在聊天请求密码，不 `cat .env`，不把私有文件提交/上传。也可内部导入用户明确指定的 0600 私有文件，不默认覆盖已有键。

## 3. 写脚本、标注依赖并保存

脚本源代码由 Agent 生成，保存在临时工作文件后通过 `scripts put NAME --from ABS` 复制到 `bin/`，或直接用 `--stdin` 保存代码。源代码只包含环境变量名称，不包含密码/Token。CLI 不执行保存的脚本；Bash 脚本先通过 `bash -n` 语法检查。

脚本头前三行示例：

```bash
#!/usr/bin/env bash
# linux-ops: prefixes=DEV_DB_
# linux-ops: requires=DEV_DB_HOST,DEV_DB_USER,DEV_DB_NAME,DEV_DB_PASSWORD
# linux-ops: project-env=off
set -euo pipefail

# 最小示例：本机 psql 已由用户安装；没有写入或固定业务表结构假设。
export PGHOST="$DEV_DB_HOST"
export PGPORT="${DEV_DB_PORT:-5432}"
export PGUSER="$DEV_DB_USER"
export PGDATABASE="$DEV_DB_NAME"
export PGPASSWORD="$DEV_DB_PASSWORD"
exec psql -X -w --set=ON_ERROR_STOP=1 --command='SELECT current_database(), current_user;'
```

`project-env=off` 适用于直接读取进程环境、不自己加载项目 dotenv 的独立运维脚本。已有父进程环境仍然优先；共享 `.env` 仅补缺。对 `pnpm dev` 等自己加载 dotenv 的命令使用默认 auto，详见项目环境文档。

日志脚本可以接收服务名/日期参数，使用 `journalctl` 或项目实际日志文件路径。先查真实现场命令/路径，不虚构业务表或固定日志位置。对用户指定的 SQL 搜索、过滤条件，正确处理参数/引用，避免将参数拼接成不受控 SQL 或 shell。

## 4. 更新与执行

先 `scripts show NAME` 确认脚本，再基于本轮修改任务使用 `scripts put NAME --replace` 更新。同名脚本默认不覆盖，不擅自删除已有用户脚本。

```bash
node "$CLI" scripts put dev-db.sh --from /tmp/dev-db.sh
node "$CLI" run dev-db.sh
node "$CLI" run app-logs.sh -- my-app.service '2026-10-30 00:00:00'
node "$CLI" exec --cwd /home/example/app --prefix DEV_DB_ --mode development -- 'pnpm dev'
```

执行器注入前缀匹配的变量、保留已有进程环境、处理项目键避让，再启动命令。工作目录默认当前目录；脚本位于独立 `bin/` 不意味着自动切换到 `bin/`。执行输出不被摘要或脱敏，退出码与取消信号按普通 Shell 处理。不能因为出现错误就在后台无限重试，尤其是可能重复写入的 SQL/文件操作。

## 5. 长期复用与边界

后续类似任务优先调用同一脚本并传参；增加功能时改已有脚本，不复制出很多版本。可以新增其它运维脚本，但不要扩展成后台调度/复杂审计系统。systemd 生命周期与磁盘删除分别由现有专用 Skill 负责；不通过本工具绕过它们的授权约束。

Agent 自己写出的脚本能看到被注入的密钥，不能做 `printenv`、`env`、`set -x`、回显密码或将数据发送到无关地址。完整日志无法保证不包含第三方程序输出的敏感信息，这是已知风险，不隐藏也不偷偷改成日志摘要。
