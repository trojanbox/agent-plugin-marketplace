# Watchlist & Signal Contract / 观察池与信号合同

当任务涉及建立/重构观察池、ETF 行业雷达、持续状态迁移或重复扫描时读取。

## 1. Watchlist Canonical Fields

每个观察条目至少维护：

| Field | Meaning |
|---|---|
| Instrument | 名称、ticker/代码、市场、资产类型 |
| Radar Role | 为什么值得跟踪：行业代表、宏观敏感资产、战术主题等 |
| Horizon | 长期 / tactical / event window |
| Thesis | 当前成立需要什么 |
| Trigger | 什么新事实会把状态升级 |
| Invalidation | 什么事实出现后应降级或移除 |
| Status | NO_SETUP / WATCH / NEAR_TRIGGER / ACTIONABLE / INVALIDATED |
| Last Checked | 最近一次核验时点 |

如果环境支持项目级持久化，可以更新同一份 canonical watchlist；如果没有真实持久化能力，只输出当前快照，不假装保存成功。

## 2. Initial Admission Gate

标的进入观察池前至少回答：

1. 为什么它能代表需要观察的风险/行业/主题？
2. 是否与现有观察项高度重复？
3. 有哪些能被后续数据验证的 trigger / invalidation？
4. 工具结构和流动性是否允许在目标 horizon 内行动？

观察池不是“大而全自选股”。同一暴露下优先保留少量代表标的。

## 3. Recurring Dynamic Signals

重复扫描优先看变化而非重复描述静态事实：

- 催化剂时间与结果；
- earnings / policy / supply-demand / index rebalance 等新事实；
- 预期修正与当前价格是否已经计入；
- 相对强弱、成交量、流动性和 breadth；
- fund flow / positioning（来源可靠时）；
- valuation / yield / spread / risk-reward 的变化；
- 新风险、监管、供给、竞争或宏观冲击；
- thesis invalidation 是否被触发。

技术与资金信号是确认/风险证据，不替代基本事实。

## 4. ETF Radar Checks

### 4.1 Initial / Low-frequency structure checks

首次加入、指数规则变化或定期复核时检查：

- 跟踪指数及编制/再平衡规则；
- 前十大持仓、行业/主题集中度；
- 与其他观察 ETF / 当前组合的底层重合；
- AUM、成交活跃度、bid-ask spread（可得时）；
- 管理费及其他主要持有成本；
- tracking difference / tracking error；
- ETF 结构、申赎机制与特殊限制；
- QDII 额度、跨境申赎、明显折溢价风险（适用时）。

### 4.2 Recurring market checks

日常/周期扫描更关注：

- 行业或主题基本面与盈利预期方向；
- 指数/底层成分估值位置；
- 资金流与成交变化；
- 相对市场/同类 ETF 的强弱；
- breadth 与集中推动是否健康；
- 政策、产业、库存、价格、订单、资本开支等催化；
- 折溢价、流动性和交易拥挤；
- 已知事件风险和 catalyst window。

不要因为“行业长期逻辑很好”直接把 ETF 升级为 `ACTIONABLE`；长期逻辑、当前价格和当前触发条件必须分开判断。

## 5. State Transition Rules

### NO_SETUP → WATCH

需要至少出现可验证 thesis，且标的结构/流动性适合继续跟踪。

### WATCH → NEAR_TRIGGER

至少一个关键触发器接近，同时价格/估值/预期没有明显把结果完全计入。仅“最近开始上涨”不够。

### NEAR_TRIGGER → ACTIONABLE

至少同时满足：

- 触发器或事实变化已经出现/高度临近；
- 存在清楚的预期差或赔率；
- 工具流动性与结构允许执行；
- downside / invalidation 可以清楚表达；
- 没有新的证据直接破坏 thesis。

### Any State → INVALIDATED

核心逻辑、关键数据或工具结构发生实质破坏；不能因为已经持有/已经跟踪就拖延失效判定。

## 6. Change-first Reporting

已有上次状态时，先给变化：

```text
Instrument | Previous | Current | New Evidence | Trigger / Invalidation | As-of
```

只有用户要求全量复盘，或者观察池结构发生明显变化时，再重复完整背景。

## 7. Automation Handoff

用户要求“每天/每周检查”时，本 Skill 只定义监控合同：

- canonical watchlist；
- 每次要核验的动态字段；
- 哪些状态变化需要通知；
- 什么情况无需打扰；
- 哪些数据缺失时必须降级为 `UNKNOWN / STALE_OR_UNAVAILABLE`。

宿主没有真实自动化能力或任务未创建时，必须明确没有持续执行能力。
