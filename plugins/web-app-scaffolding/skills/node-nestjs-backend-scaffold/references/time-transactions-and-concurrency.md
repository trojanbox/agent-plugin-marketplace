# Time, Transactions and Concurrency

用于时间/时区、ID、数据库原子性、Retry、Idempotency、Async ownership。

## 1. UTC 与时区

持久化和日志统一 UTC；PostgreSQL 时间优先 `timestamp with time zone`；HTTP 返回 ISO 8601 UTC（`...Z`）。

业务 timezone（用户/租户/门店/账单）保存 IANA identifier，例如 `Asia/Tokyo`，不长期保存 `UTC+8`。

普通时间操作用 Node `Date`，不预装日期库；复杂 calendar/timezone arithmetic 真实出现后再选工具。

## 2. Clock

影响业务规则/TTL/状态转换的“当前时间”通过可注入 Clock：

```ts
class SystemClock { now() { return new Date() } }
```

测试 override。日志/框架内部不要求所有时间都走业务 Clock。

## 3. ID

默认 Node：

```ts
crypto.randomUUID()
```

即 UUID v4，不为了 ID 默认装 uuid/nanoid/ulid。真实需要 sortable/time-ordered/distributed ID 再项目级决策。

可提供小型 `IdGenerator` Foundation Provider 便于测试/替换，但不为它创建 `IdModule`。

## 4. Transaction

Service 定事务边界；Repository 执行 Query。事务尽量短，不跨 external network。

禁止：

```text
BEGIN → DB → HTTP/Email/Storage 等几秒 → DB → COMMIT
```

远程失败与数据库原子性需要显式顺序/补偿；Outbox/Saga/Queue 不默认存在。

## 5. 并发正确性

优先 PostgreSQL：

```text
UNIQUE/CHECK/FK
atomic UPDATE
conditional UPDATE ... WHERE expected state
transaction
row/advisory lock（有明确 invariant 时）
```

不要用进程内 Map/Mutex/boolean flag 保护多实例 DB invariant。

计数/状态转换优先 atomic query，不先 SELECT 到 JS 再写回。

Optimistic version 不默认每表添加；真实 lost-update UX 风险出现时才用 `version`/ETag/updatedAt conditional update。

## 6. Retry

默认关闭。Retry 前必须回答：操作幂等吗、错误 transient 吗、上游允许吗、会重复副作用吗、最大次数/总时间是多少？

允许时 bounded + exponential backoff + jitter + cancellation；尊重 `Retry-After`。

Mutation 没有 Idempotency Contract 时不自动重试，timeout 表示结果未知。

## 7. Idempotency

不为所有 CRUD 加 Idempotency-Key。适用于 payment/order/webhook/at-least-once/不可逆 create 等重复风险。

必须持久化：

```text
scope + idempotency_key UNIQUE
```

不能只在进程内 Map。Webhook 用 provider event id 建 UNIQUE，重复 delivery 安全 acknowledge/返回已有结果。

## 8. Async Ownership

Promise 必须显式 await/return，或明确交给 background owner。没有 Queue/Worker 时，关键业务副作用不能 fire-and-forget。

`void promise.catch(...)` 只用于失败不影响业务正确性的 best-effort 行为，并且错误被观察。

External I/O/DB 必须有 timeout/cancellation；大量并发任务要 bounded concurrency，不 `Promise.all(hugeList.map(...))` 无限制打第三方。

不默认引入 retry/concurrency framework；复杂度真实出现后再选依赖。
