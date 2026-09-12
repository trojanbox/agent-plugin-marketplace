# Testing and E2E

用于后端 Unit/Module/Repository/HTTP/E2E、Test DB、Fixture、Regression。

## 1. 目录

后端纯 Unit Test 与生产源码 Owner 共置；跨文件、跨 Module、数据库和浏览器级测试集中在根 `tests/`：

```text
apps/api/src/modules/account/services/
├── auth.service.ts
└── auth.service.test.ts

tests/
├── integration/api/
├── e2e/
└── support/api/
```

Service、Guard、纯 helper，以及不连接真实数据库的局部 Repository Unit Test 使用 `*.test.ts` 与被测文件同目录。不要重新建立 `tests/unit/api` 镜像树，也不要创建 `__tests__` 目录。

真实数据库 Repository Test 属于 Integration，继续放 `tests/integration/api/repositories/`。Module Wiring、HTTP Pipeline、跨 Module 行为也放 Integration。

## 2. Vitest + Nest TestingModule

如果 Production Subject 由 Nest 管理，测试也由 Nest 创建：

```ts
const moduleRef = await Test.createTestingModule({
  providers: [
    WebsiteService,
    { provide: WebsiteRepository, useValue: repositoryStub },
  ],
}).compile()
const service = moduleRef.get(WebsiteService)
```

不要：

```ts
new WebsiteService(repositoryStub as any)
```

因为 DI token/module wiring 本身就是生产合同。

Unit 测试显式 override 真正 collaborator；默认不 broad auto-mock 所有缺失依赖。

## 3. Module Wiring

有意义的 Feature Module 和 AppModule 要能用 `Test.createTestingModule({ imports:[...] })` 编译并 resolve 核心 Provider。

用于发现漏注册、漏 imports/exports、token 错误、循环依赖。跨 Feature 测试通过真实 Module public API，不 deep import Repository。

## 4. Repository Integration

必须真实：

```text
Repository + DatabaseService + Drizzle + PostgreSQL + Production Migrations
```

不要 Mock Drizzle/SQL、不要用 SQLite/in-memory fake 冒充 PostgreSQL Integration。

验证 schema mapping、constraint、join、transaction、pagination/sort、snake_case↔camelCase、Raw SQL exception。

## 5. Test DB Safety

使用 `TEST_DATABASE_URL`，必须与 dev/prod 分离；destructive reset 前检查：

```text
NODE_ENV=test
TEST_DATABASE_URL exists
TEST_DATABASE_URL != DATABASE_URL
DB name has test marker
```

缺配置不能 fallback 到开发数据库。

通用脚手架不要求 Testcontainers；本地真实 PG 或 CI service/container 都可以。

## 6. Migration 与 Fixture

Test DB schema 只来源 Production Migration Ledger：fresh DB → migrate → tests。

Fixture 放 `tests/support/api`，例如 `database.ts/test-app.ts/auth.fixture.ts/website.fixture.ts`。Production source 不 import tests。

Fixture = 自动测试前置状态；Seed = dev/demo data。测试不依赖“库里刚好有 seed”。

每个 test 自己创建唯一数据，不能依赖执行顺序。Transaction rollback 可以局部优化，但 Dedicated Test DB + unique data + cleanup 是默认隔离模型。

## 7. HTTP Integration

真实启动 Nest App：

```ts
const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
const app = moduleRef.createNestApplication()
configureApp(app)
await app.init()
```

使用 Supertest 验证真实 Middleware/Guard/Pipe/Controller/Interceptor/Filter/Envelope/Cookie/Header。

Production `main.ts` 与测试 App 必须复用同一 `configureApp()` HTTP infrastructure 配置，避免测试漏 Helmet/CSRF/global prefix/filter/pipe。

## 8. 基础 HTTP 合同集中覆盖

至少有共享测试验证：

```text
Zod invalid → 400 VALIDATION_ERROR
Success/Failure Envelope
Detail / List pagination shape
HTTP status
X-Request-Id
Global Auth default deny + @Public
401 / 403
Session Cookie / CSRF
Sensitive endpoint rate limit
RawResponse bypass
/health /ready
```

无需每个 Feature 重复框架合同。

## 9. E2E

核心用户流：

```text
Playwright Browser
→ Real apps/web
→ Real apps/api
→ Real PostgreSQL Test DB
```

Mock API 不替代核心 E2E。第三方 API failure/极难稳定构造的外部边界可以受控 mock。

前置状态可通过 Fixture/API 快速准备；真正被测用户行为走 Browser。

## 10. Regression / Determinism

每个 Bug 修复至少一个能复现旧失败的 regression case，选最接近根因的最低成本层：Unit / Wiring / Repo Integration / HTTP / E2E。

禁止 arbitrary sleep、blind retry、加超大 timeout、`--forceExit` 掩盖 flaky/leaked handle。时间/ID/外部副作用通过可注入 Provider 控制。

测试后 `moduleRef.close()` / `app.close()`，资源通过 Nest lifecycle 释放。
