# Fullstack Monorepo Template

这是一个可直接复制作为新项目起点的 React + NestJS 全栈 Monorepo 模板，内置登录注册、Session、列表、详情、SQLite Migration、分层测试和 CI 基线。

## 技术基线

- React 19 + TypeScript 6 + Vite 8 + React Router 7
- NestJS 12 + Express
- SQLite + Drizzle ORM
- pnpm Workspace + Turborepo
- `packages/contracts`：共享 Zod HTTP Contract
- `packages/ui`：`radix-ui` + Lucide + CSS Modules
- `packages/i18n`：i18next + react-i18next
- Vitest + React Testing Library + Supertest + Playwright
- Oxlint + Prettier + GitHub Actions

## 快速开始

需要 Node.js 24+ 和 Corepack。

```bash
corepack enable
pnpm install
cp apps/api/.env.example apps/api/.env
pnpm db:setup
pnpm dev
```

默认入口：

```text
Web:    http://localhost:5173
API:    http://localhost:3001/api/v1
Health: http://localhost:3001/api/v1/health
Ready:  http://localhost:3001/api/v1/ready
SQLite: apps/api/data/app.db
```

API 启动时不会自动执行 Migration。

## 常用命令

| 目标           | 命令                     |
| -------------- | ------------------------ |
| 启动开发环境   | `pnpm dev`               |
| 构建           | `pnpm build`             |
| 类型检查       | `pnpm typecheck`         |
| Lint           | `pnpm lint`              |
| 常规测试       | `pnpm test`              |
| 单元测试       | `pnpm test:unit`         |
| 集成测试       | `pnpm test:integration`  |
| Chromium E2E   | `pnpm test:e2e:chromium` |
| 全浏览器 E2E   | `pnpm test:e2e`          |
| Coverage       | `pnpm test:coverage`     |
| 提交前验证     | `pnpm verify`            |
| 完整验证       | `pnpm verify:all`        |
| 数据库初始化   | `pnpm db:setup`          |
| Migration 检查 | `pnpm db:check`          |

## 关键代码入口

- 前端：`apps/web`
- 后端：`apps/api`
- 跨应用 HTTP Contract：`packages/contracts`
- UI Primitive：`packages/ui`
- 国际化：`packages/i18n`
- 数据库 Migration：`apps/api/drizzle`
- 共置 Unit Test：各源码 Owner 旁的 `*.test.ts(x)`；跨层测试：`tests`
- CI：`.github/workflows/ci.yml`

## 长期文档

- [系统架构与边界](docs/architecture.md)
- [认证与安全模型](docs/authentication-and-security.md)
- [测试策略与数据库生命周期](docs/testing-strategy.md)
- [文档管理规范](docs/documentation-policy.md)

具体字段、错误码、数据库列和国际化文案优先查机器可读源码，不在 Markdown 中维护第二份副本。

## 作为新项目模板

复制后优先替换项目名称、`@repo/*` 包名、示例 `items` 领域、示例文案和 Design Token。保留现有架构、认证、Migration、测试和文档管理边界，直到真实业务需求要求调整。

没有真实需求时，不提前加入 Redis、Queue、Worker、CQRS、GraphQL、微服务或第二套全局状态方案。
