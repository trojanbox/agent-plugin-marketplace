# Architecture and Module Boundaries

用于新建/迁移目录、拆 Module、设计 DI、跨 Feature 或 Workspace Package 边界。

## 1. 应用结构

新项目默认：

```text
apps/
├── web/
└── api/
    └── src/
        ├── main.ts
        ├── app.module.ts
        ├── config/
        ├── errors/
        ├── http/
        └── modules/
            ├── database/
            ├── auth/
            ├── health/
            └── <business-domain>/
packages/
├── contracts/
├── i18n/
└── ui/
tests/
```

不要同时存在 `apps/api`、`apps/runtime`、`server/` 等多个后端入口。后端实现默认留在 `apps/api`，不提前抽 `packages/backend-core`、`platform-core`、`common`。

## 2. NestJS 是框架与 DI 合同

- 使用 Nest Module / Provider / Controller / Constructor Injection。
- 不建立 Service Locator、手工全局 Registry、隐藏 Singleton、业务层 `new Repository()`。
- Module `imports/exports` 是真实依赖合同；测试也要经过 TestingModule。

## 3. Module 必须粗粒度

Module 代表真实：

```text
业务领域边界
基础设施生命周期边界
独立 Public API 边界
明确运行/安全边界
```

合理：`AuthModule`、`WebsitesModule`、`BillingModule`、`DatabaseModule`、`HealthModule`。

强相关能力优先同 Module：

```text
WebsitesModule
├── controllers/
├── services/
│   ├── website.service.ts
│   ├── website-settings.service.ts
│   └── website-publishing.service.ts
└── repositories/
```

可以拆目录/文件，不意味着拆 Module。

### 过度拆分告警

- 一个业务 Module 只有 1～2 个 Provider；
- `PasswordHashModule`、`SlugModule`、`RetryModule` 这类一 Provider 一 Module；
- 新增一个功能要改 5 个 Module 的 imports/exports；
- 大量 A→B→C→A 网状依赖；
- `forwardRef()` 持续增长；
- 为两个强耦合 Module 再造 `SharedModule/CommonModule`。

优先合并强耦合 Module。原则：**先内聚，后拆分**。

## 4. 小型跨域 Provider

Clock、ID Generator 等小型、稳定、跨域 Provider 可集中在有限的 `FoundationModule`，无需各建 Module。

FoundationModule 不能变成“不知道放哪就塞这里”的垃圾桶。Nest 官方 Config/Health 等继续用官方 Module，不复制进 Foundation。

## 5. Module Public API

Repository 默认私有；对外优先 export 少量 Application Service：

```ts
@Module({
  providers: [WebsiteService, WebsiteRepository, WebsitePublishingService],
  exports: [WebsiteService],
})
export class WebsitesModule {}
```

跨 Feature 禁止 deep import 目标 Repository 或内部 Service。目标 Module exports 越小越健康。

## 6. Controller / Service / Repository

```text
HTTP
 ↓
Controller   只负责 Transport
 ↓
Service      用例/规则/事务/编排
 ↓
Repository   Drizzle/持久化查询
 ↓
DatabaseService / PostgreSQL
```

硬边界：

- Controller 永远不注入 Feature Repository；
- Controller 不开事务、不写 SQL；
- Service 可以 `database.transaction()`，但不写 Drizzle query/raw SQL；
- Repository 持有 CRUD/Join/Filter/Pagination/Mapping；
- Cross-feature Repository import 默认禁止。

不默认再加 UseCase/Manager/Facade/DAO/Interactor/DomainService 等固定层。

## 7. Workspace Package Gate

创建 Package 前至少满足：

- 当前已有多个真实应用/发布单元消费；或
- 本身是明确独立合同/发布物；或
- 已冻结架构明确要求，例如 `packages/contracts`。

普通 `apps/api` 内共享不等于 Workspace Package。

跨 Package 只能走 `exports`，内部依赖使用 `workspace:` protocol。

## 8. Review

新增 Module/Package 时问：

1. 当前 Owner 是谁？
2. 现有 Module 为什么不能承接？
3. 它是否形成稳定独立 Public API/生命周期？
4. 新拆分是否减少耦合，还是只增加 wiring？
5. 如果删掉这个 Module/Package，结构是否反而更清楚？
