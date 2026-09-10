# Performance, Runtime and Dependencies

用于 HTTP Adapter、资源上限、性能优化、Node/pnpm、依赖、兼容/废弃代码。

## 1. Runtime

新脚手架当前默认 Node 24 LTS，仓库固定 major（如 `.node-version`）并在 engines 限制 `>=24 <25`。生产跟 LTS，不追 Current。

Package Manager 固定 pnpm，根 `packageManager` 精确版本；提交 `pnpm-lock.yaml`；CI/Production `pnpm install --frozen-lockfile`。

共享核心依赖版本集中治理，Package 自己声明真实 runtime/dev dependencies，不依赖 hoist 偶然可解析。

## 2. Express 默认

使用 Nest 默认 `@nestjs/platform-express`。不为 benchmark 提前切 Fastify，也不同时维护 Express/Fastify 双适配。

真实 profiling 证明 adapter overhead 是瓶颈且 middleware compatibility 可接受后再迁移。

## 3. Resource Limits

普通 JSON body 保持框架较小默认（Express 约 100KB），无依据不全局放大到 10/50MB/unlimited。真实需要时通过 typed config 集中设置，并同时限制 Zod array/bulk count。

普通列表 pageSize ≤100；大导出建立明确 Export/Stream Contract，不把 pageSize 调到百万。

List Item 保持轻，不因 Repository join 就返回 rich text/full settings/base64/巨大 relation tree。

DB pool 有明确上限：`pool per replica × replicas <= DB connection budget`。External I/O、DB connection/statement 都有 timeout。

## 4. Compression

高流量 Production 优先 CDN/Ingress/Reverse Proxy 做 gzip/brotli；API 默认不安装 compression。避免 proxy + app 双重压缩。

## 5. Event Loop

业务 Request Path 禁止 `readFileSync/writeFileSync/execSync/scryptSync` 等同步阻塞 I/O/CPU heavy API。

Image/PDF/Video/大规模 CPU transform 真实出现后再选 worker_threads/separate worker/external processor；当前不预造 Worker。

Node memory 不保存唯一 session/business/job/idempotency/cluster-critical state。

## 6. 性能先测量

优化前至少看 P50/P95/P99、DB query、external I/O、CPU/network、payload。无测量不以“换 Fastify/加 Redis/加 Worker/加 Cache/扩大 pool”为默认方案。

## 7. Dependency Gate

新增依赖顺序：

```text
1 Node standard library
2 Nest 官方能力
3 项目已有依赖
4 少量稳定自维护代码
5 新第三方依赖
```

安全/协议领域（crypto primitive、CSRF、multipart、HTTP framework、DB driver、KDF、OpenAPI）优先 Node/Nest 官方或成熟专业库，不因“几十行能写”轻易自研。

不要创建只转发官方 API 的 `ConfigWrapper/HttpServiceWrapper/LoggerWrapper/DrizzleWrapper`；Adapter 必须提供真实 protocol/model/security/test seam 价值。

## 8. Package 克制

只有真实跨应用/发布单元消费者才抽 Workspace Package。`apps/api` 内复用保持 Module/目录即可。

不要提前创建 empty module/package/repository/interface/TODO-only service。

## 9. Deprecated / Compatibility

新增代码不使用 deprecated API。迁移完成后删除旧调用，不长期包 `legacyAdapter`。

Compatibility 只有明确支持合同才存在，并记录：兼容对象、开始时间、退出条件、删除 Owner。

禁止长期：

```text
new/old/v2 临时文件名
try new → catch all → old fallback
双实现
无消费者 feature flag
runtime schema compatibility shim
```

窗口结束删除 old path/fallback/config/test。Git 保存历史。

依赖冲突不长期用 `--force/--legacy-peer-deps`；pnpm patch/override 需要 upstream reason、版本、退出条件和 regression test。

删除能力同步清理 dependency/config/env/script/test/docs。
