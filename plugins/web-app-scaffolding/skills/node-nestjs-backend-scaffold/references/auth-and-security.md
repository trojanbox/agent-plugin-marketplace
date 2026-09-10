# Authentication and Security

用于 Browser 登录、Session、Cookie、CSRF、Authorization、Password、Rate Limit、Helmet/CORS。

## 1. Browser 默认认证

```text
Browser
→ HttpOnly Session Cookie
→ Global SessionAuthGuard
→ AuthService
→ AuthRepository
→ PostgreSQL auth_sessions
```

默认不用 JWT 存 localStorage/sessionStorage；浏览器 JS 不持有认证 credential。

移动端/CLI/Public API/Service-to-Service 若真实存在，另设计 Bearer/OAuth/OIDC；不覆盖 Browser 默认 Session。

## 2. Session Token

生成至少 256-bit 随机 token：

```ts
randomBytes(32).toString('base64url')
```

Cookie 保存 raw token；DB 只保存 `SHA-256(token)`。基础字段：id、user_id、token_hash、created_at、last_seen_at、expires_at、revoked_at。

Session authenticate 必须检查 expiry/revoke/user active state；logout 立即 revoke；登录/注册自动登录/权限提升时 rotate，防 fixation。

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

HTTPS production 优先 `__Host-session`。开发 HTTP 可用普通 cookie name；Cookie 拼装集中在 Auth Infrastructure，Controller 不手写字符串。

## 4. CSRF

Cookie Session 的 POST/PUT/PATCH/DELETE 默认必须 CSRF 验证；GET/HEAD/OPTIONS 不要求。

Nest Express 场景按官方安全文档优先 `csrf-csrf`。前端 mutation 携带稳定 CSRF header。SameSite 是 defense-in-depth，不代替 CSRF。

## 5. Default Deny

绝大多数 API 需要登录时用 `APP_GUARD` 全局 AuthGuard：

```text
默认 authenticated
@Public() → 明确匿名例外
```

Login/Register/Health 等显式 Public。不能为了修 401 随手加 `@Public()`。

## 6. Authentication / Authorization 分离

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

保存自描述格式，例如 `scrypt$32768$8$3$<salt>$<hash>`，未来 work factor 提升后登录成功自动 rehash。

不存在用户仍执行 dummy derivation；登录统一返回“邮箱或密码错误”，降低 user enumeration/timing 差异。

scrypt 并发通过 typed config 限制，防 CPU/内存耗尽。

## 9. Rate Limit

敏感入口默认 Nest 官方 `@nestjs/throttler`：login/register/password reset 等更严格，可组合 peer/IP + account identifier。

默认 memory store 只保护单实例；多 replica 若需要 cluster-wide protection，使用 Gateway/WAF/shared storage。不要为未来扩容提前装 Redis。

## 10. HTTP Security

默认 `helmet()`。Same-Origin 优先，Production 不宽泛开放 CORS；如果确需跨 Origin，使用明确 allowlist 并重新核对 credentials/SameSite/CSRF/Origin。

`/internal/api/v1/*` 不默认复用 Browser Cookie 做 service auth；多服务真实出现后再选 workload identity/mTLS/short-lived service token。
