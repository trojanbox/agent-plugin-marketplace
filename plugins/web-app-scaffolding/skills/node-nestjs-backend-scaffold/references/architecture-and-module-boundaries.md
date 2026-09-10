# Architecture and Module Boundaries

用于新建/迁移目录、拆 Module、设计 DI、跨 Feature 或 Workspace Package 边界。

## 1. 应用结构

新建/小型 API 默认从**单 `AppModule` + 按职责分目录**开始，不预建 `modules/`：

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
        ├── controllers/
        │   ├── auth.controller.ts
        │   ├── items.controller.ts
        │   └── health.controller.ts
        ├── services/
        │   ├── auth.service.ts
        │   └── items.service.ts
        ├── repositories/
        │   ├── auth.repository.ts
        │   └── items.repository.ts
        ├── guards/
        ├── decorators/
        ├── security/
        └── database/
            ├── schema/
            └── database.service.ts
packages/
├── contracts/
├── i18n/
└── ui/
tests/
```

规则：

- Controller / Service / Repository 按职责进入 `controllers/`、`services/`、`repositories/`；禁止把这些文件平铺在 `auth/`、`items/` 或某个 Module 根目录。
- `auth`、`items`、`health`、`database` 可以只是文件前缀或职责目录；出现这些能力不等于必须存在 `AuthModule`、`ItemsModule`、`HealthModule`、`DatabaseModule`。
- 小型项目由 `AppModule` 直接注册这些 Controller / Provider；先让代码内聚，再根据真实边界演进。
- 只有满足后文 Module Gate 时才增加 `modules/<domain>/`。一旦拆出 Module，其内部仍使用 `controllers/`、`services/`、`repositories/` 等职责子目录，不能退回平铺。

不要同时存在 `apps/api`、`apps/runtime`、`server/` 等多个后端入口。后端实现默认留在 `apps/api`，不提前抽 `packages/backend-core`、`platform-core`、`common`。

## 2. NestJS 是框架与 DI 合同

- 使用 Nest Module / Provider / Controller / Constructor Injection。
- 不建立 Service Locator、手工全局 Registry、隐藏 Singleton、业务层 `new Repository()`。
- Module `imports/exports` 是真实依赖合同；测试也要经过 TestingModule。

## 3. Module 必须粗粒度

### 默认：先不要拆 Module

新建、小型或只有少量 CRUD/Auth/Health 能力的 API，默认只保留 `AppModule`。**Feature 名、目录名、Controller 数量、Service 数量都不能单独作为创建 Nest Module 的理由。**

例如只有登录/注册、列表/详情、健康检查时，应优先保持：

```text
AppModule
├── controllers/
├── services/
├── repositories/
├── guards/
├── security/
└── database/
```

不要机械演变成：

```text
AuthModule
ItemsModule
HealthModule
DatabaseModule
```

### Module 创建 Gate

只有当一个候选边界能明确回答“为什么继续放在 `AppModule` 或现有 Module 已经不合适”，并且形成下列至少一种**真实独立边界**时，才创建 Module：

```text
业务领域边界
基础设施生命周期边界
稳定独立 Public API 边界
明确运行/安全边界
```

同时检查：

1. 拆分后是否减少跨职责耦合，而非只增加 `imports/providers/exports` wiring；
2. 是否有一组强相关 Controller / Service / Repository 需要共同演进；
3. 是否确实需要独立 exports、生命周期或安全边界；
4. 如果删掉这个 Module 并放回 `AppModule`/现有 Module，结构是否更简单且职责仍清楚——若是，则不要拆。

`AuthModule`、`WebsitesModule`、`BillingModule`、`DatabaseModule`、`HealthModule` 这些名称本身都不构成合理性证明；只有满足上述 Gate 时才成立。

### 拆出 Module 后仍按职责分目录

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

- 一个业务 Module 只有 1～2 个 Provider，且没有独立生命周期/Public API/安全边界；
- `PasswordHashModule`、`SlugModule`、`RetryModule` 这类一 Provider 一 Module；
- 登录/注册就单独建 `AuthModule`，单个 CRUD 就建 `ItemsModule`，一个健康接口就建 `HealthModule`；
- 新增一个功能要改 5 个 Module 的 imports/exports；
- 大量 A→B→C→A 网状依赖；
- `forwardRef()` 持续增长；
- 为两个强耦合 Module 再造 `SharedModule/CommonModule`。

优先合并强耦合 Module。原则：**先内聚，后拆分**。

## 4. 小型跨域 Provider

单 `AppModule` 阶段，Clock、ID Generator 等小型稳定 Provider 直接由 `AppModule` 注册，不为了“以后复用”提前创建 `FoundationModule`。

只有项目已经存在多个真实独立 Module，并且这些 Module 确实共同依赖一组稳定基础 Provider 时，才可以集中到有限的 `FoundationModule`，无需各建 Module。

FoundationModule 不能变成“不知道放哪就塞这里”的垃圾桶。Nest 官方 Config 等继续用官方 Module；简单 Health Controller 也不要求为了目录整齐额外创建 `HealthModule`。

## 5. Module Public API

本节只适用于已经通过 Module 创建 Gate 的独立 Module。单 `AppModule` 阶段不为了“Public API”概念额外造 Module。

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

- 无论当前只有 `AppModule` 还是已经拆出独立 Module，Controller / Service / Repository 都按职责进入对应目录，不在 Feature/Module 根目录平铺；
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

先检查目录，再检查 Module：

1. Controller / Service / Repository 是否分别进入 `controllers/`、`services/`、`repositories/`，没有平铺在 Feature/Module 根目录？
2. 新建/小型 API 是否仍可由单 `AppModule` 清晰承接？如果可以，不新增 Module。
3. 当前 Owner 是谁？
4. 现有 `AppModule`/Module 为什么不能承接？能否给出真实边界证据？
5. 候选 Module 是否形成独立领域、生命周期、稳定 Public API 或运行/安全边界？
6. 新拆分是否减少耦合，还是只增加 wiring？
7. 如果删掉这个 Module/Package，结构是否反而更清楚？
