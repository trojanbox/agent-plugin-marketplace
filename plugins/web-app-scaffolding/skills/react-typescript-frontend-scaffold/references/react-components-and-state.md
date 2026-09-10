# React Components & State

在拆组件、设计 Props、写 Hook/Context、处理局部交互和 DOM 能力时读取。

## 1. 组件按职责拆，不按行数拆

独立组件的高信号条件：

1. 有明确独立语义；
2. 有独立状态/交互；
3. 有独立测试价值；
4. 已经或明确需要复用。

推荐：

```tsx
export function WebsitesPage() {
  return (
    <main>
      <WebsiteHeader />
      <WebsiteFilter />
      <WebsiteList />
    </main>
  )
}
```

反例：只因为 5 行 JSX 就拆 `TitleIcon`、`TitleText`。也反对一个 Page 同时承担请求、筛选、表格、Dialog、表单、Toast 和数百行 JSX。

原则：**先局部；形成独立职责再抽离。**

## 2. Component / Hook 保持纯

同样 Props/State/Context 产生同样渲染；输入视为只读。

推荐：

```tsx
export function UserCard({ name }: { name: string }) {
  return <div>{name}</div>
}
```

反例：Render 中 `globalUsers.push(user)`、`cache.set(...)`、写 DOM 或发请求。

副作用放明确事件处理，或真正用于同步外部系统的 Effect。

## 3. Props 显式、语义化、最小化

推荐：

```ts
type UserCardProps = {
  name: string
  avatarUrl?: string
  disabled?: boolean
  onEdit?: () => void
}
```

反例：

```tsx
<UserCard data={data} config={config} options={options} />
```

避免隐藏真实依赖的万能数据袋。

命名：

```text
Boolean: disabled/loading/selected/isOpen/isActive/isReadonly/hasError/canEdit/shouldRefresh
Callback Prop: onClick/onChange/onOpen/onClose/onSubmit/onSelect
Internal Handler: handleClick/handleSubmit/handleSelectionChange
Value: value/defaultValue
```

## 4. Variant 只表达轻量差异

合理：

```tsx
<Button variant="primary" />
<Button variant="danger" />
```

需要警惕：

```tsx
<UserPanel
  mode="edit"
  scene="admin"
  layout="compact"
  behavior="modal"
  renderMode="advanced"
/>
```

当 Props 已经切换核心职责、主要 DOM 或业务流程时，拆成 `UserList / UserDetail / UserEditor`。

## 5. 结构变化优先 Composition

推荐：

```tsx
<PageHeader
  title="网站管理"
  actions={<CreateWebsiteButton />}
/>
```

或：

```tsx
<Dialog>
  <DialogHeader />
  <DialogContent />
  <DialogFooter />
</Dialog>
```

反例：用十几个 `showHeader/showFooter/footerType/showCancel/...` Props 描述整个内部结构。

## 6. State Local First

只属于一个组件：留组件。

```tsx
function SearchBox() {
  const [keyword, setKeyword] = useState('')
  // ...
}
```

兄弟组件共享：提升到最近共同父级。

```tsx
function WebsiteSearchSection() {
  const [keyword, setKeyword] = useState('')

  return (
    <>
      <WebsiteSearchInput value={keyword} onChange={setKeyword} />
      <WebsiteList keyword={keyword} />
    </>
  )
}
```

不要因为“以后可能用到”放 Global Store。

## 7. 不存派生 State

推荐：

```tsx
const fullName = `${firstName} ${lastName}`
```

反例：再建 `fullName` State，然后用 Effect 同步。

同样避免 Props 镜像 State、filter/map 可以直接算出的 State、同一数据多份镜像。

## 8. Context 边界

合理：Theme、Locale、Authentication Session、Feature 内明确跨多层共享的数据。

反例：只因为 Props 要传三层就建 `UserContext / PermissionContext / ProjectContext / ConfigContext`。

默认不预装 Redux/Zustand/MobX。演进顺序：

```text
Local State
→ Closest Common Parent
→ Feature Context/State
→ 真实出现复杂应用状态后再选专门方案
```

## 9. Hook 只在有 React 语义时存在

好 Hook：包含 State、订阅、生命周期、可复用交互。

```ts
export function useWebsiteSelection() {
  const [selectedIds, setSelectedIds] = useState(() => new Set<string>())
  // toggle logic
  return { selectedIds }
}
```

坏 Hook：

```ts
export function useFormatWebsiteName(name: string) {
  return name.trim().toUpperCase()
}
```

这只是普通 `formatWebsiteName()`。

不默认“一请求一个 Hook”；Hook 不是 Service 的别名。

## 10. Effect 使用顺序

```text
Render 能算 → Render
用户事件 → Event Handler
路由级数据 → Loader / Action
真正同步外部系统 → Effect
```

反例：`shouldSave` State + Effect 触发保存；用户点击时直接 `handleSave()`。

## 11. DOM Props / className / Ref

通用 UI Primitive 如果本质封装原生元素，优先继承合理 DOM attributes：

```ts
import type { ComponentPropsWithoutRef } from 'react'

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary'
}
```

Feature 业务组件不默认 `{...rest}` 透传任意 DOM Props。

`className` 可作为 UI Primitive 的外部布局扩展点，但不能依赖它覆盖组件核心视觉合同。

Ref 只在真实需要 `focus()`、DOM 测量、第三方 imperative API 时暴露；不预防性给所有组件加 ref/imperative handle。

## 12. Accessibility 是组件合同

- Semantic HTML First：button 用 `<button>`，链接用 `<a>`，导航用 `<nav>`。
- Icon-only control 必须有 accessible name。
- Form Control 必须有关联 Label；placeholder 不替代 Label。
- Keyboard/Focus 必须可用，`:focus-visible` 清晰。
- ARIA 只补充原生语义缺失，不堆冲突 ARIA。
- 复杂 Dialog/Popover/Select 的焦点和键盘合同交给 `packages/ui` + Radix 封装。
