# Routing Cases

用于将本 Skill 接回 Agent Plugin Marketplace 后做语义路由回归。

## 应该触发

1. “按我们通用脚手架规范新建一个 React 管理后台页面，目录、CSS、测试都按规范来。”
2. “把这个 Vite React 项目的前端目录整理成 Feature First，并统一组件命名和 CSS Modules。”
3. “这个页面用 Tailwind 写的，帮我迁到我们那套原生 CSS + CSS Modules 规范。”
4. “给这个 Feature 补 loader/action、service、api client 和组件测试，遵守前端脚手架。”
5. “审查这个 React 页面有没有违反 Design Token、i18n、Dark Mode、Accessibility、懒加载规范。”
6. “给 `packages/ui` 实现 Dialog，底层用 Radix，视觉按我们自己的 Token。”
7. “给这个项目补 Playwright E2E，放 tests/e2e，跑真实后端和测试库。”
8. “创建一个新的 SaaS 前端骨架，React 19、Vite 8、React Router 7、Turborepo。”

## 不应该触发

1. “帮我设计一个纯静态宣传页视觉稿，不需要代码。” → visual artifact/design skill。
2. “分析 NestJS 后端模块、依赖注入和数据库规范。” → 后端/研发架构能力。
3. “这个按钮颜色是什么？” → 普通事实/代码读取即可。
4. “帮我修这个 Node.js CLI 的内存泄漏。” → 软件 Bug 调查，不是前端脚手架合同。
5. “给我生成一份后端 E2E 测试方案。” → 技术测试方案能力。
6. “查一下 React 20 最新发布内容。” → Web/research，不是实现合同。

9. “用 Vue 3 + Vite 搭一套前端脚手架。” → 当前 pack 无匹配 Vue Skill；不得命中 React Skill。
10. “用 SvelteKit 做前端基线。” → 当前 pack 无匹配 Svelte Skill；不得命中 React Skill。

## 邻居冲突 / 组合

### 与 design-system-authoring

- 用户主目标是“设计 UI Kit / 高保真视觉规范” → design-system-authoring 主路由。
- 用户主目标是“在代码里实现/审查通用前端脚手架及其 Design Token/CSS/UI” → web-app-scaffolding/react-typescript-frontend-scaffold。
- 已有视觉规范需要落到 React/CSS 工程时可组合，本 Skill 承担实现合同。

### 与 github-bug-investigation

- 用户报告具体前端 Bug、要找根因 → github-bug-investigation 主路由。
- 根因已确认，实施代码时可用本 Skill 作为前端实现约束，但它不替代 Bug 调查流程。

### 与 github-development-plan-generator

- 用户要“开发计划/实施计划” → development plan 主路由。
- 计划中的前端实现约束可以引用本 Skill，但本 Skill 不替代计划输出。

### 与 source-patch-implementation

- 用户明确要 S 级 `.patch` → source-patch-implementation 主路由，并把本 Skill 当作前端编码规范。
- 大范围前端重构不因本 Skill 存在而绕过既有 Fast Lane Gate。

## 停止样例

- 发现目标仓库是 Next.js + Tailwind，用户只让修一个 Bug：不要自动迁移 Vite/CSS Modules；只指出与默认脚手架不同。
- 发现用户要实现数据库/认证后端：明确前端合同只覆盖浏览器侧，后端部分转对应规范。
- 发现用户要求的“组件”在当前系统根本不存在：明确指出，再按用户真实目标决定是否新增；不要继续假设后续复杂设计已存在。
