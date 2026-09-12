---
name: react-typescript-frontend-scaffold
description: "用于按固定 React + TypeScript 前端技术栈创建、扩展、迁移、重构或审查 Web 前端工程。适合‘按 React 前端脚手架规范实现/新建 Vite React SaaS/把现有 React 前端迁到这套基线/审查组件、路由、CSS、i18n、测试是否符合规范’。当前栈固定 React 19 + TypeScript 6 + Vite 8 + React Router 7 + pnpm/Turborepo，Native CSS + CSS Modules、Radix Primitives、Lucide、i18next、Vitest/Testing Library、Playwright；完整 React+Nest 全栈由 web-app-scaffolding/react-nestjs-fullstack-scaffold 主导，只做后端或非 React 前端技术栈不使用本 Skill。"
visibility: workflow
phase: implementation
---

# React + TypeScript Frontend Scaffold

## 唯一目标

让 AI 在 **React + TypeScript + Vite** 前端栈中持续产出结构清晰、视觉统一、依赖克制、可访问、可测试、可维护的代码。

## 技术栈身份

```text
React 19 + TypeScript 6 + Vite 8 + React Router 7
pnpm + Turborepo
Native CSS + CSS Modules + CSS Custom Properties
PostCSS + postcss-preset-env + Browserslist
Radix Primitives + Lucide
packages/i18n: i18next + react-i18next
Vitest + React Testing Library
Playwright E2E
Oxlint + Prettier
```

默认不引入 Tailwind、Sass/SCSS、Less、CSS-in-JS、Axios、Redux/Zustand/MobX、表单大库、外部视觉 UI System、Icon Font、React Compiler。

## 每次执行流程

1. **先读项目事实**：读取 `AGENTS.md`、现有目录、package scripts、tsconfig、Vite/Router 配置和目标 Feature；已有明确合同优先于本 Skill 的新项目默认值。
2. **确认栈匹配**：现有项目不是 React/Vite 栈且用户未要求迁移时，只指出差异，不静默换栈。
3. **确认任务边界**：区分 Component/UI、Feature、Route/Data、Style/Theme、i18n、测试、性能或安全；不要借局部任务重构无关层。
4. **按需加载 reference**：只读取当前任务相关文件。
5. **Local First**：类型、状态、常量、组件先留在最近 Owner；真实跨文件/跨 Feature 复用后再提升。
6. **复用既有合同**：优先已有 UI Primitive、Semantic Token、Feature Public API、apiClient 和 i18n namespace，不创建平行体系。
7. **实现后验证**：至少运行受影响范围的 lint/typecheck/test；关键用户流程补/跑 E2E。没有真实结果时不得声称通过。

## 按需读取

| 任务触发条件 | 读取 |
| --- | --- |
| 新项目目录、Feature、Package、文件命名、Import | `references/architecture-and-naming.md` |
| 页面视觉、CSS、Token、Theme、Icon、Radix | `references/visual-css-and-ui.md` |
| React Component、Props、State、Hook、Context | `references/react-components-and-state.md` |
| Router、loader/action、Service、DTO、HTTP | `references/routing-data-and-http.md` |
| 用户文案、Locale、日期/金额/数字格式 | `references/i18n.md` |
| Unit/Component/E2E、Fixture、真实后端/数据库 | `references/testing-and-e2e.md` |
| Env、安全、TS/Oxlint、依赖、注释、兼容代码 | `references/security-config-and-quality.md` |
| Lazy、图片、资源、字体、响应式、性能 | `references/performance-assets-and-responsive.md` |
| 最终 Review、迁移审计、提交前检查 | `references/review-gates.md` |
| 需要追溯已冻结前端决策来源 | `references/decision-index.md` |

## 始终生效的硬边界

- 组件/Page 私有样式用共置 `*.module.css`，只从当前目录引用；禁止子级向父/祖先目录借 CSS Module。全局 CSS 只承担 tokens/reset/base/index。
- Design Token：Foundation → Semantic → Component；业务颜色优先 Semantic Token。
- 独立 React UI Unit 一组件一目录；普通组件目录不加无意义 `index.ts`。
- 应用级布局进入 `layouts/`，浏览器/HTTP 基础设施进入 `infrastructure/`；不默认使用含义模糊的 `shell/`、`lib/`。
- Package `src/` 根只保留 Public API/入口，Contract、i18n、UI 实现按功能/组件类别继续分目录。
- 跨 Feature 只能经 Feature Public API；跨 Package 只能经 Package exports。
- Page 负责组合；Route 数据优先 loader/action；无实例状态 Service 默认静态可继承类且不依赖 React；UI 不直接消费后端 Persistence Model。
- HTTP 默认 Native Fetch，以 `infrastructure/http/ApiClient` 静态可继承类集中处理，必须检查 HTTP status 并支持 AbortSignal。
- 复杂交互可在 `packages/ui` 内封装 Radix Primitives；业务 Feature 不直接依赖 Radix。
- 用户可见自然语言走 i18n；`packages/ui` 不依赖 `packages/i18n`。
- Dark Mode、响应式、Route/大 Feature 懒加载、非首屏图片懒加载是默认能力。
- Semantic HTML First；键盘、Focus、Label、Contrast 是默认合同。
- Comments 只保留代码无法可靠表达的约束/原因/外部怪异行为；不为显而易见实现写常规说明，修改时清理附近过期注释。
- 浏览器默认合同：Chrome 80+、Edge 80+、Firefox 78+、Safari 13.1+、iOS Safari 13.4+。
- 不为未来假想需求新增依赖、兼容层、全局 Store、抽象目录或独立 Package bundler。

## 停止边界

- 只做 Node/Nest 后端 → `web-app-scaffolding/node-nestjs-backend-scaffold`。
- 同时交付当前 React + Nest 全栈 → `web-app-scaffolding/react-nestjs-fullstack-scaffold` 主导，本 Skill 被组合加载。
- 前端不是 React/Vite 且用户未要求迁移 → 明确栈不匹配并停止套用本规范。
- 发现目标功能当前不存在 → 明确指出，不继续凭空设计专项平台。
- 用户主要在查 Bug、做源码调研、讨论方案或写计划 → 让对应 development Skill 保留主路由。
