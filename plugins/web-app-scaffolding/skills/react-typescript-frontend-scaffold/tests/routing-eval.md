# Semantic Routing Eval

本轮为单模型语义回归证据，不声称统计准确率。

## Positive

| Case | Expected | Result |
| --- | --- | --- |
| 按我们通用脚手架规范新建 React 管理后台页面 | web-app-scaffolding/react-typescript-frontend-scaffold | PASS |
| 把 Vite React 项目整理成 Feature First + CSS Modules | web-app-scaffolding/react-typescript-frontend-scaffold | PASS |
| 把 Tailwind 页面迁到原生 CSS + CSS Modules 基线 | web-app-scaffolding/react-typescript-frontend-scaffold | PASS |
| 给 Feature 补 loader/action/service/api client 并遵守脚手架 | web-app-scaffolding/react-typescript-frontend-scaffold | PASS |
| 审查页面 Design Token/i18n/Dark Mode/Accessibility/lazy | web-app-scaffolding/react-typescript-frontend-scaffold | PASS |
| packages/ui 用 Radix 实现 Dialog，视觉自己写 | web-app-scaffolding/react-typescript-frontend-scaffold | PASS |
| 补 Playwright E2E，放 tests/e2e，跑真实后端/测试库 | web-app-scaffolding/react-typescript-frontend-scaffold | PASS |
| 新建 React19 + Vite8 + Router7 + Turborepo SaaS 前端骨架 | web-app-scaffolding/react-typescript-frontend-scaffold | PASS |

## Negative / Neighbor

| Case | Expected owner | Result |
| --- | --- | --- |
| 只设计高保真 UI Kit / 视觉稿，不写生产代码 | design-system-authoring / visual design | PASS |
| 分析 NestJS 后端模块、DI、数据库规范 | backend/development neighbor | PASS |
| 调查某个前端 Bug 的根因 | github-bug-investigation | PASS |
| 给需求生成开发计划 | github-development-plan-generator | PASS |
| 给后端生成技术测试方案 | github-technical-test-plan-generator | PASS |
| 查 React 最新版本/新闻 | research/web | PASS |
| 用 Vue 3 + Vite 搭前端脚手架 | 当前 pack 无匹配 Vue Skill | PASS |
| 用 SvelteKit 做前端基线 | 当前 pack 无匹配 Svelte Skill | PASS |

## Composition / Conflict

| Case | Ownership | Result |
| --- | --- | --- |
| 已有视觉稿，要求按脚手架落成 React/CSS | web-app-scaffolding/react-typescript-frontend-scaffold 主；设计规范作为输入 | PASS_COMPOSITION |
| 前端 Bug 根因已确认，要按脚手架约束实施 | Bug/patch workflow 主；web-app-scaffolding/react-typescript-frontend-scaffold 作为实现合同 | PASS_COMPOSITION |
| 用户明确要 S 级 `.patch` | source-patch-implementation 主；web-app-scaffolding/react-typescript-frontend-scaffold 辅助 | PASS_SEQUENCE |
| 用户同时要求“先重新设计整套 UI Kit，再实现完整前端” | 两个主交付物，需明确先后/拆分 | PASS_CONFLICT |

## Stop Boundary

- 既有项目是 Next.js + Tailwind，用户只修局部 Bug：不自动迁移，PASS。
- 用户进入后端认证/数据库设计：停止本 Skill 发散并路由，PASS。
- 目标组件当前不存在：先明确事实，不假设后续体系已经存在，PASS。
