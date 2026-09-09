# OpenAPI、输出格式与证据引用

用户要求 OpenAPI/Apifox 交付、正式一致性审计报告或需要详细引用格式时读取。

# 六、OpenAPI / Apifox 模式

用户明确要求 OpenAPI、Swagger、Apifox 可导入文件时，进入本模式。

## 6.1 默认格式

优先生成：

- OpenAPI `3.1.0`；
- YAML；
- 文件路径：`/mnt/data/api-contract-audit/<slug>.openapi.yaml`。

用户指定 JSON 时改为 JSON。

## 6.2 生成原则

只能写入已经由当前源码/验证证据支持的合同：

- `paths`；
- methods；
- path/query/header parameters；
- requestBody；
- responses；
- schemas；
- securitySchemes/security（有明确证据时）；
- enum/default/nullable/required（有明确证据时）。

禁止：

- 猜 `operationId`；
- 猜业务 description；
- 猜 example；
- 猜错误码；
- 猜 `Bearer` / API key / session；
- 因为调用方传了字段就认定服务端接受；
- 因为 TypeScript 类型存在就认定 runtime validator 一定接受。

如果证据不足：

1. OpenAPI 中只写已确认部分；
2. 在同目录生成或在回复中附上 `待验证项`；
3. 不使用虚构字段填满 schema。

## 6.3 导出前自检

至少检查：

- YAML/JSON 可解析；
- OpenAPI version 存在；
- path parameter 全部 `required: true`；
- path 模板参数与 parameter 名字一致；
- request/response schema 引用存在；
- security scheme 引用存在；
- status code 使用字符串 key；
- 没有将内部证据不足的字段写成 required。

有本地 OpenAPI validator 时可以运行；没有时不得声称“规范校验通过”。

---

# 七、输出格式

根据用户目标选择最小充分输出，不强制每次生成长报告。

## 7.1 单接口事实查询

优先给一张紧凑表：

| 维度 | 当前合同 | 证据 |
|---|---|---|
| Method / Path | ... | `file:symbol` |
| Exposure | internal/external/待验证 | ... |
| Auth | ... | ... |
| Headers | ... | ... |
| Path / Query | ... | ... |
| Body | ... | ... |
| Success Response | ... | ... |
| Errors | ... | ... |
| Caller | ... | ... |

随后只解释关键差异和不确定项。

## 7.2 一致性审计

输出：

### 当前权威合同

结构化列出服务端当前合同。

### 对账矩阵

| 合同项 | Server | Caller | Test | OpenAPI/Docs | 结论 |
|---|---|---|---|---|---|
| Header | ... | ... | ... | ... | MATCH/MISMATCH |
| Body field | ... | ... | ... | ... | ... |
| Response field | ... | ... | ... | ... | ... |

### 发现

每个独立 mismatch 包含：

- 类型；
- 症状/差异；
- 直接证据；
- 当前影响；
- `事实 / 推断 / 待验证`；
- 如果继续处理，应该进入缺陷调查 / 讨论 / 结论 / 实施计划 / 技术测试方案中的哪个阶段。

不要把多个独立根因强行合并成一个缺陷 Issue。

## 7.3 OpenAPI 交付

回复中给：

- 生成文件下载链接；
- 覆盖的 endpoint；
- 证据基线；
- 未确认项；
- 如果存在与当前文档/调用方的漂移，简要列出。

---

# 八、证据引用

源码证据优先使用：

```text
<relative-path>:<symbol>
```

例如：

```text
apps/api/src/routes/internal-sites.ts:externalSyncRoute
packages/shared/src/contracts/site.ts:ExternalSyncResponse
apps/web/src/lib/api/site.ts:externalSync
```

行号可作为当前快照辅助，但不要只依赖容易漂移的行号。

对于 ZIP 基线，记录：

- ZIP 文件名；
- SHA-256；
- 解压目录。

如果一次审计涉及多个上传源码包，必须明确每个服务/调用方分别来自哪个基线，不能把不同版本默认为同一时点。

---
