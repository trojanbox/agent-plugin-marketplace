# Workspace 与共享 Contract 边界

只在任务同时涉及 Web/API/共享数据模型时读取。

## 1. 默认 Monorepo

```text
apps/
├── web/
└── api/
packages/
├── contracts/
├── i18n/
└── ui/
tests/
└── e2e/
```

不要创建 `packages/backend-core`、`packages/frontend-core`、`packages/common` 作为预防性抽象。

## 2. `packages/contracts` 的进入 Gate

适合进入：

- HTTP request/response Zod Schema；
- 稳定 Error Code；
- 分页/Envelope 基础合同；
- 明确跨应用 event/command serialized payload。

禁止进入：

- Drizzle Table/Row；
- Repository input/output implementation type；
- Nest provider/token；
- React component props/local state；
- 仅单侧使用的 helper/type。

判断：**两个应用都需要理解同一个序列化边界，才共享。**

`packages/contracts/src/` 根只保留 Public API；Contract 按功能/领域分目录，公共 Envelope/Error 单独归入 `common/`，禁止所有 Schema/Type 长期平铺在一层：

```text
packages/contracts/src/
├── common/
│   └── api.contract.ts
├── authentication/
│   └── authentication.contract.ts
├── catalog/
│   └── item.contract.ts
└── index.ts
```

不为了只有一个文件的假想领域预建目录；一旦存在多个真实 Contract 领域，就按上述边界组织。

## 3. 单一 API 合同

推荐：

```text
packages/contracts
  ↓ shared Zod schema/type
apps/api Controller route schema
  ↓
ApiSuccess / ApiFailure
  ↓
apps/web api.client.ts / feature service
```

前端不重新手写：

```ts
type CreateWebsiteRequest = { ... }
```

如果同名 Schema 已经存在于 contracts。

## 4. Feature Ownership

前端：页面、交互状态、浏览器数据生命周期。

后端：业务规则、权限、事务、持久化。

共享 Contract 只描述“跨线传输什么”，不拥有任一侧业务实现。

## 5. Auth 边界

默认 same-origin：

```text
web → /api/v1/*
```

Browser credential 保存在 HttpOnly Cookie，前端 mutation 发送 CSRF token。不要为了本地开发方便把 Token 复制进 localStorage。

## 6. 错误消费

前端机器判断使用稳定 `error.code`；产品文案通过前端 i18n 映射。后端 `message` 只是安全 fallback，不作为前端逻辑分支。

## 7. 版本与兼容

普通 Monorepo 同步发布时，不默认维护 v1/v2 双份 DTO。只有真实外部兼容窗口存在时才保留版本化协议，并写退出条件。
