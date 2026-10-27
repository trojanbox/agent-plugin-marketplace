# v9 可复制工程模板

## 归档身份与来源

- 目录：`assets/fullstack-monorepo-template-v9/`（相对于本 Skill 根目录）
- 来源：用户提供的 `fullstack-monorepo-template-v9.zip`，按原始源码目录解压保存
- 原始 ZIP SHA-256：`67395e3620987edff4e203a282bc9e3edbd6a04edff0e14af06491675448d43d`
- 文件数：155（含 `pnpm-lock.yaml`、隐藏配置和测试源码）
- 相对路径与逐文件 SHA-256 清单按路径排序、每行 `path:sha256\n` 拼接的 SHA-256：`7ab1e1422a075c5cb384da6dcd3ba886840b88d380a30431bc37aa74f4e1de0c`
- 本目录是固定 v9 基线。由它生成项目时修改目标项目；需要更新模板基线时建立新版本目录并同步本 Skill 的默认版本，保留 v9 可追溯。

## 技术与事实优先级

v9 已有完整可运行工程的源码事实：Node 24、pnpm 10、React 19、TypeScript 6、Vite 8、React Router 7、NestJS 12、SQLite（`better-sqlite3`）/Drizzle、Zod、Session Cookie/CSRF、Vitest、Playwright、Turborepo。

生成新项目时，以模板的 `AGENTS.md`、`README.md`、`package.json`、各 app/package 源码、Migration 与测试为事实源；本 Skill 负责跨栈边界，两个组合 Skill 负责各自通用规范。独立后端 Skill 的 PostgreSQL 默认方案不覆盖 v9 的 SQLite 实现；若用户要求 PostgreSQL，需要明确迁移 Schema、Drizzle dialect、Repository、Session、测试数据库和 Migration，而不能只替换连接字符串。

## 从 v9 派生新项目

先读 `assets/fullstack-monorepo-template-v9/AGENTS.md`、`README.md` 与目标文件。全量复制的参考方式：

```sh
TEMPLATE=/path/to/agent-plugin-marketplace/plugins/web-app-scaffolding/skills/react-nestjs-fullstack-scaffold/assets/fullstack-monorepo-template-v9
TARGET=/path/to/new-project

# 目标目录必须不存在或为空；复制时包含隐藏文件。
mkdir -p "$TARGET"
cp -a "$TEMPLATE"/. "$TARGET"/
```

然后在**新项目**中替换工程名、`@repo/*` 包名（如业务要求）、`items` 示例领域、示例文案、环境配置与设计 Token；按实际需求保留或删减示例实现。不要在 `assets/` 原地开发，不要把示例账号/数据当生产数据，不自动沿用 v9 的未更新依赖作为安全结论。

## 按需复用部分目录

允许只复制真实需要的代码，必须一并闭合其依赖、公共 Contract 和测试：

| 需求 | 建议起点 | 同步检查的依赖 |
| --- | --- | --- |
| React Web 前端 | `apps/web/` | `packages/contracts/`、`packages/ui/`、`packages/i18n/`、Workspace 脚本与配置 |
| Nest API 后端 | `apps/api/` | `packages/contracts/`、Drizzle Migration、环境模板、测试数据库配置 |
| UI 组件 | `packages/ui/src/components/` 内对应组件 | CSS Modules、Token、依赖包与组件测试；必要时 `packages/ui/package.json` |
| HTTP Contract | `packages/contracts/src/` 内相关域 | Zod Schema、公共 Envelope、测试、双方使用处 |
| Auth/Session | `apps/api/src/modules/account/` 及前端 `features/authentication/` | DB Schema/Migration、共享合同、全局 Guard、CSRF、测试 |
| 项目质量基线 | `tests/`、`.github/workflows/`、各项目测试配置 | 根据保留下来的 apps/packages 与 scripts 改造，不复制失效测试 |

只做局部借鉴时，不机械照搬整个包。复制完成后检查 import/exports、package scripts、workspace 引用、环境变量、Migration 和测试是否仍形成闭环。不能把 v9 的 `pnpm-lock.yaml` 用作不同依赖组合的有效 lockfile，应在目标项目中重新解析并校验。

## 验证与停止条件

1. 确认模板只被读取/复制，v9 原始文件保持不变。
2. 按目标项目实际保留的内容运行 `pnpm install --frozen-lockfile`（仅锁文件与清单一致时）、`pnpm lint`、`pnpm typecheck`、相关单测与集成测试；真实前后端场景再运行 E2E。
3. 从 v9 增删依赖或修改 `package.json` 时，先更新目标项目 lockfile，再进行对应校验。
4. 原模板自带的 README/AGENTS/docs 是生成后项目的初始约束；不适用的功能应明确删除相关代码与说明，避免遗留失效规范。
5. 用户指定其它技术栈时，先判断是否属于明确迁移请求；没有迁移授权时不要硬套 v9。
