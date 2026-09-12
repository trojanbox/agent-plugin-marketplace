# Review Gates

在完成新页面/Feature、迁移现有前端、提交代码或做整体审计时读取。详细规则以其它 references 为准；这里用于最终 Gate。

## 1. Architecture

- 业务是否按 Feature 内聚？
- Page 是否主要负责组合与编排？
- 是否出现 `shared/common/utils/types/constants/misc` 垃圾桶？
- 独立 UI Unit 是否一组件一目录？私有 CSS Module 是否与 Owner 共置且只从当前目录引用？
- 普通组件/Page 是否增加无意义 `index.ts`？
- 应用布局是否进入 `layout/`，基础设施是否进入明确 `infrastructure/*`，是否重新出现含义模糊的 `shell/`、`lib/`？
- Package `src/` 是否只保留 Public API/入口，具体 Contract/i18n/UI 是否按职责继续分目录？
- 跨 Feature 是否只经 Feature Public API？
- 跨 Package 是否只经 Package exports？
- 内部 Package 是否无理由增加 bundler/dist？

## 2. Naming / Types / Imports

- 目录是否 kebab-case？
- 文件是否“业务语义 kebab-case + `.role` 技术后缀”？
- 是否仍出现 `website-service.ts`、`.component.tsx`、`.hook.ts`？
- 类型是否 Local First？Feature 共享类型才进入 `*.types.ts`？
- DTO 是否和前端 Domain Model 分离？
- 是否默认 `type`，避免无理由 interface 混用？
- 是否出现 `IUser/TUser` 前缀？
- 是否默认不用 enum、禁止 const enum？
- Type import 是否 `import type`？
- 是否 Named Export？
- 是否有大量 `../../../../` 或穿透 Feature/Package 内部？

## 3. React Component / State

- 组件拆分是否基于职责，而非代码长度？
- 是否存在万能 `data/config/options` Props？
- Variant 是否开始切换核心职责/主要 DOM？
- 结构变化是否更适合 Composition？
- Component/Hook 是否保持纯？
- State 是否放最近 Owner？
- 是否把可计算值重复存 State？
- 是否为少传几层 Props 过早建立 Context？
- 是否无真实需求引入 Global Store？
- Hook 是否真的包含 React 语义？
- 是否用 Effect 模拟事件或维护派生 State？

## 4. CSS / Visual / Token

- 静态视觉是否进入 CSS Module？
- 是否出现随机 Hex、spacing、radius、shadow？
- 业务颜色是否优先 Semantic Token？
- 是否用 `:global` / `!important` 绕过边界？
- 选择器是否镜像 DOM 深层结构？
- 是否出现 Card 套 Card、过度 Shadow/Border/Gradient？
- 页面是否通过 Whitespace/Typography/Surface 建层级？
- Control 密度是否统一，默认 32/36/40？
- Primary Action 是否稀缺？
- Light/Dark 是否都成立？

## 5. UI / Accessibility

- Complex primitive 是否通过 `packages/ui` 封装 Radix，而非 Feature 直连？
- 普通图标是否来自 Lucide？是否混用 Emoji/Unicode/第二套库？
- Icon-only control 是否有 accessible name？
- 是否 Semantic HTML First？
- Form Control 是否有关联 Label？
- Keyboard/Focus 是否完整且 `focus-visible` 可见？
- Error/Warning 是否不只依赖颜色？
- 是否尊重 reduced motion？

## 6. Routing / Data / HTTP

- Route 首屏数据是否应该 loader？路由 submit 是否应该 action？
- Loader/Action 是否与 Feature 内聚？
- Page/Component 是否直接散落 `fetch()`？
- 无实例状态 Service 是否使用静态可继承类？Service 是否错误依赖 React/Toast/navigate/DOM？
- HTTP 是否收敛到 `infrastructure/http/ApiClient` 静态类？是否检查 `response.ok`？
- `request.signal` 是否能传到底层？
- 是否无理由使用 Axios、Interceptor、Retry、固定 Timeout？
- UI 是否直接消费 API DTO？
- Error / Loading 是否属于真实 Owner？

## 7. i18n / Theme / Config

- 用户可见自然语言是否走 i18n？
- namespace 是否按 Feature/领域组织？
- `packages/ui` 是否错误依赖 i18n？
- 日期/金额/数字是否 Locale-aware？
- Missing Translation 是否开发可见？
- Theme 是否支持 light/dark/system 且避免首屏闪烁？
- 是否只有 env.config 读取 `import.meta.env`？
- Client Env 是否包含 Secret？

## 8. Security

- 是否把 JWT/Session/Refresh Token 存 Web Storage？
- 是否出现 `dangerouslySetInnerHTML/innerHTML/eval/new Function`？
- 富文本是否集中 Sanitization？
- 外部 URL 是否验证协议/来源？
- 前端权限是否被误当真实授权？
- 日志是否泄漏敏感信息？
- 是否存在只翻译代码的 routine comments、过期注释或无上下文 TODO？
- 是否动态注入未经治理的第三方 Script？

## 9. Performance / Assets / Responsive

- 新业务 Route / 大 Feature 是否 lazy？
- 是否把小组件机械 lazy？
- 是否有 lazy waterfall？
- 非首屏图片是否 lazy，LCP 图片是否 eager？
- Safari 13.1 是否有图片 lazy fallback？
- 图片是否声明 width/height/aspect ratio、合理 srcset/sizes？
- WebP/AVIF 是否有 JPEG/PNG fallback？
- 普通资源是否进入 Vite Asset Graph？
- 是否无理由远程字体 / Icon Font / SVGR？
- 普通布局是否用 CSS，而非 window.innerWidth state？
- 是否无依据 memoization / React Compiler？

## 10. Testing

- Component Test 是否测试用户可观察行为？
- 是否优先 role/label/text query？
- 是否依赖大型 Snapshot 或 data-testid？
- E2E 是否按用户流程而非组件组织？
- 核心 E2E 是否真实 Frontend + Backend + Test DB？
- Mock 是否只用于异常/外部依赖？
- 每条 E2E 是否独立并自行准备状态？
- 是否用固定 sleep 掩盖异步问题？
- CI 是否保留 Trace/Report 等证据？

## 11. Completion Claim

只有真实执行对应验证后才能说“通过”。至少报告：

```text
lint: pass/fail/not-run
typecheck: pass/fail/not-run
unit/component tests: pass/fail/not-run
e2e: pass/fail/not-run
build: pass/fail/not-run
```

未运行必须明确说明，不以“看起来没问题”替代证据。
