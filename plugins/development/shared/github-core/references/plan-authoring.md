# 开发计划 Markdown 编写规范

本规范供 `github-development-plan-generator` 使用。它定义**计划文档结构**，不授权当前 Runtime 实施代码。

## 1. 计划事实源

正常路径：GitHub `【开发·实施计划】` 主 Issue + 评论。

- 主 Issue：目标、范围、快照、总体策略、Task Index、DAG、Contract 摘要、总体验收、真实性边界；
- 规划评论：来源索引、当前实现事实、搜索/传播、File Structure、风险；
- Task 评论：每个 Task 一条自包含派工合同。

禁止把本地 `plan.json`、`DEVELOPMENT-PLAN.md`、实施状态 JSON 当权威事实源。GitHub 不可写时使用 handoff 协议。

## 2. 稳定 ID

- 需求 `R01`；
- 来源 `S01`；
- 事实 `F01`；
- 搜索 `Q01` / 命中 `H01`；
- 传播 `P01`；
- 契约 `C01`；
- 风险 `K01`；
- Task `T01`；
- `ADR-01 / QUESTION-01`。

计划修订使用 `rN`，实质变化时更新受影响 Task Revision，不静默删除历史决定。

## 3. 主 Issue 模板

```markdown
# 【开发·实施计划】<交付目标>

- 计划修订: r1
- 源码快照: <branch/head/hash>

## 目标 / 非目标
...

## 来源决定
- R01 ← S01 ...

## 当前源码快照
...

## 总体策略
...

## Task Index
| Task | Rev | Complexity | Delivery | Depends On | Write Set | Status |
|---|---:|---|---|---|---|---|

## DAG
...

## Contract Catalog
...

## ADR / Blocker
...

## 总体验收
- [ ] ...

## 真实性边界
- 已读取: ...
- 未验证: ...
```

## 4. Source / Fact / Search / Propagation

非平凡事实必须可追溯。搜索命中必须分类，所有 create/modify/delete 必须闭合到 File Structure 和 Task。

## 5. File Structure

| File | Type | Action | Current | Target | Reason | Propagation | Task |
|---|---|---|---|---|---|---|---|

测试、配置、fixture、migration、文档和 generated 文件都是一等文件；是否新增/修改测试文件由真实测试合同决定。

## 6. Contract Catalog

每个跨 Task Contract 至少包含 Producer、Consumer、Signature/Schema、Invariant、Error Behavior、Compatibility/Migration。消费者 Task 要展开关键合同，不能只留引用 ID。

## 7. Task 模板

```markdown
## T01：<标题>
- Revision: r1
- Complexity: S/M/L
- Delivery: <单一交付物>
- Depends On: ...
- Exclusive Resources: ...

### 证据与来源
...

### 修改前阅读
1. `path#symbol` — purpose

### Consumes / Produces / Invariants
...

### 修改范围
Allowed: ...
Forbidden: ...
Write Set: ...

### 实现要求
1. `path#symbol`
   - Action: create/modify/delete
   - Required behavior/structure: ...
   - Postcondition: ...

### 验证义务
- Contract/Regression to prove: ...
- TDD Red/Green/Refactor/Regression assertion: ...
- Known repo unit/integration/contract/component command (if verified): ...

### Compatibility / Migration / Rollback / Observability
- 仅适用项

### Risks
- K01 ...

### Acceptance
- [ ] ...
```

## 8. 复杂度与拆分

- S：局部低传播；
- M：常规跨文件/层；
- L：跨模块/服务、迁移、复杂状态/并发、外部合同或高风险。

一个 Task 一个主要交付物；优先按 Contract、Storage/Migration、Core、Caller/UI、Cleanup/Release 拆。确实必须原子修改时记录拆分豁免。

## 9. 开发 TDD 验证边界

Task 仅列代码实现需要的 Unit、Integration、Contract、Component 自动化测试和 focused regression。必须给出具体断言与可核对的真实命令；未实际执行不写成通过。**不创建业务测试 Task、E2E Task，不要求 Coding Agent 启动系统 E2E 或完整外部环境**。即使独立测试方案已存在，也不把其验收条目映射成开发 Task 的完成门。

## 10. 发布前完整性检查

- Requirement → Task；
- Fact → Source；
- Search → Propagation → File → Task；
- Contract Producer/Consumer/Dependency；
- DAG 无环；
- Write Set 冲突可解释；
- 重大 Decision 没有被计划阶段重新发明；
- 验收和验证义务存在；
- 没有 TBD/TODO/“补必要测试”等占位。

## 11. 下游 Coding Agent Goal

Goal 指向真实 Issue/Task，说明执行边界、DAG、验证与阻塞条件。Goal 只能要求 Coding Agent 编写代码、先写并运行相应的 TDD 自动测试和局部回归；不要求业务验收、Browser/System E2E 或完整系统启动。本 Runtime 自身不执行 Goal，也不维护实施过程状态。
