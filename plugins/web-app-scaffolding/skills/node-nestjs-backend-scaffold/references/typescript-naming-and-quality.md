# TypeScript, Naming and Quality

用于文件/目录命名、Type/Constant、Import、ESM、Oxlint、Prettier 与静态边界。

## 1. 命名

业务语义 kebab-case + 技术角色点后缀：

```text
website.module.ts
website.controller.ts
website.service.ts
website.repository.ts
website.schema.ts
website.config.ts
session-auth.guard.ts
api-envelope.interceptor.ts
api-exception.filter.ts
request-context.middleware.ts
external-api.client.ts
```

多词：`website-publishing.service.ts`、`password-hash.service.ts`。

不使用 `website-service.ts`、`WebsiteController.ts`、`website_repository.ts`。

目录 kebab-case。Role 目录只在真实有内容时创建，不预建空结构。

## 2. Type / Constant Local First

一个文件使用的 type/constant 留当前文件；同 Feature 多处共享再提升 `website.types.ts` / `website.constants.ts`；serialized 跨应用 contract 进入 `packages/contracts`。

默认 `type`，`interface` 只在 declaration merging/第三方 extension 等确需语义时用。不用 `IUser/TUser`。

业务 `enum` 默认不用；`const enum` 禁止。只需类型用 string union，需要 runtime value 用 `as const` object + inferred union。

稳定模块常量 `UPPER_SNAKE_CASE`；普通局部不可变值 camelCase。

## 3. TypeScript

至少：

```json
{
  "strict": true,
  "verbatimModuleSyntax": true,
  "noUncheckedIndexedAccess": true,
  "useUnknownInCatchVariables": true,
  "forceConsistentCasingInFileNames": true
}
```

- type-only dependency 用 `import type`；
- `any` 默认禁止，不可信输入用 `unknown` + Zod/type guard；
- `@ts-ignore` 禁止，真实 upstream 类型缺陷才局部 `@ts-expect-error -- reason`；
- non-null assertion 默认避免；
- Node built-in 使用 `node:`；
- 后端默认 ESM，不维护 CJS+ESM 双 build。

## 4. Export / Import

默认 Named Export。Config 等工具惯用/要求 default export 可例外。

同 Module 附近文件用 relative import；跨架构边界走 Module public API / package exports。跨 Feature deep import Repository 默认禁止。

不要为每个目录建 barrel `index.ts`；只在真实 package/feature public facade 使用。

不建立 `common/shared/utils/helpers/models/constants/misc` 全局垃圾桶。

## 5. Oxlint + Prettier

跟随当前 Nest 官方新项目工具链：

```text
Oxlint → correctness / type-aware / import / test quality
Prettier → formatting
TypeScript compiler → type correctness
```

CI 分开运行 `lint` + `typecheck`。

在当前 TypeScript 兼容时启用 type-aware lint，至少关注：

```text
typescript/no-floating-promises
typescript/no-misused-promises
import/no-cycle
no-restricted-imports
unused/unsafe type rules
Vitest focused test rules
```

生产源码 `console.*` 默认禁止；业务目录直接 `process.env` 应尽可能通过 lint/import rule 自动拦。

## 6. Boundary Rules

自动规则优先覆盖稳定可表达的边界：

```text
apps/web 不 import apps/api
apps/api 不 import apps/web
production source 不 import tests/**
非 config/tool 边界不读 env helper
跨 package 不穿透 src/
```

Feature-private Repository 规则如果用 glob 会极度脆弱，宁可结合 Module wiring/Code Review，不为 100% 静态自动化造复杂 lint DSL。

## 7. Disable / Dead Code

Oxlint disable 只允许局部精准：

```ts
// oxlint-disable-next-line <rule> -- reason
```

不要文件/目录大范围 disable；无效 suppress 应清理。

删除 unused private code、commented-out old implementation、debug branch、无消费者 export。Git 保存历史。

TODO 要可执行，长期项关联 Issue/退出条件：

```ts
// TODO(#123): remove compatibility path after client v2 rollout
```

CI check-only，warning 默认 0，不自动 fix 后假装 green。
