# Architecture and Module Boundaries

用于新建/迁移目录、拆 Module、设计 DI、跨 Feature 或 Workspace Package 边界。

## 1. 应用结构

新项目默认保留 `modules/`，`AppModule` 只做 Composition Root。Module 按**粗粒度业务域 / 基础设施边界**组织，Module 内再按职责分目录：

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
            ├── account/
            │   ├── controllers/
            │   │   └── auth.controller.ts
            │   ├── services/
            │   │   └── auth.service.ts
            │   ├── repositories/
            │   │   └── account.repository.ts
            │   ├── guards/
            │   ├── decorators/
            │   ├── security/
            │   └── account.module.ts
            ├── catalog/
            │   ├── controllers/
            │   │   └── items.controller.ts
            │   ├── services/
            │   │   └── items.service.ts
            │   ├── repositories/
            │   │   └── items.repository.ts
            │   └── catalog.module.ts
            └── infrastructure/
                ├── controllers/
                │   └── health.controller.ts
                ├── database/
                │   ├── schema/
                │   └── database.service.ts
                └── infrastructure.module.ts
packages/
├── contracts/
├── i18n/
└── ui/
tests/
```

规则：

- `AppModule` 只组装 Module 与全局框架配置，不直接堆放全部业务 Controller / Service / Repository。
- Module 名表达粗粒度 owner；例如登录、注册、用户、Session 可归同一个 `AccountModule`，列表/详情/筛选等同领域能力可归同一个 `CatalogModule`。
- Controller / Service / Repository 必须进入所属 Module 的 `controllers/`、`services/`、`repositories/`；禁止平铺在 Module 根目录。
- 技术基础设施可按真实生命周期边界聚合，例如 Database + Health 由一个 `InfrastructureModule` 承接；不要为了一个 `DatabaseService` 或一个 Health Controller 再各建 Module。
- 目录/文件可以继续细分，但不能因为多一个文件、Provider、endpoint 或 CRUD 就增加 Nest Module。

不要同时存在 `apps/api`、`apps/runtime`、`server/` 等多个后端入口。后端实现默认留在 `apps/api`，不提前抽 `packages/backend-core`、`platform-core`、`common`。

## 2. NestJS 是框架与 DI 合同

- 使用 Nest Module / Provider / Controller / Constructor Injection。
- 不建立 Service Locator、手工全局 Registry、隐藏 Singleton、业务层 `new Repository()`。
- Module `imports/exports` 是真实依赖合同；测试也要经过 TestingModule。

## 3. Module 必须粗粒度

### 默认：多 Module，但按业务域聚合

新项目保留模块化结构，避免把所有业务都塞进 `AppModule`。同时，Module 数量必须克制：**一个 Module 应覆盖一组强相关、共同演进的业务能力或一个真实基础设施生命周期边界。**

合理聚合示例：

```text
AccountModule
├── login
├── register
├── user profile
└── session

CatalogModule
├── list
├── detail
├── filter
└── category

InfrastructureModule
├── database lifecycle
└── health/readiness
```

不要机械演变成：

```text
LoginModule
RegisterModule
SessionModule
ItemListModule
ItemDetailModule
HealthModule
DatabaseModule
```

### Module 创建 / 拆分 Gate

新增或拆出 Module 前，至少证明它形成下列一种真实独立边界：

```text
业务领域边界
基础设施生命周期边界
稳定独立 Public API 边界
明确运行/安全边界
```

同时检查：

1. 这组能力是否有共同 owner、模型、规则或生命周期，需要一起演进；
2. 继续留在现有粗粒度 Module 是否已经造成职责混杂、依赖扩散或 Public API 不清；
3. 拆分后是否真正减少耦合，而非只增加 `imports/providers/exports` wiring；
4. 如果只是新增一个 Controller / Service / Repository / endpoint，默认继续留在现有 Module；
5. 如果删掉候选 Module 并合回上一级领域，结构反而更清楚，则不要拆。

`AuthModule`、`WebsitesModule`、`BillingModule`、`DatabaseModule`、`HealthModule` 这些名字本身都不构成合理性证明；关键是它们是否达到上述边界。

### Module 内部按职责分目录

```text
modules/
└── websites/
    ├── controllers/
    │   └── website.controller.ts
    ├── services/
    │   ├── website.service.ts
    │   ├── website-settings.service.ts
    │   └── website-publishing.service.ts
    ├── repositories/
    │   └── website.repository.ts
    └── websites.module.ts
```

可以拆目录/文件，不意味着拆 Module；创建 Module 也不意味着把 Controller / Service / Repository 平铺在 Module 根目录。

### 过度拆分告警

- 一个业务 Module 只对应单个 endpoint、单个 Controller 或单个 Provider；
- `PasswordHashModule`、`SlugModule`、`RetryModule` 这类一 Provider 一 Module；
- 登录和注册分别建 Module，列表和详情分别建 Module；
- Database/Health 只有简单 Provider/Controller 却各自单建 Module，而完全可以归到同一基础设施边界；
- 新增一个功能要改 5 个 Module 的 imports/exports；
- 大量 A→B→C→A 网状依赖；
- `forwardRef()` 持续增长；
- 为两个强耦合 Module 再造 `SharedModule/CommonModule`。

优先合并强耦合 Module。原则：**多模块承载边界，粗粒度控制数量，目录层级承载细节。**

## 4. 小型跨域 Provider

Clock、ID Generator 等小型、稳定、跨域 Provider 不为自己创建独立 Module。优先放入已经存在且职责匹配的粗粒度基础设施 Module。

只有当多个真实独立 Module 共同依赖一组稳定基础 Provider，并且现有 Infrastructure/Platform 边界不适合承接时，才考虑有限的 `FoundationModule`。

FoundationModule 不能变成“不知道放哪就塞这里”的垃圾桶。Nest 官方 Config 等继续使用官方 Module。

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

- Controller / Service / Repository 都按职责进入所属 Module 的对应目录，不在 Module 根目录平铺；
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

先检查 Module 粒度，再检查目录：

1. `AppModule` 是否只做 Composition Root，没有把全部业务 Provider 直接堆进去？
2. 当前 Module 是否代表一组强相关业务能力或真实基础设施生命周期边界？
3. 是否出现一接口一 Module、一 Provider 一 Module、登录/注册各一个 Module 之类机械拆分？
4. 强相关能力是否应该合并回同一个粗粒度 Module？
5. Controller / Service / Repository 是否分别进入所属 Module 的 `controllers/`、`services/`、`repositories/`？
6. 新 Module 是否真正减少耦合，并形成清楚的 Public API / 生命周期 / owner？
7. 如果删掉这个 Module 并合并回相邻领域，结构是否反而更清楚？
