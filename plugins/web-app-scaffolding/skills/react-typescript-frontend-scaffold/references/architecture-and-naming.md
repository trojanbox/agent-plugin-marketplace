# Architecture & Naming

在创建 Feature、Package、Component、Page，或审查目录/文件/import 时读取。

## 1. Monorepo 与前端分层

推荐：

```text
apps/web/src/
├── components/       # 应用级跨 Feature 组合组件
├── config/           # env 等应用配置边界
├── features/         # 业务主体
├── infrastructure/   # 浏览器/HTTP 等明确基础设施，不是垃圾桶
├── layouts/          # App/Page Layout；Header/Sidebar 随 Layout 内聚
├── routing/          # Route Error 等路由级公共实现
├── styles/           # tokens/reset/base/index
├── test/             # test setup
├── router.tsx
└── main.tsx

packages/
├── ui/               # 业务无关 UI Primitive / Design System
└── i18n/             # 国际化基础设施

tests/e2e/            # Playwright 用户流程
```

依赖方向：

```text
packages/ui      packages/i18n
      ↑               ↑
      └──── apps/web / Feature ────┘
```

`packages/ui` 不依赖 apps/web、Feature、Router、业务 Contract、packages/i18n。

## 2. Feature First

```text
features/
└── websites/
    ├── components/
    ├── hooks/
    ├── pages/
    ├── routes/
    ├── services/
    ├── website.types.ts
    ├── website.constants.ts
    └── index.ts
```

目录只在真实职责出现后创建；不要为了模板创建空 `hooks/ services/ routes/`。

禁止预建垃圾桶：

```text
shared/ common/ helpers/ utils/ models/ types/ constants/ misc/
```

只有出现稳定、可解释的架构职责后才允许新增。

## 3. 一组件一目录

独立 React UI Unit：

```text
website-list/
├── website-list.tsx
├── website-list.module.css
└── website-list.test.tsx
```

Page：

```text
pages/websites/
├── websites.page.tsx
├── websites.page.module.css
└── websites.page.test.tsx
```

普通组件/Page 目录不加 `index.ts`。小型内部实现如果没有独立语义/状态/复用/测试价值，留在父文件，不机械拆目录。

组件/Page 的私有样式必须与 Owner 共置，并通过当前目录 `./*.module.css` 引用。禁止为了复用几条样式让子组件/Page 向上引用父目录、祖先目录的 CSS Module。真实公共视觉规则应提升为 Semantic Token、`packages/ui` Primitive 或明确的应用级公共样式合同，不能靠父级 CSS 文件形成隐式耦合。

```text
pages/login/
├── login.page.tsx
└── login.page.module.css
```

## 4. `index.ts` 只表达 Public API

保留：

```text
Feature 根 index.ts    ✅
Package 根 index.ts    ✅
普通组件目录 index.ts  ❌
Page 目录 index.ts     ❌
普通中间目录 index.ts  ❌
```

跨 Feature：

```ts
// 推荐
import { useCurrentUser } from '@/features/authentication'

// 禁止
import { getSession } from '@/features/authentication/services/internal.service'
```

同一 Feature 内部可直接引用真实实现文件。

## 5. 命名规则

核心：**短横线组织业务语义，点号表达技术角色。**

```text
website.service.ts
website.types.ts
website.schema.ts
website.constants.ts
website.mapper.ts
website.dto.ts
website.loader.ts
website-create.action.ts
api.client.ts
websites.page.tsx
website-list.tsx
website-list.module.css
website-list.test.tsx
use-website-selection.ts
```

不推荐：

```text
website-service.ts
website-list.component.tsx
website-selection.hook.ts
websites-page.page.tsx
```

目录统一 kebab-case；Feature 名跟产品领域语言走，不机械追求单复数。

## 6. TypeScript 类型 Local First

只服务当前文件：

```tsx
type WebsiteCardProps = {
  name: string
  status: WebsiteStatus
}
```

Feature 多文件共享才提升：

```ts
// website.types.ts
export type Website = {
  id: string
  name: string
}
```

默认 `type`；只有 Declaration Merging、第三方扩展或明确 interface extension contract 才用 `interface`。不使用 `IWebsite` / `TWebsite` 前缀。

DTO 与 UI Domain Model 分离；DTO 只被一个 Service 用就留 Service 内，多处共用再建 `website.dto.ts`。

## 7. 常量与 Enum

稳定模块常量：

```ts
const DEFAULT_PAGE_SIZE = 20
const MAX_NAME_LENGTH = 100
```

普通局部不可变值仍 camelCase。不要抽 `ONE / ZERO / EMPTY_STRING`。

默认不用 `enum`，禁止 `const enum`。

只需要类型：

```ts
export type WebsiteStatus = 'draft' | 'published' | 'archived'
```

还需要运行时值：

```ts
export const WEBSITE_STATUS = {
  Draft: 'draft',
  Published: 'published',
  Archived: 'archived',
} as const

export type WebsiteStatus =
  (typeof WEBSITE_STATUS)[keyof typeof WEBSITE_STATUS]
```

## 8. Import / Export

类型必须显式：

```ts
import type { Website } from '../website.types'
```

开启 `verbatimModuleSyntax`。默认 Named Export；框架强制 default export 的文件例外。

```text
Local dependency             → relative import
Architecture-level dependency → alias / package import
Cross Feature                → Feature Public API
Cross Package                → Package exports
```

禁止 `../../../../../../` 穿越和穿透 workspace package 源码。Import 排序由 Oxlint/Prettier/import rules 自动处理，不让 AI 手工维护。

## 9. Workspace Source Package

内部 `packages/ui`、`packages/i18n` 直接暴露源码：

```json
{
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" }
}
```

Package 根 `src/` 只保留 Public API/极少数入口文件，具体实现按职责继续分目录；禁止把几十个组件、Contract、Locale helper 全平铺在 `src/`。例如 `packages/ui` 可按 `components/actions/*`、`components/overlays/*` 扩展；新分类只在真实组件类型出现后创建，不预建空目录。

Vite 负责最终 TSX/CSS Modules/JSON bundle；Turborepo 只负责 lint/typecheck/test/build orchestration/cache。内部包不产生无意义 `dist`；真正需要跨仓库/npm 分发时再单独升级成 Library Build。
