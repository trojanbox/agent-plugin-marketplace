# API Contracts, Validation and Errors

用于 REST Route、Zod、API Envelope、分页、排序、Validation 和 Error Mapping。

## 1. Zod 单一 Runtime Schema

默认不用 `class-validator/class-transformer`。Serialized Boundary 以 Zod 为事实来源：

```ts
export const createWebsiteRequestSchema = z.object({
  name: z.string().trim().min(1).max(100),
})
export type CreateWebsiteRequest = z.infer<typeof createWebsiteRequestSchema>
```

跨 web/api 的 request/response/event schema 放 `packages/contracts`；后端私有 schema Local First。

不要把 DB 查询等异步业务规则塞进 Zod refine；结构校验归 Zod，业务规则归 Service，最终一致性归 PostgreSQL Constraint。

## 2. Nest 官方 Standard Schema

全局：

```ts
app.useGlobalPipes(new StandardSchemaValidationPipe())
```

Route：

```ts
@Body({ schema: createWebsiteRequestSchema }) input: CreateWebsiteRequest
@Param('websiteId', { schema: websiteIdSchema }) websiteId: string
```

不要自研 `zod-validation.pipe.ts`。同一 Zod Schema 同时服务 Runtime Validation、Type、Route Metadata、OpenAPI。

## 3. 普通 JSON Envelope

成功：

```ts
type ApiSuccess<T extends object> = {
  code: 0
  message: string
  data: T
}
```

详情/单对象：

```json
{ "code": 0, "message": "", "data": { "id": "1", "name": "A" } }
```

不要再套 `data.website` / `data.user`。

无业务数据：`data: {}`，不用 `null/true/"success"`。

## 4. 分页列表

请求：

```text
currentPage=1
pageSize=20
max pageSize=100
sortBy=<feature whitelist>
sortOrder=asc|desc
```

响应：

```ts
type ApiListData<T extends object> = {
  list: T[]
  page: {
    totalRows: number
    currentPage: number
    pageSize: number
  }
}
```

统一用 `list`，不混 `items/rows/records/results`。不重复返回可推导的 `totalPages/hasNext`。

List Item 可以比 Detail 轻。空列表仍返回完整 `{ list: [], page }`。

## 5. Filter / Sort

Filter 由 Feature 显式定义，禁止万能 JSON/DSL 查询语言。`keyword` 必须说明搜索哪些字段。

`sortBy` Zod 白名单并在 Repository 映射真实 column；绝不把客户端字符串拼 SQL。

默认排序必须 deterministic；必要时增加 `id` tie-breaker。

Authorization scope 必须进入数据库 Query；不能查全量后在内存按 tenant filter。

## 6. REST 语义

```text
GET    /api/v1/websites
POST   /api/v1/websites              → 201
GET    /api/v1/websites/:websiteId
PATCH  /api/v1/websites/:websiteId
DELETE /api/v1/websites/:websiteId   → 200 + data:{}
POST   /api/v1/websites/:websiteId/publish
```

GET 不产生 mutation；PATCH = partial update，PUT 只在真正完整替换时用；202 仅真实异步接受任务时用。

普通 JSON Controller 不直接 `@Res()` 接管；设置 Header/Cookie 可 `@Res({ passthrough:true })`。SSE/File/Binary/Media/Metrics 是 Raw Response，不套 Envelope。

## 7. Failure Contract

```ts
type ApiFailure = {
  code: number
  message: string
  data: Record<string, never>
  error: {
    code: string
    details?: Record<string, unknown>
    retryable: boolean
  }
}
```

HTTP Status 继续真实表达 400/401/403/404/409/429/5xx；禁止所有失败都 200。

前端根据稳定 `error.code` 做机器判断/i18n，不根据 message 分支。

## 8. Application Error

Service/Repository 不直接抛 `BadRequestException/ConflictException` 等 HTTP 类型。使用稳定 Application Error：

```ts
new ApplicationError({
  category: 'conflict',
  code: API_ERROR_CODE.WebsiteSlugConflict,
  message: 'Website slug already exists',
  details: { conflictingField: 'slug' },
})
```

有限 category 映射 HTTP：validation→400，unauthenticated→401，forbidden→403，not_found→404，conflict→409，rate_limited→429，precondition_failed→412，internal→500。

HTTP/Guard/Pipe 边界可用 Nest `HttpException`；全局 `APP_FILTER`/ExceptionFilter 统一转 `ApiFailure`。

## 9. Error 安全

- `details` 只返回明确安全结构，不 dump Error/request body/DB row/process.env；
- DB Driver Error 在 Repository/Persistence 边界按 SQLSTATE/constraint identity 转业务错误，不字符串匹配 message；
- External Client Error 在 Client Boundary 标准化；
- Unknown Error 真正返回 500 + `INTERNAL_ERROR`，stack/cause 只进服务端日志；
- Expected 4xx 不重复打 stack；未知 5xx 在统一边界记录一次；
- catch 只有在 translate/compensate/fallback/加安全上下文时才有意义。
