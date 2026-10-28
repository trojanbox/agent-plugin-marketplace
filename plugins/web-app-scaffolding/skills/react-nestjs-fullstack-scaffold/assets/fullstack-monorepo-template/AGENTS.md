# 项目研发规范

## 工作区与架构

- 使用 pnpm + Turborepo；Node.js 基线为 24+。
- 前端唯一入口为 `apps/web`，后端唯一入口为 `apps/api`。
- 跨应用的序列化 HTTP 契约进入 `packages/contracts`；UI Primitive 进入 `packages/ui`；国际化基础设施进入 `packages/i18n`。
- `AppModule` 只负责组装粗粒度 Module；后端依赖方向固定为 Controller → Service → Repository → Database。
- Module 内 Controller / Service / Repository 分别进入 `controllers/`、`services/`、`repositories/`，禁止按单个接口或 Provider 机械拆 Module。
- 前端按 Feature 内聚；应用布局使用 `layout/`，浏览器和 HTTP 基础设施使用 `infrastructure/`，不创建含义模糊的 `shell/`、`lib/`。
- Page / Component 私有 CSS Module 与 Owner 共置，只从当前目录引用；公共视觉规则通过 Design Token、`packages/ui` 或明确公共样式边界复用。
- 无实例状态的前端 Feature Service 使用静态可继承类；HTTP 统一经过 `infrastructure/http/ApiClient`。
- Radix Primitives 统一通过 `radix-ui` 由 `packages/ui` 封装；业务 Feature 不直接 import `radix-ui` 或 `@radix-ui/react-*`。
- 详细架构边界见 [`docs/architecture.md`](docs/architecture.md)。

## 认证与安全

- 浏览器认证使用服务端 Session + HttpOnly Cookie，写请求额外校验 CSRF。
- 业务 Feature 不自行保存 Session credential、读取认证 Cookie 或实现第二套认证客户端。
- 新增匿名接口必须显式使用项目既有公开路由机制，不绕过全局 Guard。
- 详细安全模型见 [`docs/authentication-and-security.md`](docs/authentication-and-security.md)。

## 测试与验证

- 前端组件测试与源码共置；后端纯 Unit Test 同样与被测源码共置。根 `tests/` 只承载 Architecture、Integration、Support 和 E2E。
- Integration 和 E2E 使用独立 PostgreSQL 数据库，并从正式 Migration Ledger 重建；不得复用开发数据库。
- users/items 的 created_at、updated_at 使用 TIMESTAMPTZ(3)，deleted_at 可空；更新由 PostgreSQL Trigger 同步维护，业务查询过滤 deleted_at IS NULL。
- 禁止固定 sleep 或无依据重试掩盖异步问题。
- 修改后至少执行受影响范围的 lint / typecheck / test；提交前默认执行 `pnpm verify`。
- 关键用户流程或跨栈改动执行真实 E2E；完整验证使用 `pnpm verify:all`。
- 测试与数据库生命周期见 [`docs/testing-strategy.md`](docs/testing-strategy.md)。

## 业务公共基础设施

- 事务由 Service 使用 DatabaseService.transaction() 声明，Repository 自动复用当前事务；单个业务操作不得把必须原子提交的 SQL 拆到多个事务。
- RequestContext 的 actorId 只由已认证 Guard 设置；Repository 使用 AuditFields 写入 createdBy/updatedBy，禁止把客户端字段当成可信身份。
- 普通业务表列表/详情/更新/软删除均复用 activeRecord(table) 的显式条件，包含分页 totalRows。
- 认证限流用 PostgreSQL 原子窗口，按可信客户端 IP 校验，TRUSTED_PROXY_IPS 只能写实际受信任代理地址；维护作业通过 db:prune-rate-limits 清理旧键。
- /health 只看进程存活，/ready 检查 PG Migration Ledger；应用启动不得自动迁移。
- ApiClient 统一封装 HTTP 方法、CSRF、AbortSignal、JSON/无内容与非 JSON 错误；业务接口不要再造 fetch wrapper。
- 模板唯一来源为本目录；复制后使用 scaffold:init 生成新项目的名称、数据库和环境配置。

## 文档管理

- 正式文档遵循 [`docs/documentation-policy.md`](docs/documentation-policy.md)。
- `docs/` 只保存长期有效、源码难以快速可靠推导、未来会重复使用的项目知识。
- 调研、计划、TODO、Debug、Handoff、执行日志等任务级产物默认不进入 `docs/`。
- 临时材料确需落盘时使用 `.agents/work/`；该目录不进入 Git，也不参与项目格式化检查。
- 新增长期 Markdown 前先检查 README、AGENTS、现有 docs、配置、Schema、Migration 和源码，避免重复事实来源。
- 修改代码导致长期文档描述失效时，必须同步更新文档。

## 注释

- 不为函数、方法、参数或显而易见的实现细节添加例行注释或说明文档。
- 优先使用清晰命名、类型和测试表达意图。
- 只有代码无法可靠表达隐藏约束、非显然设计决策、外部系统怪异行为或不变量时才保留注释。
- 修改代码时同步清理附近过期或重复注释。

## 复杂度边界

没有真实需求时，不提前加入 Redis、Queue / Worker、CQRS、Event Bus、GraphQL、S3、Search、微服务或额外全局 Store。
