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
- 每个 Task 明确 TDD focused Regression / 代码验收满足后创建仅包含当前 Task 变更的本地 Git commit；
- 没有业务测试、E2E、完整系统环境的任务、Acceptance、DAG 前置或 Coding Agent Goal；
- 命令来自当前仓库；
- 重大 Decision 没被规划阶段重新发明；
- 没有 `TBD/TODO/补必要测试/类似 Txx` 等占位；
- 主 Issue、事实、合同、Task、测试和风险之间无矛盾。

关键项缺失时不得发布“可直接交给小模型”的完整计划。

# 三、GitHub 发布

实施计划属于执行类 Issue，创建前查重开放和已关闭记录：同一交付开放则复用；历史同根因未解决优先重开；独立交付才新建。

标题：

```text
【开发·实施计划】<清晰、可检索的交付目标>
```

默认事实源：

1. 主 Issue：目标/非目标、来源决定、源码快照、总体策略、Task Index、DAG、Contract 摘要、ADR/Blocker、总体验收、真实性边界；
2. 规划评论：Source/Fact、Search/Propagation、Persistence/File Structure、架构/合同/风险；
3. 每个 Task 一条独立自包含派工评论；
4. 必要时补测试/迁移/灰度/回滚/运维/DoD 总结。

不生成本地计划镜像、实施状态 JSON 或持续工具日志。GitHub 不可写时按 handoff protocol；没有真实工具成功结果不能声称已写入。

# 四、开发计划与独立测试的交付边界

**实施计划只负责 Coding Agent 的 TDD 开发完成条件。** Task 必须先 Red、再 Green/Refactor，最后执行局部 Unit/Integration/Contract/Component 回归；其 Acceptance 只确认代码合同及当前 Task 所需自动化测试。

不得把业务验收、端到端测试、Playwright/System E2E、环境启动/Canonical Reset、真实 CMS/Sandbox 联调、跨系统故障探索或独立测试方案变成开发 Task、DAG 依赖、阻塞条件或最终 Coding Agent Goal。

业务与系统级验证是其它独立流程的责任；如代码级自动化无法证明某项跨系统风险，可在真实性边界说明“尚未经过系统测试”，不对 Coding Agent 派发该系统测试，也不将其列入实施完成的必过项。

**Task TDD 不得因此弱化。** 代码级 Red、Green、focused Regression 与真实命令必须完整。

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
- 当前 Task 的 Regression / Acceptance 满足后，创建一个只包含当前 Task 变更的本地 Git commit，再进入后续 Task；
- 只执行当前 Task 所列 TDD 与局部代码级回归；完整业务验收、Browser/System E2E 和外部系统环境验证归独立测试流程，不作为开发 Goal 的步骤或通过门槛；
- DAG ready task 可并行，但共享写集/资源冲突串行；
- 实施完成后安排独立 Review；发现问题后修复、重新验证、重新 Review；
- 在 Task/验证/失败分类/阻塞变化等节点简短汇报，汇报后继续推进；
- 计划与源码冲突、出现新产品/架构决定、缺权限或 Stop Condition 时停止受影响子图并报告证据；其它独立 Task 继续；
- 不生成本地计划/状态文件；未授权不 push/merge/release/deploy。

本 Skill 只生成 Goal，不执行 Goal。

# 七、最终回复与强制检查

最终至少包含：实施计划 Issue/handoff、Task 数和 DAG、关键 Contract、开发阻塞/ADR、TDD 局部回归合同、真实性边界、Coding Agent Goal；不包含业务测试/E2E 执行安排。

结束前确认：

- 源码和 `AGENTS.md` 已读；Spec Gate 已处理；
- Search/Propagation/File/Task、Contract 和 DAG 审计通过；
- TDD 字段没有因拆分测试 Skill 被省略；
- 各 Task 只承担 TDD 与代码级局部回归，不混入业务测试、Browser/System E2E 或系统环境启动；
- 未写生产代码/测试代码，未声称测试已执行；
- GitHub 操作结果真实；Goal 使用真实 Issue 且无占位符。
