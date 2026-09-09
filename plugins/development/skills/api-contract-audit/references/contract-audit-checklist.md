# API 合同证据与逐项审计清单

在定位真实入口后读取，用于鉴权/Header、Request、Response、Error、Side Effect、幂等和多调用方对账。

# 二、证据边界

## 2.1 源码优先

涉及当前项目实现时必须：

1. 先检查当前会话上传文件和 `/mnt/data`；
2. 访问项目源码前读取项目根目录以及适用子目录的 `AGENTS.md`；
3. 以当前源码、当前 schema/类型、当前测试、当前配置和可复现运行证据为主要事实来源；
4. GitHub Issue、README、历史接口文档、Apifox/OpenAPI 导出只作为补充；
5. 不从公共 GitHub、搜索引擎或未知镜像获取项目源码来替代用户提供内容。

如果当前材料不足，明确写“待验证”，不要根据框架惯例或经验补合同。

## 2.2 不存在单一永远权威的文件

API 合同可能分散在：

- route 注册；
- middleware；
- handler/controller；
- validator/schema；
- DTO/type；
- serializer/transformer；
- service/use-case；
- SDK/client；
- 调用方；
- tests；
- OpenAPI/Swagger；
- gateway/proxy 配置。

不能只找到一个 TypeScript interface 就宣布“接口合同就是这个”。

## 2.3 事实层级

每项结论至少标记为以下之一：

- `VERIFIED_IMPLEMENTATION`：当前服务端源码直接支持；
- `VERIFIED_CALLER`：当前调用方源码直接支持；
- `VERIFIED_TEST`：当前测试直接支持；
- `VERIFIED_RUNTIME`：当前可复现运行结果直接观测到；
- `DOCUMENTED_ONLY`：只有文档/OpenAPI 支持，当前实现尚未验证；
- `INFERRED`：由多项证据推断，但源码没有直接声明；
- `UNVERIFIED`：当前材料不足。

运行结果只能证明实际观测到的行为，不能自动证明所有分支；测试通过也不能证明文档一定正确。

---

# 三、审计路径

默认沿以下顺序阅读；实际框架不同可以调整，但不能跳过合同传播链。

```text
路由注册 / gateway
→ endpoint middleware
→ 鉴权与身份来源
→ Path / Query / Header 解析
→ Request Body schema / validator / coercion
→ Handler / Controller
→ Service / Use Case
→ Response serializer / envelope
→ Error mapping
→ 调用方 / SDK / fetch wrapper
→ 调用方字段消费
→ Tests
→ OpenAPI / 接口文档
```

## 3.1 先定位真实入口

至少确认：

- HTTP method / RPC method；
- 完整 path；
- router prefix；
- endpoint 是否通过 gateway/rewrite 暴露；
- internal / external / public / authenticated 的证据；
- handler/controller symbol；
- route 级 middleware。

如果只能确认局部 path，不能自行拼完整 URL。

## 3.2 鉴权与 Header

审计：

- 鉴权发生在哪一层；
- token/session/service credential/custom header 从哪里读取；
- Header 名称、是否 required、格式、大小写处理；
- 身份值由客户端提供、gateway 注入还是 server session 派生；
- 是否存在共享 middleware；
- 同类内部 endpoint 是否遵守同一套约定。

当用户问“为什么这个接口多一个 Header”时，必须搜索**同一内部接口族/同一路由组/同一 middleware**，用项目证据比较，不能根据常见实践判断。

如果发现某 endpoint 绕开了共享鉴权或自定义了一套身份来源，只报告事实与风险；用户没有要求修改时，不直接设计替代方案。

## 3.3 Request Contract

逐项确认：

### Path Params

- 名称；
- 类型；
- required；
- 解析/校验；
- 语义。

### Query Params

- 名称；
- 类型；
- required/optional；
- default；
- enum/range；
- coercion；
- repeated/array 语义。

### Headers

- 名称；
- required；
- 格式；
- 来源；
- 用途。

### Body

- content type；
- object/array/scalar；
- 每个字段；
- required/optional；
- nullable；
- enum；
- default；
- nested schema；
- unknown field policy；
- validation/coercion/transform。

不要把 TypeScript 的 `?`、Zod 的 `.optional()`、数据库 nullable、JSON 字段缺失混成同一个概念。

## 3.4 Response Contract

至少确认：

- success status；
- content type；
- response envelope；
- 字段名和类型；
- required/optional/nullability；
- 字段来自哪里；
- serializer 是否 rename/omit/transform；
- list/pagination 结构；
- empty result 语义；
- 不同状态码是否返回不同 schema。

如果页面目录实际返回 `{routeId}`，调用方却断言 `{route}`，必须把两份合同分别列出并标记为 mismatch，不能为了回答方便选一个名字统一掉。

## 3.5 Error Contract

从实际 throw/error mapping/middleware/handler branch 中确认：

- 可能的 HTTP/RPC error code；
- error body/envelope；
- machine-readable code；
- message；
- retryability（只有源码明确支持时）；
- auth/permission/not-found/validation/conflict/internal error 的区分。

禁止从框架默认行为猜测所有错误状态；没有证据的状态码写 `UNVERIFIED`。

## 3.6 Side Effects 与幂等

只有用户问题涉及或源码明显体现时，再审计：

- 数据写入；
- 事件发布；
- 异步任务；
- 外部调用；
- 幂等键；
- 重复请求语义；
- transaction/rollback。

本 Skill 的中心仍是接口合同，不为了“更全面”扩张成整个业务系统分析。

---

# 四、调用方对账

服务端合同抽取完成后，搜索所有重要调用方，至少核对：

- method/path 是否一致；
- prefix/base URL 是否一致；
- Header 是否一致；
- path/query/body 字段是否一致；
- optional/default/nullability 是否一致；
- response 字段读取是否一致；
- envelope 解包是否一致；
- error handling 是否依赖服务端实际存在的 code/status；
- 调用方是否使用旧字段、旧 endpoint、旧 auth 方式。

如果有生成 SDK，确认调用方使用的是生成客户端还是手写 fetch；不要假设 OpenAPI 更新会自动影响所有调用方。

## 4.1 多调用方

一个 API 被多个服务/前端/Worker 调用时，分别列出。不能只检查第一个调用方。

如果用户只要求某个指定调用方，则冻结范围，不无故扩张全部仓库。

---

# 五、一致性审计分类

发现不一致时使用以下类型，方便后续 Bug/Spec 接手：

| 类型 | 含义 |
|---|---|
| `SERVER_CALLER_MISMATCH` | 服务端真实合同与调用方发送/消费不一致 |
| `SERVER_SCHEMA_MISMATCH` | route/handler 与共享 DTO/schema/type 不一致 |
| `SERVER_TEST_MISMATCH` | 测试断言与当前服务端真实合同不一致 |
| `DOC_IMPLEMENTATION_DRIFT` | OpenAPI/文档与当前实现漂移 |
| `AUTH_CONTRACT_MISMATCH` | 鉴权/Header/身份来源在相关端点或调用方之间不一致 |
| `ERROR_CONTRACT_MISMATCH` | 状态码、错误 code 或 error envelope 不一致 |
| `EXPOSURE_BOUNDARY_MISMATCH` | internal/external/public 暴露边界与调用方式不一致 |
| `UNVERIFIED_CONTRACT_GAP` | 关键合同当前材料不足，无法确认 |

## 5.1 不自动把 mismatch 判成生产 Bug

本 Skill 负责证明“不一致存在”。是否属于生产 Bug，需要结合实际故障、目标合同和业务预期。

例如：

- 测试还在断言旧字段，服务端和真实调用方都已一致 → 更可能是测试合同漂移；
- 调用方读取旧字段并导致页面失败 → 可能是生产 Bug；
- 文档落后但运行链路一致 → 文档漂移；
- 目标合同尚未冻结 → 可能需要讨论/Spec。

没有足够证据时不要越级定性。

---
