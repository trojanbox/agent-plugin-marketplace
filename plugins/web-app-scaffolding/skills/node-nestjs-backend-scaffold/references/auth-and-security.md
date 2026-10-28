# Authentication and Security

用于 Browser 登录、Session、Cookie、CSRF、Authorization、Password、Rate Limit、Helmet/CORS。

## 1. Browser 默认认证

```text
Browser
→ HttpOnly Session Cookie
→ Global SessionAuthGuard
→ AuthService.authenticate()
├─ RedisSessionRepository → Redis Session
└─ AuthRepository        → PostgreSQL 当前用户
```

默认不用 JWT 存 localStorage/sessionStorage；浏览器 JS 不持有认证 credential。

移动端/CLI/Public API/Service-to-Service 若真实存在，另设计 Bearer/OAuth/OIDC；不覆盖 Browser 默认 Session。

## 2. Session Token

生成至少 256-bit 随机 token：

```ts
randomBytes(32).toString('base64url')
```

Cookie 保存 raw token；当前 Fullstack 的 Redis key 采用 `SHA-256(token)`。Fullstack Session 存 userId、csrfTokenHash，Redis Key 的 TTL 控制绝对过期；不保留 PostgreSQL Session 技术表。

当前 Fullstack 通过 Redis TTL 检查过期、DEL 撤销 Session，每次认证仍从 PostgreSQL 验证用户启用/未软删除；登录及注册都新生成随机 Session Token。

Absolute TTL 由 typed config 管理；idle timeout 仅真实需要时增加。

## 3. Cookie

Production 默认：

```text
HttpOnly
Secure
SameSite=Lax
Path=/
No Domain
```

HTTPS production 优先 `__Host-session`。开发 HTTP 可用普通 cookie name；Cookie 处理集中在认证边界：当前 Fullstack 由 AuthController.writeSessionCookies 统一设置，logout 显式清除；其他业务 Controller 不复制 Cookie 逻辑。

## 4. CSRF

Cookie Session 的 POST/PUT/PATCH/DELETE 默认必须 CSRF 验证；GET/HEAD/OPTIONS 不要求。

当前 Fullstack 的 SessionAuthGuard 校验随机 CSRF Token 的 SHA-256 摘要，前端 mutation 携带 `X-CSRF-Token`；不预装未使用的 `csrf-csrf`。SameSite 是 defense-in-depth，不代替 CSRF。

## 5. Default Deny

绝大多数 API 需要登录时用 `APP_GUARD` 全局 AuthGuard：

```text
默认 authenticated
@Public() → 明确匿名例外
```

Login/Register/Health 等显式 Public。不能为了修 401 随手加 `@Public()`。

## 6. Authentication / Authorization 分离

当前 Fullstack 模板只有身份认证，没有 PermissionGuard、RBAC、租户隔离或 `@RequirePermissions`。以下示例是将来具体业务确实需要权限校验时的约束，而非已实现的功能。

```text
SessionAuthGuard → 你是谁
PermissionGuard  → 你能做什么
```

避免 AdminGuard/WriteGuard/EditorGuard 等无限业务 Guard。

Controller 推荐：

```ts
@RequirePermissions('website.update')
```

Permission 用 `as const` + string union，不用 enum。Role 只负责映射 Permission 集合；Route 依赖 capability，不重复 role list。

前端拿 permission 只改善 UX；服务端必须重新授权。

## 7. Resource Scope

Permission 只能证明一般能力；具体资源必须在 query 中带 scope：

```ts
websiteRepository.findById({
  websiteId,
  tenantId: principal.tenantId,
})
```

禁止 `findById(id)` 查出后再在内存判断 tenant。Authorization Scope 进入 Repository Query，防止 IDOR/跨租户泄漏。

## 8. Password Policy / Hash

默认密码：min 15，max 256；允许空格/Unicode/各种字符，不强制大小写/数字/特殊符号 composition，不静默 truncate，不定期强制改密码。

Hash 使用 Node `crypto.scrypt`：

```text
N = 32768 (2^15)
r = 8
p = 3
keyLength = 64 bytes
salt >= 16 random bytes
maxmem >= 128 MiB
```

保存自描述格式，例如 `scrypt$32768$8$3$<salt>$<hash>`。当前 Fullstack 只接受固定 scrypt 参数，没有自动 rehash；不能把未来参数升级逻辑当成现有能力。

不存在用户仍执行 dummy derivation；登录统一返回“邮箱或密码错误”，降低 user enumeration/timing 差异。

当前 Fullstack 已配置登录/注册 Redis 请求限流，但尚无独立的 scrypt 并发配置；二者并不等价。

## 9. Rate Limit

当前 Fullstack 的 login/register 使用 Redis Lua 原子窗口计数 + TTL；独立后端可依据真实部署使用 Nest 官方 `@nestjs/throttler`。

Redis 计数可跨多个 API 实例共享；Redis 不可用时不降级为不限流。生产要限制可信代理 IP、配置 noeviction 和监控。

## 10. HTTP Security

默认 `helmet()`。Same-Origin 优先，Production 不宽泛开放 CORS；如果确需跨 Origin，使用明确 allowlist 并重新核对 credentials/SameSite/CSRF/Origin。

`/internal/api/v1/*` 不默认复用 Browser Cookie 做 service auth；多服务真实出现后再选 workload identity/mTLS/short-lived service token。
