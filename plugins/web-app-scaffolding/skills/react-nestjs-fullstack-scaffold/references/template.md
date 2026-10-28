# 全栈脚手架模板使用约定

## 唯一源码

本 Skill 只维护一个可复制工程：`assets/fullstack-monorepo-template/`。以后直接在该目录改造，Git Commit 用于追溯历史。
用作新项目时先阅读其中 `AGENTS.md`、`README.md`、`package.json`、`apps/api/drizzle`，然后用 `cp -a TEMPLATE/. TARGET/` 复制，包括隐藏配置。仅提取所需模块时必须同时迁移 Contract、Workspace、Migration、配置与测试依赖。

## 默认规则

- React/Vite + NestJS + PostgreSQL 17 / Drizzle + Redis 7.4+；数据库 `TIMESTAMPTZ(3)` 和软删除过滤按模板。
- Service 负责 PostgreSQL 内事务；Redis 会话与 PostgreSQL 用户之间不能共用事务。注册先在 Redis 创建尚未披露的 Session，再创建 PG 用户，失败清理 Session。
- HTTP Request Context 为业务存储 userId、requestId；需要写入 `createdBy` / `updatedBy` 的 Repository 调用 `AuditFields`，缺可信用户上下文立即拒绝。禁止直接从用户请求采信审计身份。
- `activeRecord(table)` 统一软删除条件，列表、详情、更新、删除范围以及列表总数使用相同过滤。
- 认证限流使用 Redis Lua 原子计数及 TTL，客户端 IP 仅来自可信代理边界；Redis 不可用时认证必须失败，不降级到无限制访问。
- 前端所有 HTTP 经过 ApiClient，重用错误、Session Cookie、CSRF、AbortSignal；分页查询由 Route loader 提交参数和消费服务端页信息。
- 运行 `pnpm scaffold:init <name> --display-name "Name"` 完成工程名称与示例环境初始化；初始化命令自动衍生数据库名称，可使用 --db-port 和 --redis-port 分别设置本机端口（CI 不继承本地端口）；必须在首次启动数据库前执行。
- 真实集成测试使用独立 PostgreSQL Integration 数据库与 Redis 测试 DB 14，E2E 使用独立 PG 库和 Redis DB 15，关键浏览器流程连真实前后端。未知是否通过的验证必须明确标出。

## 交付

新项目复制后重新解析锁文件（依赖变更时）、执行 `pnpm verify` 和真实数据库集成测试。迁移由显式部署步骤执行，API 启动不自动 migrate。依赖或功能缺失时应明确指出，不为架构完整感增加 Redis、Worker、微服务或额外 ORM。
