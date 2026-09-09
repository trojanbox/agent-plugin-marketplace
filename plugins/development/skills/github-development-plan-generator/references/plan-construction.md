# 开发计划事实基线、传播、文件结构、合同与 Task DAG

Gate 通过后读取。目标是先把当前事实和传播范围查全，再拆 Task；禁止先凭感觉列 T01/T02 再补证据。

# 一、冻结源码快照与来源

记录：

- 根目录；
- Git branch/HEAD，或源码包 SHA-256；
- 能确认时记录既有工作区修改；
- 根目录及适用子目录 `AGENTS.md`；
- 仓库真实存在的 build/test/typecheck/format 入口；
- 关键当前能力、缺陷和限制。

使用稳定 ID：需求 `R01`、来源 `S01`、事实 `F01`、搜索 `Q01/H01`、传播 `P01`、合同 `C01`、风险 `K01`、Task `T01`、ADR/Question。

每个非平凡事实必须写：状态 `verified / assumption / question` + Source。只写“根据源码”不足以审计；目标设计不能伪装成当前事实。

# 二、继承上游决定

优先级：

1. 当前用户明确要求；
2. 当前有效【结论】/已确认 Discussion 决定；
3. 已确认缺陷永久解决方向；
4. 当前源码、测试和配置事实；
5. 仓库文档/历史 Issue；
6. 显式 inference/assumption。

如果规划必须改变已确认的用户行为、状态 owner、持久化、外部契约、安全、事务/并发或失败语义 → 标记 `DECISION_REQUIRED` 并阻塞受影响 Task，不在计划阶段替用户二次设计。

# 三、当前实现事实与架构边界

至少检查：

- 入口、调用链、模块 owner；
- 类型、接口、Schema、Route、Event、Command；
- DB/文件/对象存储/浏览器存储；
- Cache、runtime Map、队列、Worker、序列化/版本；
- 权限、错误、重试、幂等、取消、并发、生命周期；
- 外部系统 ownership 与同步/异步边界；
- 重启、回滚、旧数据/旧客户端兼容；
- 当前测试入口和已有回归资产。

重大持久化、兼容或并发选择缺少决定时建立 ADR/Question，不能悄悄填空。

# 四、仓库级 Search Coverage

对所有会传播的名称做精确搜索：类型、字段、函数、类、接口、表/索引/migration、route/event/command/env、cache key、feature flag、fixture/mock、文档、generated code。

记录搜索方法、范围和命中。每个命中唯一分类：

`create / modify / delete / retain / generated / historical / dependency_semver / false_positive`

所有 `create/modify/delete` 必须进入 File Structure 并归属至少一个 Task；有未分类命中时不得称为“完整可执行计划”。

# 五、传播关系图

接口、状态、ID、Schema 或持久化变化建立：

```text
Producer
→ Contract / Schema
→ Consumer
→ Persisted State / Cache / External Boundary
→ UI / API / Worker
→ Tests / Migration / Cleanup
```

每条边记录文件/symbol、Current、Target、分类、原因、Task。尤其检查“生产者已改、消费者遗漏”和“生成物/文档仍守护旧合同”。

# 六、File Structure

| File | Type | Action | Current | Target | Reason | Propagation | Task |
|---|---|---|---|---|---|---|---|
| `path` | production/test/migration/config/fixture/docs/generated | modify | ... | ... | ... | P01 | T01 |

规则：

- Task 写文件必须能反查到本表；
- delete 证明 import/export/registry/runtime lookup/fixture/docs 已覆盖；
- generated 文件写清生成来源；
- 测试、migration、config、fixture、docs 是一等文件；
- 可测试生产行为发生变化时，相关测试文件原则上应进入同一 Task 的 TDD Write Set；若无需改测试，必须给出已有测试充分覆盖的证据。

# 七、Contract Catalog

跨 Task 合同分配 `C01`，至少记录：

- Producer / Consumers；
- 完整 Signature；
- Schema / Data Structure；
- Invariants；
- Error Behavior；
- Transaction / Concurrency / Idempotency（适用时）；
- Compatibility / Migration / Versioning（适用时）。

中央 Catalog 方便全局审计；**消费者 Task 仍展开实际需要的完整合同**，不能只写 `Consumes C01` 让小模型跳转重建上下文。

# 八、Task DAG 与 small-model-strict

一个 Task 一个可独立审查的主要交付物。优先拆：Contract/Schema、Storage/Migration、Core、Caller/UI、Cleanup/Release；不要按“前端/后端”粗切导致合同散落。

复杂度：

- `S`：局部、低传播；
- `M`：常规跨文件/层；
- `L`：跨模块/服务、迁移、状态/并发、外部契约或高风险。

默认拆分目标：

- 非测试写文件尽量 ≤ 3；
- 1 个业务域；
- 主要技术层 ≤ 2；
- 预计生产改动约 ≤ 300 LOC；
- 独立失败模式 ≤ 3；
- Task 有效上下文约 ≤ 16K tokens；
- Task + Read Before Edit + 展开的合同即可让执行模型开始。

继续拆分会破坏事务原子性、migration 一致性或合同一次性切换时，写 `Split Exception` 和原子性证明。

依赖必须形成 DAG；DAG readiness 是真实调度依据。`write_set`、generated、migration/schema、锁文件及共享 DB/端口/cache/queue/browser/temp 资源冲突时必须串行。

# 九、测试协作 Gate

实施计划先保证**每个可测试 Task 自身有 TDD + Behavior Cases + focused regression**，然后再判断是否需要独立测试方案：

- 已有业务测试方案 → 把相关业务 Scenario/Invariant 映射进 Task Acceptance/Verification；
- 已有技术测试方案 → 把相关 Risk/Case/Evidence 映射进 Task TDD/Regression；
- 没有测试方案 → Task 仍必须完整，不自动创建额外 Issue；
- 只有当验证本身形成跨 Task/跨层的独立工程问题，例如 Harness/Fixture/Reset、外部 Contract Replay、系统级 race/recovery、Fresh Run/flake 规则、复杂环境隔离时，才建议单独技术测试方案。

独立测试方案永远是补充，不能削弱 Red/Green/Refactor 或把“代码写完再补测试”合法化。
