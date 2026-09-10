# Config, Observability and Health

用于环境变量、Secret、日志、requestId、Request Context、健康检查和优雅关闭。

## 1. Config

默认官方 `@nestjs/config` + Zod。流程：

```text
Environment/.env
→ ConfigModule.forRoot + Zod startup validation
→ registerAs namespaced config
→ ConfigType<typeof config>
→ Nest DI
```

Required 配置缺失在 bootstrap fail fast。不要再引 Joi 形成第二套校验。

`process.env` 只允许在 config/tool boundary；Feature 不到处 `ConfigService.get('DATABASE_URL')`。优先：

```ts
constructor(
  @Inject(databaseConfig.KEY)
  private readonly config: ConfigType<typeof databaseConfig>,
) {}
```

`.env` 只是本地来源；Production 可由容器/Secret Manager/CI 注入。仓库提供无真实 Secret 的 `.env.example`。

## 2. Secret

Database credential、signing secret、OAuth secret、API key、encryption key 不进入：

```text
packages/contracts
HTTP Response
log
details
startup full config dump
```

关键 Secret 不给 `changeme` 一类危险默认值。

`NODE_ENV` 不作为业务功能开关；业务差异用明确 typed config/feature contract。

## 3. Logger

默认 Nest `Logger/ConsoleLogger`，不用 Pino/Winston 除非真实能力不足。

```text
Development → readable console
Production  → JSON structured logs
```

生产日志写 stdout/stderr，由部署平台收集；不默认写本地 log file。

业务日志使用稳定 event：

```text
website.created
auth.login.failed
http.request.completed
```

不保留 `console.log` debug。

## 4. Request ID

每个 HTTP Request 服务端生成 `crypto.randomUUID()` requestId，Response Header：

```text
X-Request-Id
```

HTTP completion/error log 带 requestId。公网客户端提供的 id 默认不信任；未来可信 Gateway 透传需单独 trusted boundary。

## 5. AsyncLocalStorage

Node 原生 ALS 只保存极小 observability context，例如：

```ts
type RequestContext = { requestId: string }
```

未来可以加 traceId。不要塞 currentUser、permissions、service registry、config、database、mutable business state。

业务 Principal/tenant scope 继续显式参数传递。

## 6. HTTP Logging

统一 Interceptor 记录一次 `http.request.completed`：requestId、method、route template、statusCode、durationMs。

默认不记录完整 Body/Response/Query/Header，尤其 Authorization、Cookie、password、token、API key。

Expected 4xx 不需要 full stack；Unexpected 5xx 统一边界记录 stack + safe context。

## 7. Health / Ready

官方 `@nestjs/terminus`。

```text
/health → Liveness：进程是否活着，保持轻量
/ready  → Readiness：是否可接真实流量
```

`/ready` 可以检查 DB reachable + 当前 migrations 已应用。短暂第三方非关键依赖不应随意让整个服务 Not Ready。

Health/Ready 属于 infrastructure protocol，不套普通 ApiEnvelope。

## 8. Shutdown

默认：

```ts
app.enableShutdownHooks()
```

Database pool、timer、未来真实存在的 Redis/Queue 等通过 Nest lifecycle `OnModuleDestroy/OnApplicationShutdown` 释放。不要每个 Feature 自写 `process.on(SIGTERM)`。

## 9. APM/Metrics

通用脚手架默认没有 Sentry/OpenTelemetry/APM/Prometheus Framework。真实出现 SLO、distributed tracing、autoscaling/business metrics 后再按部署平台选。
