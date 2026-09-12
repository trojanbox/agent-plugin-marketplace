---
name: node-nestjs-backend-scaffold
description: "用于按固定 Node.js + NestJS 后端技术栈创建、扩展、迁移、重构或审查 API 工程。适合‘按 Nest 后端脚手架规范实现/初始化 apps/api/把现有 Node 后端迁到 Nest + PostgreSQL + Drizzle/审查 Controller-Service-Repository、Module 粒度、Zod、Session、Migration、测试是否符合基线’。当前栈固定 Node 24 LTS + TypeScript ESM + NestJS/Express + PostgreSQL/Drizzle + Zod + Vitest；完整 React+Nest 全栈由 web-app-scaffolding/react-nestjs-fullstack-scaffold 主导，只做前端或 Java/Spring、Python/FastAPI、Go 等后端技术栈不使用本 Skill。"
visibility: workflow
phase: implementation
---

# Node + NestJS Backend Scaffold

## 唯一目标

让 AI 在 **Node.js + NestJS + PostgreSQL/Drizzle** 后端栈中按冻结合同创建、迁移、重构或审查边界清晰、Module 克制、官方优先、真实可测试的 API。

## 技术栈身份

```text
Node 24 LTS + TypeScript + ESM + pnpm Workspace
NestJS + Express
PostgreSQL + Drizzle ORM
Zod + Nest StandardSchemaValidationPipe
@nestjs/config + @nestjs/swagger + @nestjs/terminus
Vitest + @nestjs/testing + Supertest
Oxlint + Prettier
```

默认不预装 Redis、Queue/Worker、CQRS、Event Bus、Outbox/Saga、APM/Metrics、S3、Search/Feature Flag 等平台能力。

## 每次执行流程

1. **读项目事实**：先看 `AGENTS.md`、workspace、tsconfig、Nest bootstrap/module、DB schema/migration、测试与目标 Feature；已有明确合同优先于新项目默认值。
2. **确认栈匹配**：不是 Node/Nest/PostgreSQL/Drizzle 且用户未明确要求迁移时，只指出差异，不静默换栈。
3. **确认主任务**：只承接后端实现/迁移/重构/规范审查；Bug、调研、讨论、Spec、计划让对应 development Skill 主导。
4. **按需读 reference**：只加载当前主题。
5. **粗粒度多 Module、目录按职责分层**：`AppModule` 只做 Composition Root；新建 API 默认保留少量粗粒度领域/基础设施 Module。强相关功能合并到同一 Module，Controller / Service / Repository 分别进入该 Module 的 `controllers/`、`services/`、`repositories/`；禁止一接口、一 Provider、一小功能一个 Module。
6. **沿边界实现**：Controller → Service → Repository → Database；跨 Module/Package 只走公开 API；Node/Nest 官方能力优先。
7. **不预造平台**：无真实需求不装 Redis/Worker/Queue/Cache/HTTP Client，也不继续设计其体系。
8. **真实验证**：至少跑相关 lint/typecheck/test；Persistence 用真实 PostgreSQL，HTTP 用真实 Nest pipeline。未真实验证不得声称通过。

## 按需读取

| 任务触发条件 | 读取 |
| --- | --- |
| 应用目录、Module 粒度、DI、跨 Feature/Package 边界 | `references/architecture-and-module-boundaries.md` |
| Controller / Service / Repository、Drizzle、Schema、Migration | `references/persistence-and-migrations.md` |
| Zod、API Envelope、分页、REST、错误 | `references/api-contracts-validation-and-errors.md` |
| Env、Config、Logger、requestId、Health/Ready | `references/config-observability-and-health.md` |
| 登录、Session、Cookie、CSRF、Permission、密码安全 | `references/auth-and-security.md` |
| Unit/Module/Repository/HTTP/E2E、Test DB、Fixture | `references/testing-and-e2e.md` |
| TypeScript、命名、Import、Oxlint、Prettier | `references/typescript-naming-and-quality.md` |
| UTC、ID、事务、并发、Retry、Idempotency | `references/time-transactions-and-concurrency.md` |
| 第三方 HTTP、Cache、OpenAPI、文件上传 | `references/integrations-cache-openapi-and-files.md` |
| Express、资源限制、性能、pnpm、依赖与兼容代码 | `references/performance-runtime-and-dependencies.md` |
| 最终审查、迁移验收、提交前检查 | `references/review-gates.md` |
| 需要追溯已冻结后端决策来源 | `references/decision-index.md` |

## 始终生效的硬边界

- 后端默认 `apps/api`；不建 `server/runtime/backend-core/platform-core` 平行体系。
- `AppModule` 只负责组装粗粒度 Module 与全局框架配置，不把所有业务 Controller/Provider 直接堆进 `AppModule`。
- Module 少而内聚；相关功能先聚合成业务域/基础设施边界，例如账户域可承接登录、注册、用户、会话，目录/文件可细但 Module 不跟着细。
- 每个 Module 内 Controller / Service / Repository 必须按职责进入 `controllers/`、`services/`、`repositories/`，禁止平铺在 Module 根目录。
- 一 Provider 一 Module、一接口一 Module、大量 `forwardRef()`/网状依赖是过度拆分告警；新增 Module 必须能说明独立领域、基础设施生命周期、稳定 Public API 或明确运行/安全边界。
- Controller 不注入 Repository；Service 定事务但不写 Drizzle；Repository 持有查询且默认私有。
- DB lower snake_case，应用 camelCase；普通查询 Query Builder First。
- JSON API 统一 Envelope：详情 `data:T`，分页 `data:{list,page}`。
- Browser 默认 PostgreSQL Opaque Session + HttpOnly Cookie，服务端 Default Deny。
- Comments 只保留代码无法可靠表达的约束/原因/外部怪异行为；不为显而易见实现写常规说明，修改时清理附近过期注释。
- 新建或迁移项目时采用保守文档策略：`docs/` 只保存长期有效、源码难以快速可靠推导且未来会重复使用的项目知识；AI 调研、计划、TODO、Debug、Handoff、执行日志等任务级产物默认不进入 `docs/`。确需落盘的临时材料使用被 Git 和项目格式化工具忽略的 `.agents/work/`，创建正式 Markdown 前执行“六个月后是否仍必需”与单一事实来源检查；README/AGENTS 保持简洁。
- Production API 不自动 migrate；无支持合同的 legacy/fallback/双实现直接删。

## 停止边界

- 只做 React 前端 → `web-app-scaffolding/react-typescript-frontend-scaffold`。
- 同时交付当前 React + Nest 全栈 → `web-app-scaffolding/react-nestjs-fullstack-scaffold` 主导，本 Skill 被组合加载。
- Java/Spring、Python/FastAPI、Go 等不同后端栈 → 不套用本 Skill；选择/新增对应技术栈 Skill。
- 发现目标能力当前不存在 → 明确指出，不继续设计 Redis/Worker/Event Bus 等后续平台。
- 用户主要要求根因调查、讨论、Spec 或开发计划 → 让对应 development Skill 保留主路由。
