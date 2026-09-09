# small-model-strict Task 自包含执行合同

拆 Task 时读取。本文件是 Task 派工评论的权威结构；共享 `plan-authoring.md` 中的简化 Task 模板只负责文档骨架，不能省略这里的 TDD 与执行边界。

# 一、Task 必需字段

```markdown
## T01：<标题>
- Revision: r1
- Complexity: S/M/L
- Delivery: <单一交付物>
- Depends On: ...
- Parallel Group / Exclusive Resources: ...
- TDD: REQUIRED | N/A
- Split Exception: <仅超预算时>

### 证据与来源
- S01 / F01 ...

### Entry Preconditions
- ...

### Read Before Edit
1. `path#symbol` — 为什么读、必须理解什么

### Consumes / Produces / Invariants
- Signature / Schema / Error / Compatibility / Transaction / Concurrency

### 修改范围
Allowed Changes: ...
Forbidden Changes: ...
Write Set: ...
Exclusive Resources: ...

### Stop Conditions
- 出现哪些新事实必须停止并回报

### Expected Diff Shape
- 应出现 / 明确不应出现的文件和 symbol 变化

### 红灯（Red）
- Test / Case: `path::name`
- Assertion: ...
- CWD: `...`
- Command: `...`
- Expected old failure: ...

### Behavior Cases
- happy_path: ...
- regression: ...
- failure/concurrency/migration/output_contract: <按风险增加>

### 绿灯（Green）
1. `path#symbol`
   - Action: create/modify/delete
   - Instruction: 结构、控制流、状态、错误、事务/并发
   - Postconditions: ...
   - Failure mapping: ...

### 重构（Refactor）
- ...

### Regression / Verification
- Focused regression: ...
- Business Scenario IDs: ...
- Technical Risk/Case IDs: ...
- Real repo command: ...
- Expected Evidence: ...

### Compatibility / Migration / Rollback / Observability
- 仅适用项

### Risks
- K01 ...

### Acceptance
- [ ] ...
```

# 二、TDD 执行合同（强制）

## 2.1 `TDD: REQUIRED`

凡生产行为能通过自动测试表达，必须按下列顺序派工：

### Red — 测试先行

1. 先写/修改**最小能证明目标行为或根因**的测试；
2. 给出真实测试文件、测试名、断言、CWD、仓库真实命令；
3. 实际实施时先运行测试，必须确认失败原因就是目标能力尚未实现；
4. 环境失败、依赖缺失、编译器没装、命令写错不能算 Red；
5. 新测试如果直接 Green，必须停止生产修改并判断：
   - 功能是否已经存在；
   - 测试是否没有命中目标路径；
   - 计划事实是否已经漂移。

计划阶段没有真实开发环境时，仍要把预期 Red 写成下游义务，不能声称已执行。

### Green — 根因级最小完整实现

- 只做让当前 Red 变 Green 且满足已冻结合同的最小完整生产修改；
- 每个非测试写文件至少一个精确 `path#symbol` 步骤；
- 指定 Signature/Data/State/Call Order/Error/Transaction/Concurrency/Postcondition；
- 禁止为了绿灯吞错、硬编码结果、无依据 retry、关闭校验或修改测试去迁就错误实现。

### Refactor — 测试保护下整理

- 只整理重复、命名、局部结构或明确技术债；
- 不增加新业务行为，不扩大 Write Set；
- Refactor 后目标测试必须继续 Green。

### Regression — 证明没有破坏旧行为

- 跑当前 Task focused regression；
- 按风险补 Contract/Integration/Component/E2E 中最低充分层级；
- 记录真实命令、退出码、关键断言或真实阻塞；
- “目标测试通过”不能自动替代相关旧行为回归。

## 2.2 `TDD: N/A`

只有无法构造有意义行为 Red 的 Task 可使用，例如纯文案、纯静态资源或仅机械生成物同步。必须写：

- 为什么行为级 Red 不成立；
- 修改前已有基线验证；
- 修改后验证；
- 相关 parity/schema/build/format 等替代证据。

不能因为“测试麻烦”把代码 Task 标成 N/A。

# 三、Behavior Cases

每个 Task 至少：

- `happy_path`；
- `regression`：明确必须保持的旧行为。

按风险增加：

- API/错误：invalid input / permission / upstream failure；
- 并发/事务：conflict / concurrency / atomicity / idempotency；
- migration：old data / partial / rollback-or-forward-fix；
- Worker/Runner：retry / duplicate delivery / restart / cancel / timeout；
- UI：reload / navigation / stale response / unmount / multi-object invariant；
- CLI/API 输出：output_contract；
- 删除：reference/export/registry/runtime/generated cleanup。

每个重要 Invariant/Risk 必须有 Behavior Case、测试或明确替代验证。

# 四、小模型执行边界

- `Read Before Edit` 防止重新全仓漫游；
- `Entry Preconditions` 防止依赖未满足提前改码；
- `Allowed/Forbidden/Write Set` 防止顺手重构；
- `Stop Conditions` 遇到计划外事实就停，不自行设计；
- `Expected Diff Shape` 约束最终 diff；
- Green 步骤要精确到文件/symbol和后置条件，禁止“适配一下/完善逻辑/按需修改”。

# 五、业务/技术测试方案的关系

- 业务测试方案回答用户/业务流程“应该怎样工作”；
- 技术测试方案回答复杂跨层验证“如何稳定、可重复地证明”；
- Task TDD 回答“这一块生产代码应如何被测试先行地写出来”。

三者可以组合，但**后两者都不能替代 Task TDD**。已有测试方案时，把当前 Task 真正需要的 Case/Assertion/Evidence 展开回派工评论，不能只丢 Issue 链接给小模型重新理解。

# 六、命令与证据真实性

命令必须来自 `AGENTS.md`、package scripts、Makefile、测试配置或当前源码证据。当前规划环境无法真实执行时写成下游义务：

`在 <环境/CWD> 执行 <真实命令>，预期证明 <合同/断言>`。

未运行的命令不能写成已通过；环境阻塞要与产品/测试失败区分。
