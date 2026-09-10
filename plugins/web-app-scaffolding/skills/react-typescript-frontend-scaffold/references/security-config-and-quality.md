# Security, Config & Code Quality

在处理 Env、认证、外部 URL、HTML、TypeScript/Oxlint、依赖引入、注释、废弃代码时读取。

## 1. Env / Config 单一边界

只有：

```text
apps/web/src/config/env.config.ts
```

直接访问 `import.meta.env`。业务代码只消费 typed `env`。

客户端公开变量统一 `VITE_PUBLIC_*`：

```env
VITE_PUBLIC_API_BASE_URL=https://api.example.com
VITE_PUBLIC_APP_NAME=Example
```

浏览器 Env 全部视为公开信息，绝不放 DB 密码、Private API Key、OAuth Client Secret、Signing Secret、服务端 Token。

Required Config 启动时 fail fast；默认用少量 `requiredString/parseBoolean/parseNumber`，不为了几个 Env 安装 Zod。维护 `.env.example`，私有 `.env.local` gitignore。

## 2. Authentication / Web Storage

Session ID、Access/Refresh Token、JWT 等认证凭据默认不长期存：

```text
localStorage
sessionStorage
IndexedDB
```

默认倾向服务端 `HttpOnly + Secure + SameSite` Cookie Session。外部身份系统确实强制浏览器 Token 时另做专项安全设计。

Web Storage 读取的数据一律视为不可信输入，不作为授权安全边界。

前端隐藏按钮只是 UX；后端必须做真实授权。

## 3. XSS / HTML

普通不可信文本依赖 React 转义：

```tsx
<p>{userProvidedText}</p>
```

默认禁止：

```text
dangerouslySetInnerHTML
innerHTML
outerHTML
document.write
eval
new Function
```

真实富文本 HTML 必须：明确来源 + 集中 Sanitizer + 后续不再不安全修改 + XSS 测试。需要时优先成熟 Sanitizer；没有真实需求不预装。

## 4. URL / 外部资源

不可信 URL 进入 `href/src/window.open/iframe` 前验证协议/来源。默认拒绝 `javascript:`、高风险 `data:` 等可执行 URL。

新窗口：

```tsx
<a href={url} target="_blank" rel="noopener noreferrer">...</a>
```

第三方 Script/CDN 不动态随手注入；Analytics/支付/地图等真实需求要明确来源、加载时机和安全策略。

CSP/Trusted Types 属于部署增强层，后端/部署 Skill 再定，不在纯前端硬编码一套无法适配所有环境的 Header。

## 5. TypeScript Quality Gate

默认至少：

```json
{
  "compilerOptions": {
    "strict": true,
    "verbatimModuleSyntax": true,
    "noUncheckedIndexedAccess": true,
    "useUnknownInCatchVariables": true
  }
}
```

`any` 默认禁止；第三方边界确需时必须局部、有原因。

禁止 `@ts-ignore`；已知上游类型问题可：

```ts
// @ts-expect-error -- upstream type does not expose xxx
```

默认避免 non-null assertion：

```ts
const root = document.getElementById('root')
if (!root) throw new Error('Root element was not found')
```

不要 `const root = ...!`。

项目统一使用 Oxlint + Prettier：Oxlint 负责 correctness/type-aware/import/React/Vitest 质量规则，Prettier 负责纯格式；不维护第二套 Linter。Oxlint disable 必须局部、精确到 rule 并写原因，禁止文件/目录级大范围关闭规则。

## 6. 依赖引入 Gate

新增依赖前依次问：

```text
Web Platform / JS 标准库能否解决？
→ 项目已有依赖能否解决？
→ 十几行稳定代码能否自己实现？
→ 问题是否复杂到值得新依赖？
```

合理依赖：复杂且容易出错的标准问题、安全/国际化/时区、浏览器复杂行为、真实大量复用。

不为了 groupBy、字符串转换、简单布尔逻辑等小工具引入 mega utility library。

当前默认明确不引入：Tailwind/SCSS/CSS-in-JS/Axios/Global Store/Form Library/Visual Regression Framework/外部视觉 UI System。

Radix、Lucide、i18next、Playwright 是已确认例外。

## 7. 注释 / TODO

注释解释：为什么、业务不变量、外部约束、非直观兼容原因、workaround 退出条件。

推荐：

```ts
// 删除后存在短暂最终一致性，保持当前列表直到 loader revalidation。
```

反例：

```ts
// 设置 loading 为 true
setLoading(true)
```

TODO/FIXME 必须有上下文；长期技术债关联 Issue。禁止 `// TODO fix later`。

## 8. 删除 / 兼容代码

确认旧实现不再属于合同后直接删除。

不长期保留：

```text
old/ legacy/ v2/ temp/
xxx-old.ts
xxx-new.ts
大段 commented-out code
```

真正外部兼容合同才保留 Adapter/Compatibility Layer，并要求：兼容对象明确、边界集中、有退出条件、不渗透整个 Feature。

## 9. 日志

不输出 token、password、完整敏感 payload。生产日志不能泄漏认证凭据、隐私数据和内部安全信息。

## 10. Review Gate

- 是否只有 env.config 读取 import.meta.env？
- 客户端 Env 是否含 Secret？
- 是否把认证凭据存 Web Storage？
- 是否出现 raw HTML / dangerous DOM sink？
- 外部 URL 是否验证？
- 前端权限是否被误当真实授权？
- 是否引入 any/@ts-ignore/滥用 `!`？
- 是否为小问题新增大依赖？
- 注释是否只是在翻译代码？
- 是否保留无合同价值的 legacy/old/v2 代码？
