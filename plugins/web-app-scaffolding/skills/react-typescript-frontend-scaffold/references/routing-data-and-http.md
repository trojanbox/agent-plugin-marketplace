# Routing, Data & HTTP

在写 Router、Page、loader/action、Service、Mapper、DTO、apiClient、Loading/Error 时读取。

## 1. 默认数据流

```text
Router loader/action
      ↓
Feature Service
      ↓
api.client.ts
      ↓
HTTP API

Page
├── Feature Components
└── Feature Hooks / local UI state
```

职责矩阵：

| 层 | 做什么 | 不做什么 |
| --- | --- | --- |
| Loader | 路由参数、首屏/路由级读取 | JSX/UI State |
| Action | 路由级 submit/mutation | UI 渲染 |
| Page | 页面组合、消费 route data | 原始 HTTP、底层大组件实现 |
| Service | 业务接口、请求参数、DTO mapping、Domain Error | React State、Toast、navigate、DOM |
| Hook | React State/订阅/交互复用 | Service 的无意义别名 |
| Component | UI、局部 State、事件 | Transport/后端 DTO |
| API Client | Base URL、Headers、credentials、JSON、Abort、HTTP Error | 业务文案/业务 mapping |

## 2. Page 保持薄

推荐：

```tsx
export function WebsitesPage() {
  const websites = useLoaderData<typeof websitesLoader>()

  return (
    <PageLayout>
      <WebsiteHeader />
      <WebsiteToolbar />
      <WebsiteList websites={websites} />
    </PageLayout>
  )
}
```

反例：Page 自己 `fetch`、维护 8 个 state、创建/编辑/删除/发布 handler、Dialog、Form、Toast 和几百行 JSX。

## 3. 路由数据优先 loader/action

首屏/Route 生命周期数据：

```ts
export async function websitesLoader({ request }: LoaderFunctionArgs) {
  return websiteService.list({ signal: request.signal })
}
```

Route mutation：

```ts
export async function createWebsiteAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  return websiteService.create({ name: String(formData.get('name')) })
}
```

不要默认用 `useEffect(() => fetch(...), [])` 模拟路由加载。

局部即时查询、Toggle、Toolbar 操作、与首屏无关请求可以由事件/Hook + Service 处理，不强制全走 action。

Loader/Action 与 Feature 共置，Router 只声明路由。命名遵守：`websites.loader.ts`、`website-create.action.ts`。

## 4. Service 只负责业务数据访问

跨前后端的 serialized contract 优先从 `packages/contracts` 消费。无实例状态的前端 Service 默认使用**可继承的静态类**，避免模块级对象单例难以形成明确扩展点；只有真实存在 per-instance state/config/lifecycle 时才改成实例 Service。

```ts
import type { WebsiteListResponse } from '@app/contracts'

export class WebsiteService {
  protected constructor() {}

  static async list(options?: { signal?: AbortSignal }): Promise<Website[]> {
    const response = await ApiClient.get<WebsiteListResponse>('/websites', options)
    return response.data.list.map(mapWebsiteListItem)
  }
}
```

调用方使用 `WebsiteService.list()`。子类可以继承静态方法并覆盖受保护扩展点；禁止为了“可扩展”创建无状态实例 singleton。Service 不接收 `setState`，不弹 Toast、不 navigate、不读 DOM。

## 5. Serialized Contract 与前端模型分离

HTTP JSON 使用 `camelCase`；数据库 `snake_case` 是后端 Persistence Boundary 内部细节，不应泄漏到浏览器。

```ts
import type { WebsiteListItem } from '@app/contracts'

export type Website = {
  id: string
  name: string
  createdAt: Date
}

function mapWebsiteListItem(dto: WebsiteListItem): Website {
  return {
    id: dto.id,
    name: dto.name,
    createdAt: new Date(dto.createdAt),
  }
}
```

Component 只消费 `Website`；serialized contract 字段变化主要影响 Service/Mapper。若 API 字段已经完全适合 UI，也可以直接消费共享类型，不为了形式机械创建 Mapper。

## 6. HTTP 默认 Native Fetch

唯一边界放在职责明确的基础设施目录：

```text
apps/web/src/infrastructure/http/api.client.ts
```

不使用含义模糊的 `lib/` 作为默认容器，也不默认安装 Axios。

`ApiClient` 使用可继承的静态类，负责 Base URL、Headers、credentials/session、JSON、AbortSignal、HTTP Status、Transport Error；受保护成员只为真实继承扩展点服务。

```ts
export class ApiClient {
  protected constructor() {}

  protected static basePath = '/api/v1'

  protected static async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.basePath}${path}`, init)
    if (!response.ok) throw await createApiError(response)
    return response.json() as Promise<T>
  }

  static get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...init, method: 'GET' })
  }
}
```

Feature/Page/Component 不散落原始 `fetch()`。

## 7. Cancellation / Retry / Timeout

Service 支持 `signal?: AbortSignal`；Router Loader 把 `request.signal` 传到底层。

不把 `AbortSignal.timeout()` 作为基础合同，因为浏览器基线较老。真实需要 timeout 时在 HTTP 边界用 `AbortController + setTimeout`，并 clear timer。

Retry 默认关闭；必须有协议/幂等性依据。Mutation 不机械重试。

无依赖异步任务可 `Promise.all`；有依赖就保持顺序。

搜索建议/快速筛选/路由切换要处理竞态，优先 AbortSignal 或 request identity，避免旧结果覆盖新结果。

## 8. Session / Authentication

默认倾向服务端 `HttpOnly + Secure + SameSite` Cookie Session；认证凭据不长期存 localStorage/sessionStorage/IndexedDB。

如果外部身份系统强制 Bearer Token，集中在 auth/apiClient 边界，不渗透 Feature Service。

## 9. Loading / Error Ownership

```text
Route 首屏失败 → Route Error Boundary
Field Validation → Field/Form
局部保存失败 → Operation Owner
Transport Error → apiClient 标准化
Domain Error → Feature Service 标准化
```

Loading 同理：Route Loading、Button/Form Loading、List Loading 跟真实 Owner 走；禁止一个 Global Loading 控制整个应用。

不要所有 catch 都 `toast('操作失败')`。能原位置解释优先 inline；短暂成功确认才适合 Toast。

## 10. 文件上传下载

基础能力继续 Web Platform：

```text
Upload → FormData + fetch
Download → Response / Blob / URL
```

进度、断点续传、流式大文件等真实出现后再选专项方案。
