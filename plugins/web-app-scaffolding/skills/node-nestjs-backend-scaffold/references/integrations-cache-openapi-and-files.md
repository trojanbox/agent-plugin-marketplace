# Integrations, Cache, OpenAPI and Files

用于第三方 HTTP、Cache、OpenAPI/Swagger、上传/下载。

## 1. External HTTP 按需

没有第三方 HTTP 时不预装 client。真实需要时优先 Nest 官方：

```text
@nestjs/axios + HttpModule + HttpService
```

每个外部系统有明确 `*.client.ts` Owner，例如 BillingModule 内 `stripe.client.ts`；不要为每个 Client 建独立 Module。

业务 Service 依赖 `StripeClient` 等语义 Client，不直接依赖 `HttpService/AxiosResponse/Observable`。

Client Boundary：

```text
External JSON
→ Zod validate
→ External DTO
→ map
→ Application Result
```

第三方 response 永远按不可信输入处理。

## 2. External HTTP Reliability

每个系统有自己的 typed timeout config；credentials 通过 typed config 注入，不读 process.env、不进 log。

Retry 默认关闭，尤其 mutation；不要全局 Axios interceptor blind retry。Transport interceptor 只处理稳定 auth/correlation/telemetry，不处理业务 retry/DB/吞错。

Axios/DNS/timeout/provider 429/5xx 在 Client Boundary 转稳定 dependency error，Controller 不理解 AxiosError。

## 3. Cache 默认没有

PostgreSQL + 正确 Index 足够覆盖普通 CRUD。只有测量证明高频重复昂贵读取/外部 API 成本/stale tolerance 时才加。

真实需要时优先官方 `@nestjs/cache-manager`。默认不全局 CacheInterceptor 缓存 authenticated/multi-tenant response，避免 scope key 错误泄漏数据。

Cache 不是 Source of Truth；key 包含完整业务 scope，TTL/invalidation Owner 明确。Memory cache 只单实例；真正 shared cache 需要 Redis 等时再单独决策。

Authorization/session revoke state 不直接依赖普通 stale cache。

## 4. OpenAPI 默认能力

REST API 默认 `@nestjs/swagger`。同一个 Zod Standard Schema 驱动 Validation + OpenAPI，不复制 class-validator DTO。

Swagger UI：Development 默认 `/docs`；Production 默认关闭 UI。公开第三方 API/内部 OpenAPI JSON 是否暴露由项目明确决定。

文档至少覆盖 method/path、body/query/param schema、auth、success/error、pagination、binary/stream content type。

Operation ID 使用稳定规则；CI 应能生成 OpenAPI 且不抛错。默认代码→OpenAPI，不额外维护手写 `openapi.yaml` 作为第二事实源。

## 5. 文件上传按需

无文件需求不预装 S3/image/multipart 额外平台。

Express Adapter 下优先 Nest 官方：

```text
FileInterceptor / FilesInterceptor
ParseFilePipe / ParseFilePipeBuilder
```

校验 max size、MIME、file count、required/optional。文件名/MIME 是不可信输入；高安全场景需要内容检测/扫描时再增加。

大文件/媒体不默认全部 Buffer 到 API memory，优先 streaming 或对象存储直传方案。

下载/媒体/stream 遵守 Raw Response，不套 JSON Envelope，正确设置 Content-Type/Content-Disposition/Range 等实际协议。
