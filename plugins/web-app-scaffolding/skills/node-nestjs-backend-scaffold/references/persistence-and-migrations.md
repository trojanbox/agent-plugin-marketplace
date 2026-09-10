# Persistence and Migrations

用于 PostgreSQL、Drizzle、Repository、Schema、Mapping、Transaction 与 Migration 生命周期。

## 1. 默认持久化栈

```text
PostgreSQL + Drizzle ORM + Drizzle Kit
```

普通 Feature Persistence：**Query Builder First**。Raw SQL 只用于 Query Builder 无法清晰表达或 PostgreSQL 原生能力：Migration DDL、advisory lock、特殊 fencing/lock、经测量的极端查询等。

Raw SQL 必须参数化、有理由、有测试，并留在 Repository/Database Infrastructure 边界。

## 2. 命名与映射

PostgreSQL 物理标识：lower snake_case。

```text
website_id
created_at
tenant_id
```

TypeScript / DTO / HTTP JSON：camelCase。

```ts
{
  websiteId: string
  createdAt: Date
  tenantId: string
}
```

Drizzle Schema 显式映射：

```ts
export const websites = pgTable('websites', {
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
})
```

snake_case 不泄漏到 Service/Controller；raw DB row 不是公共 Application Contract。

## 3. Schema 所有权

物理 schema 集中：

```text
apps/api/src/database/schema/
├── auth.schema.ts
├── website.schema.ts
└── index.ts
```

按 Feature 拆文件，便于 FK/Index/Migration 工具统一扫描。业务含义仍归对应 Feature；Feature Query 继续归其 Repository。

不要把所有 CRUD 收回“万能 DatabaseService”。

## 4. Constraint 是最终一致性防线

稳定不变量合理使用：

```text
NOT NULL
UNIQUE
FOREIGN KEY
CHECK
Transaction
Index
```

Service 预检查只改善 UX，不替代 DB Constraint。并发唯一性不能靠：

```text
exists() → if false → insert()
```

而没有 UNIQUE。

Constraint error 在 persistence/application 边界转稳定业务错误，不把 pg/SQLSTATE 直接返回 HTTP。

## 5. Index 基于真实 Query Pattern

新增 Index 对应真实 Filter/Join/Sort/Unique/性能证据。复合 Index 列顺序跟真实查询一致；不为每列机械建 Index。

List/Count 必须共享相同 filter predicate，`totalRows` 表示当前授权 scope + filter 下真实总数。

避免 N+1；列表优先显式 projection，不无脑返回大字段。

## 6. Transaction

Service 定义原子边界，Repository 使用当前 transaction executor。

事务尽量短，只包数据库原子行为；事务内禁止等待外部 HTTP、Email、Storage、长 CPU 工作。

数据库与外部系统无法由一个 PostgreSQL Transaction 原子覆盖。简单项目明确顺序/补偿；Outbox/Queue/Saga 只有真实可靠异步需求时再设计。

## 7. Migration 目录与工具

```text
apps/api/drizzle.config.ts
apps/api/drizzle/
apps/api/src/database/schema/
```

正常流程：

```text
修改 Schema
→ drizzle-kit generate --name=<semantic-name>
→ 人工 Review SQL
→ drizzle-kit check
→ 在 dev/test DB migrate
→ Integration Test
→ 提交 Schema + Migration + Tests
```

共享环境不使用 `drizzle-kit push` 代替 Migration Ledger。

## 8. Production Migration

**API 启动永远不自动 migrate。**

部署：

```text
Build
→ 独立 Migration Step / Job
→ drizzle-kit migrate
→ 成功
→ Roll out API
```

Migration 失败必须阻止 rollout。

`/ready` 只读检查 DB reachable + 当前代码所需 migrations 已应用；pending 时 503，不“顺便 migrate”。

Drizzle migration ledger 是唯一 schema version 事实，不再建第二套 `schema_version`。

## 9. 安全 Migration

高风险必须显式 Review：DROP、SET NOT NULL on existing data、类型重写、大表 backfill、长锁 Index。

滚动发布优先 Expand/Contract：先增加兼容结构、切新代码、后续再删除旧结构。

Rename 必须核对生成 SQL，避免工具把 rename 误判为 drop+add 数据丢失。

一次性 deterministic data transform 可以进版本化 Migration；不要在应用 startup 留 legacy data fix。

## 10. Seed / Test Reset

Migration = schema evolution + 必要 deterministic data migration。

Seed = dev/demo business data；Production 默认不自动 Seed。

Test DB reset 只在测试 Harness，且必须确认 `NODE_ENV=test`、`TEST_DATABASE_URL` 与 dev/prod 不同、数据库带 test marker。Test DB 也从正式 Migration Ledger 构建。
