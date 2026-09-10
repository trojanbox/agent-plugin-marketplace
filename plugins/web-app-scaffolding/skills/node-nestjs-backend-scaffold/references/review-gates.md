# Backend Scaffold Review Gates

用于最终审查、迁移验收、PR/提交前检查。只检查与当前任务相关项；架构迁移建议完整过一遍。

## Architecture

- [ ] 后端只有明确 `apps/api` 入口，没有 runtime/server 平行实现？
- [ ] `AppModule` 是否只做 Composition Root，没有把全部业务 Provider 直接堆进去？
- [ ] 新建 API 是否保留少量粗粒度领域/基础设施 Module，而非退化成单大 Module？
- [ ] 每个 Nest Module 是否代表一组强相关业务能力或真实基础设施生命周期/Public API/运行安全边界？
- [ ] 是否出现一接口一 Module、一 Provider 一 Module、大量 imports/exports/forwardRef？
- [ ] 强相关 Service/Repository/Controller 是否应该合并回同一个粗粒度 Module？
- [ ] 每个 Module 内部是否按 `controllers/`、`services/`、`repositories/` 分层，没有平铺？
- [ ] Controller 是否只依赖 Service，未注入 Repository？
- [ ] Service 是否无 Drizzle/raw SQL？
- [ ] Repository 是否默认私有，跨 Feature 是否只走 Module Public API？
- [ ] 是否为了内部复用提前抽 backend-core/common workspace package？

## Persistence / Migration

- [ ] DB 物理名 lower snake_case，应用层 camelCase？
- [ ] 普通 CRUD/Join/Pagination 是否 Drizzle Query Builder First？
- [ ] Raw SQL 是否真属例外、参数化、有理由和测试？
- [ ] Constraint/Index 是否表达真实 invariant/query pattern？
- [ ] List/Count 是否同 filter + authorization scope？
- [ ] 是否存在 N+1/无意 SELECT 大字段？
- [ ] Schema Change 是否有正式 Migration + SQL Review？
- [ ] 是否误用 `push` 修改共享环境？
- [ ] Production API 是否完全不 auto-migrate？
- [ ] `/ready` 是否只读校验 DB/migration state？

## API / Validation / Error

- [ ] Zod 是否单一 serialized schema 来源？
- [ ] 是否使用 Nest `StandardSchemaValidationPipe`，没有自研 Zod Pipe？
- [ ] Detail 是否 `data:T`，List 是否 `{list,page}`？
- [ ] Pagination 是否 `currentPage/pageSize`，sortBy 白名单？
- [ ] HTTP Status 是否真实，而非失败都 200？
- [ ] Controller 是否手工构造 Envelope/catch 全局错误？
- [ ] Service 是否抛 ApplicationError 而非 Nest HTTP Exception？
- [ ] Unknown error 是否真正 500，details/message 是否无 Secret/stack/SQL 泄漏？
- [ ] REST Route/GET/PATCH/POST/DELETE 语义是否一致？

## Config / Observability

- [ ] 是否官方 `@nestjs/config` + Zod fail-fast？
- [ ] Feature 是否直接 `process.env`/字符串 ConfigService.get？
- [ ] Secret 是否可能进入日志/Response/Error details？
- [ ] Production 是否 JSON structured logs？
- [ ] 是否有 requestId + X-Request-Id？
- [ ] ALS 是否只放极小 correlation context？
- [ ] `/health` 与 `/ready` 是否语义分离且轻量？
- [ ] 是否启用 shutdown hooks 并释放资源？

## Auth / Security

- [ ] Browser Credential 是否只在 HttpOnly Server Session Cookie？
- [ ] DB 是否只存 session token hash，并支持 expiry/revoke？
- [ ] Production Cookie 是否 HttpOnly/Secure/SameSite=Lax/Path=//No Domain？
- [ ] Mutation 是否配套 CSRF？
- [ ] Auth 是否 Default Deny + explicit Public？
- [ ] Route 是否表达 Permission，资源 scope 是否进入 Repository Query？
- [ ] Password 是否 Node scrypt 合规参数、自描述 hash、dummy verify、并发限制？
- [ ] 登录等敏感接口是否 Throttler；Helmet 是否启用；CORS 是否收紧？

## Testing

- [ ] Nest-managed Subject 是否通过 `Test.createTestingModule()` 获取？
- [ ] 是否 broad automock/手工 new 对象图掩盖 wiring？
- [ ] Meaningful Module/AppModule 是否有 wiring coverage？
- [ ] Repository Integration 是否真实 PostgreSQL + Drizzle + production migration？
- [ ] TEST_DATABASE_URL 是否有 destructive safety guard？
- [ ] HTTP Integration 是否真实 Nest App + `configureApp()` + Supertest？
- [ ] 核心 E2E 是否真实 Web + API + Test DB？
- [ ] Bug 修复是否 regression case？
- [ ] 是否通过 sleep/retry/timeout/forceExit 掩盖 flaky/leak？

## TypeScript / Quality

- [ ] 文件是否 `business-name.role.ts`，目录 kebab-case？
- [ ] Type/Constant/Schema/Error 是否 Local First？
- [ ] 是否避免 enum/any/@ts-ignore/non-null/无意义 default export？
- [ ] 类型 import 是否 `import type`，Node built-in 是否 `node:`？
- [ ] 是否存在 import cycle/cross-feature repository deep import？
- [ ] 是否 Oxlint + Prettier 单一工具链，typecheck 独立？
- [ ] Promise safety、console、process.env、focused test 等是否有自动 Gate？
- [ ] 是否保留 dead/commented/legacy/debug code？

## Time / Concurrency / Performance

- [ ] 时间 UTC + HTTP ISO 8601；业务 timezone IANA？
- [ ] 业务当前时间是否可注入 Clock；默认 ID 是否 Node randomUUID？
- [ ] Transaction 是否短小、没有 external network？
- [ ] 并发 correctness 是否落 PostgreSQL，而非进程 Mutex/先查后写？
- [ ] 是否 blind retry mutation；需要 idempotency 时是否持久化 UNIQUE？
- [ ] Async operation 是否有 owner/timeout/cancellation？
- [ ] JSON/bulk/page/pool 等资源是否有界？
- [ ] 是否无证据切 Fastify/加 Cache/Redis/Worker？

## Dependencies / Stop Gate

- [ ] 新依赖是否先检查 Node/Nest 官方能力？
- [ ] 外部 HTTP/Cache/File/Redis 等是否真的有需求才引入？
- [ ] 是否创建空 wrapper/empty package/module？
- [ ] Compatibility/fallback/feature flag 是否有明确支持对象和退出条件？
- [ ] 当前不存在 Redis/Worker/Queue/Event Bus 时，是否停止继续设计其后续平台？
