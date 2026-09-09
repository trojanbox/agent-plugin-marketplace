# 技术测试方案：风险、层级、Harness、Resilience 与 Evidence

前置 Gate 通过后读取，用于正式设计技术测试方案主体。

# 三、建立 Test Target / Risk Map

| ID | 测试对象 | 风险/失败模式 | 目标合同来源 | 当前实现证据 | 影响面 | 优先级 |
|---|---|---|---|---|---|---|
| R01 | ... | ... | S01 | F01 | ... | P0/P1/P2/P3 |

至少考虑适用项：输入/输出与错误合同、数据持久化与旧数据、权限/身份、幂等/并发、异步/超时/取消/重试、UI 状态、外部依赖、迁移/兼容/回滚、删除/清理。

# 四、现有测试资产盘点

| Test ID | 文件/入口 | 层级 | 当前覆盖 | 稳定性 | 可复用 | 处理 |
|---|---|---|---|---|---|---|
| TST01 | ... | Unit | ... | stable/flaky/unknown | yes/no/partial | retain/extend/migrate/replace/delete |

禁止看到“已有 E2E”就默认继续堆 E2E。先判断它是否稳定、是否重复低层测试、是否依赖旧入口或脆弱 Fixture。

# 五、选择最低充分测试层

| Risk | Unit | Integration | Contract | Component | Browser/API E2E | Resilience | 选择理由 |
|---|---:|---:|---:|---:|---:|---:|---|
| R01 | ✓ |  |  |  |  |  | ... |

原则：

- 纯函数/边界 → Unit；
- 模块协作、DB/Cache/队列真实边界 → Integration；
- API/schema/Provider 兼容 → Contract；
- UI 组件状态 → Component；
- 关键跨层真实用户路径 → Browser/API E2E；
- crash/race/recovery/duplicate-delivery → Resilience。

E2E 只覆盖低层无法可靠证明的跨层合同，不机械复制所有 Gherkin。

# 六、Harness / Environment / Fixture / Reset

按公共质量合同设计，并回答：

- 测试运行在哪；
- 启动哪些服务；
- 哪些依赖真实、哪些虚拟化；
- 测试数据怎么创建；
- 如何确保对象唯一；
- 如何 Reset；
- Reset 失败怎么办；
- 并发执行会不会互相污染；
- 哪些环境前置是硬阻塞。

如果当前仓库已有测试脚本/命令，引用真实路径与命令；没有证据时写 `UNVERIFIED_COMMAND`，不能凭经验编命令。

# 七、System Resilience Profile

只有风险真正涉及 crash/restart、retry/duplicate delivery、reconnect、race/concurrency、partial completion、recovery/resume、identity continuity 或 Provider 漂移时启用。

| ID | 原子故障点 | Fault Seam | 故障前状态 | 注入 | 预期恢复 | 负向不变量 | Evidence |
|---|---|---|---|---|---|---|---|
| RS01 | ... | ... | ... | ... | ... | 不重复副作用 | ... |

必须优先选择确定性 Fault Seam。无法稳定控制故障时，先规划有界探索，不把随机网络抖动当正式自动化方案。外部系统只通过公开合同建立 Service Virtualization / Contract Test；不能要求修改外部 DB 或私有内部状态。

# 八、执行批次

按实际依赖裁剪：

1. Harness / Environment / Baseline；
2. Unit / Contract；
3. Integration / Component；
4. 代表性 E2E；
5. Resilience（适用时）；
6. Fresh Run / 稳定性回归。

# 九、Evidence / Fresh Run / Flake Policy

| ID | 通过证据 | 失败证据 | 非目标对象检查 | Fresh Run 要求 |
|---|---|---|---|---|
| R01 | ... | ... | ... | N 次 / 不适用 |

禁止 fixed sleep、blind retry 和高 retry 掩盖 flaky。正式 resilience Fresh Run 默认 `retries=0`；使用随机 seed 时记录 seed 与复现方式。

# 十、与业务测试方案的边界

技术测试方案可以消费业务测试方案中的 Scenario ID、用户入口、业务前置、Expected Business Contract、Invariant 和业务 Evidence，但不能在这里重新定义业务语义。

如果没有业务测试方案，也可以直接基于已确认结论/缺陷验收/用户决定做技术方案；遇到业务未决项立即标记，不从当前实现猜。
