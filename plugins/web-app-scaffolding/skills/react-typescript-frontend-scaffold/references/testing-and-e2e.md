# Testing & E2E

在新增测试、设计测试层级、写 Playwright、Fixture、测试数据库或排查测试脆弱性时读取。

## 1. 默认测试分层

```text
Unit / Component
→ Vitest + React Testing Library

E2E
→ Playwright Test
```

Component Test 与实现共置：

```text
website-list/
├── website-list.tsx
├── website-list.module.css
└── website-list.test.tsx
```

E2E 固定：

```text
tests/e2e/
├── authentication/
├── websites/
├── publishing/
├── fixtures/
├── helpers/
└── error-scenarios/
```

E2E 按用户流程/业务能力组织，不按 Button/Dialog/List 组件组织。

## 2. Component Test 测用户可观察行为

推荐：

```ts
expect(screen.getByRole('button', { name: '保存' })).toBeDisabled()
```

避免依赖内部 state、CSS class、DOM 层级。

Query 优先：

```text
getByRole
getByLabelText
getByText
```

`data-testid` 只在没有合理语义查询时补充。

Snapshot 不作为主要策略；只有序列化结果本身就是合同且人工 Review 有价值时使用。

不设机械覆盖率数字；关注关键行为、边界、loading/error/disabled、Mapper/Service、loader/action、Accessibility Contract。

## 3. Playwright 默认浏览器

```text
Chromium
Firefox
WebKit
```

Playwright 当前浏览器版本不等同于产品最低 Browser Contract。Chrome 80/Safari 13 等历史精确版本兼容性仍由 Browserslist/PostCSS/Vite 约束；不默认引入 BrowserStack/Sauce Labs 真机矩阵。

## 4. 核心 E2E 跑真实链路

```text
Browser
→ Real Frontend
→ Real Backend
→ Dedicated Test Database
```

关键流程：认证、创建/编辑/删除、发布、权限、数据持久化、跨页面流程。

“创建网站后列表可见”应真实覆盖前端 Route/Action、API Client、Backend、DB Write/Read、Loader、UI Assertion。

不允许把核心业务 API 全部 Mock 后仍把测试当核心 E2E。

## 5. Mock 只用于受控异常 / 外部依赖

合理：后端 500、超时、网络中断、第三方失败、极难稳定制造的异常、外部系统无法在 CI 运行。

```ts
await page.route('**/api/websites', async (route) => {
  await route.fulfill({ status: 500, json: { message: 'Internal Server Error' } })
})
```

这验证的是 Frontend 对受控条件的反应，不替代真实链路 E2E。

## 6. 独立 Test Database

禁止默认使用开发库、生产库、长期共享脏测试库。

测试库必须使用真实 Schema / Migration / Constraint / Persistence Behavior。

数据库具体实现、启动、reset 策略在后端 Skill 中定；“独立 Test DB”是固定合同。

## 7. Fixture / API 准备前置状态

允许用 API/Fixture 快速准备非测试目标数据：

```ts
test('用户可以编辑网站', async ({ page, request }) => {
  const website = await createWebsiteFixture(request)
  await page.goto(`/websites/${website.id}`)
  // 真正被验证的“编辑”通过浏览器完成
})
```

原则：**前置状态可走 API，真正被测业务行为必须走浏览器。**

## 8. 测试必须独立

禁止：

```text
Test A 创建用户
→ Test B 依赖 A
→ Test C 删除 A
```

要求：

```text
Each Test
→ Prepare Own State
→ Execute User Flow
→ Assert Result
→ Cleanup / Isolation
```

可单独运行、可并行、不依赖顺序。

数据隔离可通过 worker namespace、测试自清理、suite 前重置 DB、测试 seed/fixture；不得依赖“环境刚好干净”。

## 9. E2E 生命周期

```text
Prepare Test DB
→ Migrations
→ Start Backend
→ Start Frontend
→ Fixture Data
→ Playwright
→ Trace/Report
→ Cleanup
```

Playwright `webServer` 或项目脚本可启动前后端。

CI 失败保留 Trace、Screenshot/Report 等诊断产物。

## 10. Locator / Waiting

优先用户语义：`getByRole/getByLabel/getByText`。

禁止固定 `sleep(2000)` 掩盖异步；等待真实可观察条件或框架 locator/assertion。

## 11. E2E Review Gate

- 是否真的是用户流程而非组件测试？
- 核心流程是否连接真实后端/DB？
- 是否为方便而过度 Mock？
- 当前测试是否自行准备状态？
- 是否依赖其他测试结果？
- 真正被测行为是否通过浏览器？
- Test DB 是否隔离？
- 是否通过固定 timeout/sleep 掩盖问题？
- Locator 是否语义化？
- CI 失败是否有 Trace 等证据？
