# 开发计划专项风险、完整审计、GitHub 发布与下游执行 Goal

计划主体完成后读取。

# 一、专项风险与最低充分验证

按任务性质检查，必要时读取共享 `specialized-test-matrices.md`：

- API/DB：Schema、事务、权限、幂等、并发、migration、旧数据；
- Worker/Runner：timeout、retry、重复投递、restart、cancel、credential；
- Web：route、reload、history、multi-tab、cache、unmount、stale/race、a11y；
- 外部系统：owner、request/response lost、partial success、retry boundary、replay；
- 删除：import/export/registry/runtime lookup/generated/fixture/docs；
- 持久化/破坏性变更：环境范围、preflight、幂等、灰度、observability、部分失败、兼容窗口、rollback/forward-fix、旧路径清理门槛。

没有相关风险时不制造章节。

# 二、发布前计划审计

只有以下全部闭合，才可称“完整可执行计划”：

- Requirement → Task；
- Fact → Source；
- Search Hit 全部分类；
- Search → Propagation → File → Task；
- File Structure ↔ Task Write Set 双向一致；
- Contract Producer/Consumer/Depends On 一致；
- 消费者 Task 已展开关键合同；
- DAG 无环，资源冲突已串行；
- 每个非测试写文件有精确 Green Implementation Step；
- 每个可测试代码 Task 明确 `TDD: REQUIRED`，并包含 Red/Green/Refactor/Regression；
- Red 有 Test/Assertion/CWD/Command/Expected old failure；
- `TDD: N/A` 有真实理由和替代验证；
- 每个重要 Invariant/Risk 有 Behavior Case/测试/替代证据；
- 命令来自当前仓库；
- 重大 Decision 没被规划阶段重新发明；
- 没有 `TBD/TODO/补必要测试/类似 Txx` 等占位；
- 主 Issue、事实、合同、Task、测试和风险之间无矛盾。

关键项缺失时不得发布“可直接交给小模型”的完整计划。

# 三、GitHub 发布

实施计划属于执行类 Issue，创建前查重开放和已关闭记录：同一交付开放则复用；历史同根因未解决优先重开；独立交付才新建。

标题：

```text
【实施计划】<清晰、可检索的交付目标>
```

默认事实源：

1. 主 Issue：目标/非目标、来源决定、源码快照、总体策略、Task Index、DAG、Contract 摘要、ADR/Blocker、总体验收、真实性边界；
2. 规划评论：Source/Fact、Search/Propagation、Persistence/File Structure、架构/合同/风险；
3. 每个 Task 一条独立自包含派工评论；
4. 必要时补测试/迁移/灰度/回滚/运维/DoD 总结。

不生成本地计划镜像、实施状态 JSON 或持续工具日志。GitHub 不可写时按 handoff protocol；没有真实工具成功结果不能声称已写入。

# 四、技术测试方案是否需要独立 Issue

技术测试能力保留为**条件型独立产物**，不作为所有实施计划的固定下一步。

通常**不需要单独技术测试方案**：

- 单 Task/少量 Task；
- Task TDD + focused regression 已能覆盖主要风险；
- 不需要新 Harness/Fixture/Reset；
- 没有复杂跨层 race/recovery、外部 replay、环境隔离或 Fresh Run 设计。

建议单独形成【技术测试方案】的情况：

- 多 Task 组合后才出现关键系统 Invariant；
- 需要 Unit/Integration/Contract/Component/E2E 分层取舍；
- 需要 Harness/Fixture/Reset/Mock/Replay；
- 涉及 crash/race/retry/idempotency/recovery/duplicate/out-of-order；
- 外部服务或多进程/多存储环境需要稳定故障注入；
- 需要 Fresh Run、`retries=0`、flake 治理或大规模测试迁移/去重。

如果存在该方案：开发前用于冻结测试架构和可测试性 seam，开发后由测试阶段按完整方案验收；每个 Coding Task 只消费与自己相关的 Case，不要求小模型反复读取整份方案。

**无论是否存在技术测试方案，Task TDD 都必须成立。**

# 五、与业务测试方案的关系

业务测试方案也是条件型下游产物：当用户流程、业务状态、不变量、跨对象验收本身需要独立 Campaign 时使用。其业务 Scenario 可以映射到 Task Acceptance/Regression，但不能替代开发者测试先行或技术层验证。

# 六、下游 Coding Agent Goal

GitHub 计划成功写入后，最终回复给出可直接执行的 Goal，要求：

- 指向真实实施计划 Issue；
- 开始前读 `AGENTS.md`、当前源码、主 Issue 索引和当前有效 Task；
- 以 Task 评论为主要上下文，优先读 `Read Before Edit`，不重新全仓设计；
- Entry Preconditions 满足后才执行；严格遵守 Allowed/Forbidden/Write Set/Contract/Stop Conditions/Expected Diff Shape；
- **每个 `TDD: REQUIRED` Task 严格按 Red → Green → Refactor → Regression，Red 必须真实失败且失败原因正确；**
- `TDD: N/A` 只按 Task 明示理由执行替代验证；
- Green 只做根因级最小完整实现，不通过改弱测试求绿；
- Task 完成后运行真实 focused regression，并记录命令/证据；
- 有业务/技术测试方案时只消费当前 Task 映射的合同；全部 Task 后再执行必要的跨 Task 技术/业务验收；
- DAG ready task 可并行，但共享写集/资源冲突串行；
- 实施完成后安排独立 Review；发现问题后修复、重新验证、重新 Review；
- 在 Task/验证/失败分类/阻塞变化等节点简短汇报，汇报后继续推进；
- 计划与源码冲突、出现新产品/架构决定、缺权限或 Stop Condition 时停止受影响子图并报告证据；其它独立 Task 继续；
- 不生成本地计划/状态文件；未授权不 push/merge/release/deploy。

本 Skill 只生成 Goal，不执行 Goal。

# 七、最终回复与强制检查

最终至少包含：实施计划 Issue/handoff、Task 数和 DAG、关键 Contract、阻塞/ADR、独立业务/技术测试方案是否需要/已存在、真实性边界、Coding Agent Goal。

结束前确认：

- 源码和 `AGENTS.md` 已读；Spec Gate 已处理；
- Search/Propagation/File/Task、Contract 和 DAG 审计通过；
- TDD 字段没有因拆分测试 Skill 被省略；
- 测试方案是条件协作，不是实施计划完整性的替代品；
- 未写生产代码/测试代码，未声称测试已执行；
- GitHub 操作结果真实；Goal 使用真实 Issue 且无占位符。
