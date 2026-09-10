# Fullstack Validation 与 Delivery

只在任务涉及跨栈验收、认证链路、Migration 联动或发布准备时读取。

## 1. 最低验证矩阵

```text
Frontend
→ Oxlint + typecheck + Vitest

Backend
→ Oxlint + typecheck + Vitest
→ Repository Integration: real PostgreSQL
→ HTTP Integration: real Nest application

Fullstack critical flow
→ Playwright Browser + real apps/web + real apps/api + real test DB
```

未真实运行的层不能写“通过”。

## 2. Vertical Slice 验收

一个典型资源切片至少核对：

1. shared request/response schema；
2. API validation/auth/permission；
3. Service/Repository persistence；
4. frontend loader/action/service/api client；
5. loading/error/success UX；
6. real DB integration；
7. 关键用户流 E2E。

## 3. Auth / CSRF 联动

E2E 至少覆盖：

```text
login
→ Set-Cookie(HttpOnly)
→ authenticated API
→ CSRF-protected mutation
→ logout
→ session invalid
```

不要通过测试代码手工塞 localStorage token 绕过真实 Browser Contract。

## 4. Migration 与发布顺序

生产：

```text
build
→ controlled db:migrate
→ migration success
→ rollout apps/api
→ rollout/serve apps/web
```

API 进程不在 startup 自动改 Schema。Web 不直接感知 migration ledger。

高风险 Schema change 使用 backward-compatible Expand/Contract，避免新旧 API replica 在滚动发布期间互相破坏。

## 5. Contract Change Review

修改 shared contract 时检查：

- Web 和 API consumers 是否同时更新；
- 是否属于 breaking change；
- 是否有外部消费者；
- OpenAPI 是否同步生成；
- Error code 是否稳定；
- List/detail schema 是否被错误合并；
- Migration 是否真的需要。

## 6. 停止条件

如果某侧技术栈与本 Fullstack Skill 不匹配，不继续设计兼容抽象；切换到对应 stack Skill。当前 Runtime 尚未包含 Java/Python/Go 的这些 Scaffold Skill 时，应明确“尚未实现对应 Skill”，不要凭空扩展其框架合同。
