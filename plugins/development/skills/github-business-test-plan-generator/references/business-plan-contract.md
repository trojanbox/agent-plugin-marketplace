# 业务测试方案：Alignment、Expected Contract、Feature/State/Invariant/Scenario

前置 Gate 通过后读取，用于业务理解校准和正式业务测试方案主体。

# 二、Business Alignment Gate（强制）

## 2.1 先建立 Business Understanding Card

在生成完整计划前先回显：

| 维度 | AI 当前理解 | 类型/来源 |
|---|---|---|
| 用户目标 | ... | user_decision / verified_fact / inference |
| Actor / 权限 | ... | ... |
| 业务入口 | ... | ... |
| 被操作对象 | ... | ... |
| 主要动作 | ... | ... |
| 成功语义 | ... | ... |
| 失败语义 | ... | ... |
| 状态转换 | ... | ... |
| 跨对象不变量 | ... | ... |
| 持久化/刷新后语义 | ... | ... |
| 非目标 | ... | ... |
| 待确认项 | ... | assumption / DECISION_REQUIRED |

## 2.2 Alignment 状态

只允许：

- `confirmed_by_user`；
- `confirmed_source`：已有当前有效讨论/结论/需求已覆盖；
- `alignment_skipped_by_user`：用户明确要求直接生成；
- `pending_alignment`。

`pending_alignment` 时必须先把“我怎么理解业务”告诉用户，集中提出真正影响预期的少量问题；**在确认前不创建最终 GitHub 业务测试方案 Issue**。可以给 `DRAFT / UNCONFIRMED` 草案，但假设不能冒充冻结合同。

`alignment_skipped_by_user` 时允许继续，所有未确认项显式标 `assumption`，计划状态写 `UNCONFIRMED_BUSINESS_CONTRACT`。

已有明确决定就继承，不重复询问用户已经回答过的问题。

# 三、Expected Business Contract 与 Current Implementation 分离

顺序必须是：

```text
User / Confirmed Source → Expected Business Contract
Current Source / UI / API → Current Implementation Baseline
二者对账 → Gap / Bug / Missing / Match
```

禁止从“源码现在这样写”推导“业务就应该这样”。

对账状态：`MATCH / IMPLEMENTATION_GAP / POTENTIAL_BUG / NOT_IMPLEMENTED / CONTRACT_CONFLICT / UNVERIFIED`。

# 四、Feature Catalog

| Feature ID | 用户目标 | 入口 | 对象 | 成功语义 | 失败语义 | 非目标 |
|---|---|---|---|---|---|---|
| F01 | ... | ... | ... | ... | ... | ... |

Feature 按用户可理解的业务能力拆，不按文件/组件/函数拆。

# 五、State Matrix

识别真正改变预期的状态维度，例如：新建/已有、当前/非当前、单对象/多对象、导航关联、权限、初次/reload/reopen、空数据/历史数据、正常/业务失败。

使用等价类、边界值、风险优先和 pairwise 控制组合爆炸，不做所有维度笛卡尔积。

# 六、Cross-object Invariants

业务测试必须主动检查“目标动作有没有带坏其它东西”。删除 A 时例如检查 B/C 仍存在、共享导航/配置不被清空、非目标数据不被改写、当前路由进入合法后继状态、reload/reopen 后结果保持、失败不留下半完成状态。

每个关键 Invariant 分配稳定 ID：`INV-01`。

# 七、Scenario 设计

| Scenario ID | Feature | 前置状态 | 用户动作 | Expected Result | Invariant | 风险 |
|---|---|---|---|---|---|---|
| S01 | F01 | ... | ... | ... | INV-01 | ... |

优先覆盖 happy path、关键状态分支、失败/取消、持久化/刷新、非目标对象不变量、历史回归缺陷和用户明确关心的低概率高影响路径。

技术性的 crash/race/reconnect/fault injection 不在这里展开；如果它们会改变业务预期，只写业务结果合同，再交给技术测试方案设计注入与验证。

# 八、Gherkin

```gherkin
Scenario: <业务语义标题>
  Given <用户可理解的业务前置>
  And <必要对象/状态>
  When <从真实产品入口执行的用户动作>
  Then <用户可观察的目标结果>
  And <关键非目标对象仍满足 INV-xx>
```

Given 不写测试框架内部实现；When 使用用户/公开业务入口；Then 证明业务结果和不变量，不能用“HTTP 200 / 页面没报错”代替业务成功。

# 九、Business Evidence Contract

定义下游执行时要保留的业务证据：操作前目标/非目标状态、关键动作、操作后用户可见状态、reload/reopen 后状态、失败提示与业务状态、非目标对象不变量。

这里只定义“证明业务成立需要看到什么”，不设计选择器、Mock、DB Seed、Harness 实现。

# 十、Technical Test Handoff

| Scenario | 执行面 | 数据前置 | 关键 Invariant | 稳定性风险 | 需要技术方案 |
|---|---|---|---|---|---|
| S01 | Browser | ... | INV-01 | 中 | yes/no |

如果用户只要业务方案，不强制同时生成技术测试方案。
