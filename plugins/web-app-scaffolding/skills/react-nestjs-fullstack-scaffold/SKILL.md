---
name: react-nestjs-fullstack-scaffold
description: "用于从唯一内置源码模板创建、按需复用、迁移或审查 pnpm/Turborepo 下的 React + TypeScript 前端与 Node.js + NestJS 后端完整项目。默认模板采用 PostgreSQL + Drizzle 保存用户/业务，Redis 保存登录会话和限流；适合‘React+Nest 全栈脚手架/前后端一起初始化 apps/web + apps/api/统一 packages/contracts/按我们这套前后端合同从零建项目/把完整项目迁到 React+Nest 基线’。每次必需组合 react-typescript-frontend-scaffold 与 node-nestjs-backend-scaffold；只做单侧任务由对应 Skill 主导，后端是 Java/Python/Go 或前端不是 React 时不使用本 Skill。"
visibility: workflow
phase: implementation
uses: "web-app-scaffolding/react-typescript-frontend-scaffold,web-app-scaffolding/node-nestjs-backend-scaffold"
---

# React + NestJS Fullstack Scaffold

## 唯一目标

从**已保存的 React/Vite + NestJS/PostgreSQL/Drizzle Monorepo 源码**派生新项目、复制所需模块并保证 Web/API/共享合同一起演进；栈内通用实现规范由两个组合 Skill 负责。

## Skill Composition

本 Skill 每次执行都必须组合：

```text
web-app-scaffolding/react-typescript-frontend-scaffold
web-app-scaffolding/node-nestjs-backend-scaffold
```

- 前端 Skill 拥有 React/Vite/UI/Router/i18n/前端测试的具体实现合同；
- 后端 Skill 拥有 Nest/Module/Drizzle/Auth/Migration/后端测试的具体实现合同；
- 本 Skill 只拥有**跨栈边界、共享 Contract、交付顺序和全链路验收**。

不要把两边 reference 再复制进本 Skill。

## 固定组合栈

```text
apps/web  → React 19 + TypeScript 6 + Vite 8 + React Router 7
apps/api  → Node 24 LTS + NestJS 12 + Express + PostgreSQL(pg)/Drizzle + Redis 7.4+
packages/contracts → Zod serialized contracts
Workspace → pnpm + Turborepo
Quality → Oxlint + Prettier + Vitest + Playwright
```

## 每次执行流程

1. **新建工程统一使用当前模板**：先读取 `assets/fullstack-monorepo-template/` 的 `AGENTS.md`、`README.md`、项目清单和目标源码，再按 `references/template.md` 整体或局部复制；不从空白目录重新发明已有能力。
2. **现有工程先读事实**：读取项目的 `AGENTS.md`、workspace、apps/packages、contracts、API bootstrap、前端 router/api client、测试与 Migration，不静默覆盖现有项目。
3. **确认组合栈与用户目标**：新项目默认 PostgreSQL；明确需要 SQLite 或其他数据库时先核对实际适配或技术栈适配范围。现有前后端栈不同且用户未授权迁移时停止强套模板。
4. **按需复制、再冻结跨栈合同**：确定要保留的模块、请求/响应 Schema、错误码、Auth/CSRF、分页和 Ownership，清理不适用的示例与依赖。
5. **以 Vertical Slice 实施**：一次完成一个可验证业务切片的 Contract → API → Web → Test；不预造无业务需要的空模块。
6. **按需读取 reference**：首次创建或复用必须读 `references/template.md`；其它跨栈 reference 仅在需要时读取，栈内细节交给 `uses` 的两个 Skill。
7. **双侧验证**：分别执行前后端 lint/typecheck/unit/integration；具备真实环境时对关键流程运行 Web + API + Test DB 的 Playwright E2E。未真实运行的校验必须明确注明。

## 按需读取

| 触发条件 | 读取 |
| --- | --- |
| 全栈新项目初始化、复用模板组件/模块、追溯模板身份 | `references/template.md`（新项目必读） |
| apps/web、apps/api、packages/contracts、DTO/Schema ownership、API client 边界 | `references/workspace-and-contract-boundaries.md` |
| 登录/CSRF/迁移联动、全链路测试、发布顺序、最终验收 | `references/fullstack-validation-and-delivery.md` |

## 始终生效的跨栈硬边界

- **模板资产唯一来源**：`assets/fullstack-monorepo-template/` 存放完整可复制源码。唯一基线为 PostgreSQL；直接维护当前模板目录，用 Git 历史追溯修改；复制后在目标项目派生改造。
- **数据库职责**：本全栈模板用 PostgreSQL/Drizzle 管理用户与业务，Redis 管理 Session/CSRF 和认证限流。模板只维护单一初始 Migration/Snapshot/Journal（从零建当前 Schema），不记录旧表历史；跨 Redis/PG 不声明原子事务。

- `apps/web` 不能 import `apps/api` 源码；`apps/api` 也不能 import `apps/web`。
- 真正跨应用的 serialized schema/type 才进入 `packages/contracts`；Repository Row、Nest Provider、UI Props 不进入。`src/` 根只保留 Public API，多个真实 Contract 领域按功能目录组织。
- API 合同单源：后端 Route 使用共享 Zod Schema，前端通过共享类型和统一 `ApiClient` 边界消费；不维护前后端两份 DTO。
- 普通 JSON 成功/失败、详情/列表/分页结构统一；前端不猜 response shape。
- Browser Auth 默认同源 HttpOnly Session Cookie + CSRF；前端不保存 Session credential。
- Database migration 是部署步骤；前端构建/启动不拥有数据库生命周期。
- Feature 名相同不等于代码互相穿透；前后端各自保持自己的 Feature Owner 和 Public API。
- 本 Skill 不自行定义 `apps/api` 内部目录和 Nest Module 粒度；凡是创建、迁移或审查后端目录/Module，必须触发 `node-nestjs-backend-scaffold` 的架构 reference，以后端 Skill 为唯一规则 Owner，不能凭全栈示例或 Feature 名机械造 Module。
- 全栈模板默认写入保守文档管理约束：`docs/` 只承载长期知识；调研、计划、TODO、Debug、Handoff、执行日志等任务级产物不进入正式文档，确需落盘时使用被 Git 和项目格式化工具忽略的 `.agents/work/`；新增长期 Markdown 必须通过“六个月后仍必需”、源码难以可靠推导、未来重复使用、维护成本可接受、无重复权威来源这组检查。不要为了描述该规则额外创建文档说明文件。
- 当前全栈基线已经包含长期有效且源码难以快速还原的架构、认证安全、测试/数据库生命周期和文档治理约束，因此初始化模板时维护 `docs/architecture.md`、`docs/authentication-and-security.md`、`docs/testing-strategy.md`、`docs/documentation-policy.md` 四个长期入口；README/AGENTS 只链接和摘要，不复制正文。某主题在实际项目不存在时不创建空文档。
- 不为了“全栈完整”提前加入 Worker、Queue、S3、GraphQL、BFF、微服务或第二套 API Client。

## 停止边界

- 用户只要求前端 → 直接由 `react-typescript-frontend-scaffold` 主导。
- 用户只要求 Node/Nest 后端 → 直接由 `node-nestjs-backend-scaffold` 主导。
- 后端明确是 Java/Spring、Python/FastAPI、Go 等 → 本 Fullstack Skill 不匹配；未来新增对应后端 Skill 与对应 Fullstack 组合 Skill。
- 明确要求 SQLite 的项目 → 当前模板采用 PostgreSQL；只有用户授权数据库迁移时才能修改目标项目数据库栈。
- 前端明确不是 React/Vite → 同理选择/新增匹配前端技术栈 Skill。
- 用户主要在做 Bug 根因、现状调研、架构讨论、Spec/计划 → 对应 development Skill 先主导；不要借“全栈”绕过阶段 Gate。
