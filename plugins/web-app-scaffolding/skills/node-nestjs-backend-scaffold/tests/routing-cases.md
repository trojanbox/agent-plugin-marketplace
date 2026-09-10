# Backend Scaffold Semantic Routing Cases

目标：验证 `web-app-scaffolding/node-nestjs-backend-scaffold` 有独立任务目标，并且不会抢 Bug 调查、源码调研、讨论、Spec、开发计划、API 合同审计和前端脚手架。

| ID | Bucket | Prompt | Expected |
| --- | --- | --- | --- |
| B001 | positive | 按我们这套后端脚手架规范初始化一个 NestJS API。 | web-app-scaffolding/node-nestjs-backend-scaffold |
| B002 | positive | 给这个通用 SaaS 后端搭 apps/api、登录注册、Health 和第一个 CRUD，目录和 Module 粒度都按脚手架基线。 | web-app-scaffolding/node-nestjs-backend-scaffold |
| B003 | positive | 把现有 Nest 项目的 Controller、Service、Repository 按脚手架规范重构一下。 | web-app-scaffolding/node-nestjs-backend-scaffold |
| B004 | positive | 审查这个后端目录是不是 module 拆太碎了，并按统一基线整改。 | web-app-scaffolding/node-nestjs-backend-scaffold |
| B005 | positive | 给 websites 新增 CRUD 后端，API 返回、分页、Drizzle、Zod 都按我们已经定的规范。 | web-app-scaffolding/node-nestjs-backend-scaffold |
| B006 | positive | 把这个 Node 后端迁到 PostgreSQL + Drizzle，并按正式 migration 生命周期整理。 | web-app-scaffolding/node-nestjs-backend-scaffold，前提是用户明确要求迁移 |
| B007 | positive | 给现有 Nest API 加统一 Session/Auth/Permission，按通用脚手架安全基线做。 | web-app-scaffolding/node-nestjs-backend-scaffold |
| B008 | positive | 按后端基线把测试改成 Nest TestingModule + 真实 PostgreSQL integration。 | web-app-scaffolding/node-nestjs-backend-scaffold |
| B009 | positive | 检查整个 API 是否符合我们的统一 Envelope、pagination、error 和 OpenAPI 规范，并直接整改。 | web-app-scaffolding/node-nestjs-backend-scaffold |
| B010 | positive | 把后端 lint/ts/import/module boundary 统一成当前脚手架。 | web-app-scaffolding/node-nestjs-backend-scaffold |
| B011 | multi-turn | 前面后端合同已经定稿了，现在直接按这套规范开始实现项目骨架。 | web-app-scaffolding/node-nestjs-backend-scaffold |
| B012 | multi-turn | 就按刚才 D-001 到 D-020 的结论，把后端代码整理到位。 | web-app-scaffolding/node-nestjs-backend-scaffold |
| N001 | negative | 登录接口偶发 500，这里有日志，结合源码找根因。 | development/github-bug-investigation |
| N002 | negative | 完整梳理一下这个 Nest 后端现在怎么工作的、有哪些模块和依赖。 | development/github-research-document-generator |
| N003 | negative | 咱们讨论一下后端到底用 Nest 还是 Fastify，先别改代码。 | development/github-discussion-facilitator |
| N004 | negative | 后端方案已经定稿，给我生成一个 GitHub 开发计划。 | development/github-development-plan-generator |
| N005 | negative | 把刚才讨论的后端合同冻结成正式结论 Issue。 | development/github-spec |
| N006 | negative | 这个接口当前到底返回哪些字段，鉴权、schema、OpenAPI 一致吗？先只审计。 | development/api-contract-audit |
| N007 | negative | 这个明确的小 Bug 直接给我生成 .patch。 | Patch Fast Lane Gate；不是 web-app-scaffolding/node-nestjs-backend-scaffold 主路由 |
| N008 | negative | 给我做一个 React 管理后台页面和组件。 | web-app-scaffolding/react-typescript-frontend-scaffold/前端能力 |
| N009 | negative | 用 Java Spring Boot 搭一套后端脚手架。 | 当前 pack 无匹配 Java Skill；不得命中 Node/Nest Skill |
| N010 | negative | 用 Python FastAPI 做后端基线。 | 当前 pack 无匹配 Python Skill；不得命中 Node/Nest Skill |
| N011 | negative | 用 Go 做后端脚手架。 | 当前 pack 无匹配 Go Skill；不得命中 Node/Nest Skill |
| A001 | adversarial | 先调查登录 500 的根因，顺便把整个 AuthModule 重构成脚手架规范。 | Bug investigation + implementation 两个阶段；先调查，根因确认后再 web-app-scaffolding/node-nestjs-backend-scaffold |
| A002 | adversarial | 讨论一下 Redis 要不要引入，并且直接把 Redis Cache 架构写完。 | 未决架构讨论优先；web-app-scaffolding/node-nestjs-backend-scaffold 不预造 Redis |
| A003 | adversarial | 把这个接口当前合同审计清楚，发现不符合统一规范的地方直接整改。 | API audit 先建立事实；若整改也是主要交付物则顺序进入 web-app-scaffolding/node-nestjs-backend-scaffold |
| A004 | adversarial | 从零把完整前端和后端脚手架都建起来。 | web-app-scaffolding/react-nestjs-fullstack-scaffold |
| A005 | gate | 现有项目是 Express + Prisma，我只想加一个接口，没有要求迁移技术栈。 | web-app-scaffolding/node-nestjs-backend-scaffold 不应静默改 Nest/Drizzle；先尊重现有项目事实 |
| A006 | gate | 现有项目是 Express + Prisma，把整个后端迁到我们定的 Nest + Drizzle 基线。 | web-app-scaffolding/node-nestjs-backend-scaffold |
| A007 | gate | 需要做异步任务，顺便按“标准架构”给我加 BullMQ、Redis、Worker、Outbox。 | 明确指出这些当前不是默认能力；真实需求需要单独架构决策，不自动扩展 |
| A008 | gate | 做一个普通 CRUD，为了以后扩容把 Redis、CQRS、EventBus 都预装好。 | web-app-scaffolding/node-nestjs-backend-scaffold 应拒绝预防性平台复杂度，仍用简单 CRUD 基线 |
| A009 | gate | 只有登录注册、列表详情和健康检查，这种 Nest 项目 Module 怎么拆才不会太碎？ | web-app-scaffolding/node-nestjs-backend-scaffold；保留粗粒度多 Module，例如 Account/Catalog/Infrastructure，`AppModule` 只组装，Module 内按 `controllers/services/repositories` 分目录 |
| A010 | gate | 已有一个真正独立的网站领域，需要多个 Controller、Service、Repository 共同演进并向其他领域暴露稳定服务，目录怎么放？ | web-app-scaffolding/node-nestjs-backend-scaffold；满足 Module Gate 时可建粗粒度领域 Module，但内部仍按 `controllers/services/repositories` 分目录 |
