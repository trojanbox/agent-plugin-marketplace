# Fullstack Monorepo Template

这是一个可直接复制作为新项目起点的 React + NestJS 全栈 Monorepo 模板，内置登录注册、列表、详情、PostgreSQL Migration、Redis Session/限流、分层测试和 CI 基线。

## 技术基线

- React 19 + TypeScript 6 + Vite 8 + React Router 7
- NestJS 12 + Express
- PostgreSQL + Drizzle ORM（用户、业务数据）
- Redis 7.4+（Session、CSRF 会话摘要、认证限流）
- pnpm Workspace + Turborepo
- `packages/contracts`：共享 Zod HTTP Contract
- `packages/ui`：`radix-ui` + Lucide + CSS Modules
- `packages/i18n`：i18next + react-i18next
- Vitest + React Testing Library + Supertest + Playwright
- Oxlint + Prettier + GitHub Actions

## 快速开始

需要 Node.js 24+、Corepack、Docker Compose（或自行提供 PostgreSQL 17 和 Redis 7.4+）。

```bash
corepack enable
pnpm install
pnpm scaffold:init my-project --display-name "My Project"
docker compose up -d postgres redis
pnpm db:setup
pnpm dev
```

默认入口：

```text
Web:    http://localhost:5173
API:    http://localhost:3001/api/v1
Health: http://localhost:3001/api/v1/health
Ready:  http://localhost:3001/api/v1/ready
PostgreSQL: 127.0.0.1:5432/fullstack_dev
Redis: 127.0.0.1:6379（开发 DB 0，Integration DB 14，E2E DB 15）
```

API 启动时不会自动执行 Migration。新项目请先运行 `pnpm scaffold:init`，自动生成名称、界面标题、独立数据库名称和 .env；多个项目共用一台机器时可以指定 `--db-port 5543 --redis-port 6380`。示例 app/app 凭据只用于本地开发；生产必须使用独立账号和机密。

Compose 首次初始化会创建 fullstack_dev、fullstack_integration_test、fullstack_e2e_test 三个数据库。若已有 Compose Volume，则需要另行创建缺失的测试数据库，切勿为了重建测试库删除开发数据卷。

- 业务表的 created_at、updated_at 为 TIMESTAMPTZ(3) NOT NULL DEFAULT now()，deleted_at 为 nullable TIMESTAMPTZ(3)。
- users 和 items 的 updated_at 由 PostgreSQL Trigger 在 UPDATE 时维护，直接 SQL 写入同样生效；created_at 保持不变。
- 普通业务查询排除 deleted_at 已设置的数据；PostgreSQL 不再保留 auth_sessions 或 auth_rate_limits 表。
- 已软删除账户的 email 仍占用唯一索引。脚手架暂不提供账户删除、软删除恢复及复用邮箱接口。
- API 返回 ISO 8601 UTC 时间，浏览器按本地语言与时区显示。

## 现成基础设施

- **可靠事务**：Service 用 `DatabaseService.transaction()` 声明原子性，Repository 自动复用调用链中的 PostgreSQL 事务。PG 事务只保障 PG 操作；注册先保存未公开的 Redis Session，再创建 PG 用户，数据库失败时清理未公开 Session。
- **认证安全**：对登录/注册在执行密码哈希前进行 Redis 原子计数与 TTL 限流，分别是每 IP 每分钟 12/6 次；超限返回 429/Retry-After。没有可信代理时忽略外部转发 IP。
- **写入上下文**：`RequestContext` 自动持有 requestId 和经认证的 actorId，`AuditFields.onCreate/onUpdate` 自动注入可审计的字段，匿名写入必须明确可信系统身份。
- **软删除过滤**：`activeRecord(table)` 提供公共 SQL 条件；示例 Repository 的列表、详情、更新和软删除都采用它。
- **健康与日志**：`/health` 返回存活状态，`/ready` 同时检查 PG Migration Ledger、数据库连接和 Redis 连通性；请求有 X-Request-Id、结构化请求日志；PG 错误映射为统一 API 响应。
- **前端 HTTP**：ApiClient 支持 GET/POST/PUT/PATCH/DELETE、网络/非 JSON 错误、204 空响应、AbortSignal、Cookie/CSRF。
- **分页**：items 列表通过查询参数获取当前页和真实总数，提供上一页、下一页的可访问导航。
- **业务例子**：`POST /api/v1/items` 完整演示从受保护 HTTP 请求自动注入 createdBy/updatedBy 到数据库。

复制模板后的唯一初始化命令：
`pnpm scaffold:init <project-name> [--display-name "Name"] [--db-port 5432] [--redis-port 6379]`。项目名称最多 46 个小写 npm 安全字符，以兼容 PostgreSQL 的标识符长度；重复初始化会被拒绝，不覆盖已有 `.env`。

默认的 PostgreSQL 连接池最大 10 个连接，连接/空闲/语句超时可通过 DB_POOL_MAX、DB_CONNECTION_TIMEOUT_MS、DB_IDLE_TIMEOUT_MS、DB_STATEMENT_TIMEOUT_MS 配置；TRUSTED_PROXY_IPS 为明确可信代理的 IP 列表（默认空）。Redis 用原生 TTL 自动清理 Session 与限流键，无需专门的清理任务。生产应开启合适持久化、备份和 noeviction 策略；Redis 故障时认证失败、Readiness 返回 503。

## 常用命令

| 目标           | 命令                     |
| -------------- | ------------------------ |
| 启动开发环境   | `pnpm dev`               |
| 构建           | `pnpm build`             |
| 类型检查       | `pnpm typecheck`         |
| Lint           | `pnpm lint`              |
| 常规测试       | `pnpm test`              |
| 单元测试       | `pnpm test:unit`         |
| 集成测试       | `pnpm test:integration`  |
| Chromium E2E   | `pnpm test:e2e:chromium` |
| 全浏览器 E2E   | `pnpm test:e2e`          |
| Coverage       | `pnpm test:coverage`     |
| 提交前验证     | `pnpm verify`            |
| 完整验证       | `pnpm verify:all`        |
| 数据库初始化   | `pnpm db:setup`          |
| Migration 检查 | `pnpm db:check`          |

## 关键代码入口

- 前端：`apps/web`
- 后端：`apps/api`
- 跨应用 HTTP Contract：`packages/contracts`
- UI Primitive：`packages/ui`
- 国际化：`packages/i18n`
- 数据库 Migration：`apps/api/drizzle`
- 共置 Unit Test：各源码 Owner 旁的 `*.test.ts(x)`；跨层测试：`tests`
- CI：`.github/workflows/ci.yml`

## 长期文档

- [系统架构与边界](docs/architecture.md)
- [认证与安全模型](docs/authentication-and-security.md)
- [测试策略与数据库生命周期](docs/testing-strategy.md)
- [文档管理规范](docs/documentation-policy.md)

具体字段、错误码、数据库列和国际化文案优先查机器可读源码，不在 Markdown 中维护第二份副本。

## Session 技术表迁移

通过独立追加的 Drizzle Migration 删除 PostgreSQL 的 auth_sessions、auth_rate_limits，保留历史迁移流水。
升级后既有 PostgreSQL 会话全部失效，用户必须重新登录。Redis 的 Session/限流状态与 PG 用户数据不可通过一个数据库事务原子提交，注册采用先创建不可对外获取的会话、后写用户，PG 失败时清理会话的顺序。测试专用 Redis DB 14/15 在测试 reset 时会被清空，禁止与生产或其他项目共用。

**生产滚动发布注意**：本迁移会实际 DROP 两张技术表，旧版 API 不能和新 Schema 同时运行。有现存生产实例时，需安排受控停机切换或两阶段迁移；不能先 DROP 表、再让旧 API 继续接收请求。

## 作为新项目模板

复制后优先替换项目名称、`@repo/*` 包名、示例 `items` 领域、示例文案和 Design Token。保留现有架构、认证、Migration、测试和文档管理边界，直到真实业务需求要求调整。

没有真实需求时，不提前加入 Queue、Worker、CQRS、GraphQL、微服务或第二套全局状态方案。
