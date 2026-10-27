# v10 PostgreSQL 全栈模板

## 默认使用

全栈新项目默认从 `assets/fullstack-monorepo-template-v10/` 复制，保持该目录为只读模板资产。它继承原始 v9 的 React、NestJS、共享 Contract、认证、UI 和测试结构，并把数据库统一为 PostgreSQL 17 / Drizzle ORM。

按需复用时先读取模板自身的 `AGENTS.md`、`README.md`、`package.json`、`apps/api/drizzle/` 与要复制的源码。全量拷贝请使用 `cp -a TEMPLATE/. TARGET/`，避免遗漏隐藏文件。只复制局部模块时，检查 Workspace 包、跨包 Contract、数据库 Migration、配置、依赖和对应测试能否闭合。

## PostgreSQL 的数据库合同

- `users` 和 `items`：`created_at`、`updated_at` 使用 `TIMESTAMPTZ(3) NOT NULL DEFAULT now()`；`deleted_at` 为可空 `TIMESTAMPTZ(3)`。
- DB Migration 中为普通业务表创建 `BEFORE UPDATE` Trigger，统一更新 `updated_at` 并保留 `created_at`；即便直接执行 SQL 更新也要生效。
- 所有普通业务查询过滤 `deleted_at IS NULL`，包括列表计数、详情、登录和有效 Session 关联；示例尚未实现业务删除/恢复 API，不要自行补建。
- `auth_sessions` 是具有过期和撤销语义的技术表，使用 `created_at`、`expires_at`、`revoked_at`，无需机械加入软删除。
- 保存和日志以 UTC 为准，跨 API 传输使用 ISO 8601 UTC（Z）；用户本地时间在 UI 侧格式化。
- 软删除的用户仍然占据 email 唯一索引。只有业务明确决定后才调整邮箱复用规则。

## 依赖与测试库

- 使用 `pg` 驱动和 `drizzle-orm/node-postgres`；Repository、Guard、Service、Controller、Readiness 都必须处理异步 I/O。
- `apps/api/.env.example` 声明开发、Integration、E2E 三个独立 PostgreSQL 数据库连接字符串。开发可选 `docker compose up -d postgres`，但生产使用独立账号和独立环境配置。
- `apps/api/scripts/reset-test-db.ts` 的破坏性重置只允许 NODE_ENV=test、明确测试 DB URL、名称中包含 test 和 integration/e2e 约束、DB 身份不同于开发库。不得直接复用开发库，也不得以 SQLite 或 Mock 代替真实 PostgreSQL Repository/HTTP Integration。
- 单元测试由被测源码共置的 `*.test.ts` 承担，真实 DB 测试在 `tests/integration/api/`。
- 项目正式 Migration 包含 PostgreSQL 建表与 Trigger DDL，新增迁移需要一并更新快照并测试；部署不会在 API startup 自动执行 Migration。

## 版本边界

旧版 `assets/fullstack-monorepo-template-v9/` 与 `references/template-v9.md` 原样保留，仅在用户明确需要 SQLite/v9 时选择，不作为新项目默认起点。本版 v10 如需进一步改进，另建后续版本，禁止直接修改已发布的模板作为派生项目的日常工作区。
