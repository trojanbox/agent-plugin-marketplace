---
name: linux-ops
description: "Linux 运维脚本工具箱：按需求编写并保存 bin 脚本，复用数据库查询/日志排查脚本或执行完整 Bash。独立 .env 按前缀注入、项目环境优先、完整输出，普通执行不重复授权。提供配置和脚本 CLI；不迁移邮件/OneDrive凭据。服务/定时器生命周期走 systemd Skill，磁盘删除走磁盘清理。"
phase: operations
---

# Linux Ops / 可复用 Linux 运维脚本

## 唯一目标与入口

根据用户的 Linux 操作任务**寻找或编写脚本、保存、复用并执行**，包括开发数据库查询、日志检查和日常维护。统一 CLI 相当于带默认环境的 Bash，不能退化成几个固定数据库探针。

- 逻辑 ID：`tools/linux-ops`。CLI：`node <已安装 tools Plugin>/shared/scripts/linux-ops.mjs`；源码仓库中为 `node plugins/tools/shared/scripts/linux-ops.mjs --help`。
- Linux 普通用户、Node.js 20.12+、Bash。默认独立数据根 **`~/.linux-ops/`**：一份私有 `.env`，同级 `bin/` 保存用户脚本。`--root ABS` 或 `LINUX_OPS_HOME` 可改位置；不写 Skill 安装目录，不与 QQ 邮件/OneDrive 共享配置，也不迁移它们。
- 普通命令、脚本执行继承本轮任务授权，不增加 TTY 挑战或逐次确认。涉及破坏性变更仍遵循用户授权范围，不因有 Shell 就扩大任务。

## 按需读取与工作流

1. 新建/修改/复用运维脚本时，先读 **`references/workflow.md`**：优先 `scripts list/show` 复用，必要时编写带 shebang 的脚本，`scripts put` 保存到 `bin/`；脚本需要的前缀/必需变量可写在头部元数据，后续 `run NAME -- args` 直接复用。
2. 初始化、配置写入、脚本管理或实际执行时读 **`references/cli.md`**。`config list/check` 仅返回键名/缺项；`config set` 默认用户本机隐藏输入，也支持可信本地 stdin；`import` 内部读取用户明确选择的私有文件。**Agent 不直接读取 `.env`、不获取或打印原值、不把秘密硬编码进脚本。**
3. 涉及项目 `.env` / `pnpm dev` / Vite / Next.js / 多环境模式时，必读 **`references/project-environment.md`**：已有进程环境优先；项目声明的同名键不预注入共享值，让项目原生加载器取得自己的值。指定正确 `--cwd`、`--mode` 或 `--project-env FILE`；不把“已注入后再加载文件”误当成项目优先。
4. 执行/输出/权限问题读 **`references/security-and-results.md`**。执行器支持完整 Shell、管道/重定向，**原样转发 stdin、stdout、stderr 与退出状态**，不摘要、不脱敏、不加 JSON 输出壳；无默认超时。需要时显式 `--timeout`；取消信号会传给子进程。

## 核心行为与停止边界

- **按前缀**从共享 `.env` 选变量；`exec` 显式 `--prefix`，`run` 可从脚本头 `# linux-ops: prefixes=DEV_DB_` 取得默认前缀。未指定前缀不注入共享变量，避免泄露整份配置。已继承的同名变量（含空值）不被覆盖。
- 共享 env 缺少脚本必需键时，先引导用户通过 CLI 补齐再执行；不猜密码。项目声明的键由项目原生加载器处理。**不会自行加载 dotenv 的独立脚本应写 `# linux-ops: project-env=off`**，继续使用共享补缺与已继承环境。
- 脚本落盘后默认不执行；`scripts put` 遇到已有脚本会拒绝，只有本次明确要更新才 `--replace`。不用数据库引擎白名单，不在生成脚本时自动连接真实服务。
- 完整 Shell 与完整日志意味着脚本能打印或发送其环境变量。文件私有权限和 Agent 不主动读取只是行为/权限约束，**不提供同 UID 硬隔离或“原始日志绝不泄密”的保证**；不要生成 `env`、`printenv`、`set -x` 等泄露密钥的诊断。
- 现有 systemd Service/Timer 的创建、启停与自启走对应 Skill；磁盘缓存删除走 `linux-disk-cleanup` 的已有保护；业务源码根因调查仍保留研发 Skill 主路由。此 Skill 可作为必要的脚本/环境执行辅助，不抢占其他独立主目标。
