---
name: market-radar
description: "用于建立和持续维护股票、ETF、基金、行业或其他可投资资产的观察池，按最新市场证据重复扫描并判断状态变化、催化触发与失效。适合‘每个行业跟踪一个ETF/把新能源加到观察列表/今天观察池里有能出手的吗/每天扫一遍这些标的/哪些板块开始出现机会/这个标的是不是从观察转成可执行了’。一次性基于账户目标筛选新增标的或判断组合适配使用 portfolio-analysis；单只股票完整基本面使用 equity-research；宏观 regime 本身是主问题使用 macro-analysis。"
visibility: workflow
phase: monitoring
---

# Market Radar / 市场雷达与观察池

执行前读取 `../../shared/finance-core/FINANCE_EVIDENCE.md`。

## 唯一目标

把一组已知或待建立的候选维护成**可持续更新的观察池**，用一致的触发条件回答：哪些仍只是故事，哪些接近触发，哪些已经形成可执行 setup，哪些 thesis 已失效。

默认只研究和监控，不自动下单，也不把“进入可执行状态”写成保证收益。

## 路由边界

高信号：

- “把这些 ETF / 股票加入观察列表，后面持续盯。”
- “每个行业选一个代表 ETF 跟踪。”
- “今天观察池里有没有达到出手条件的？”
- “这个标的是不是从观察转成可执行了？”
- “每天/每周扫一遍，有状态变化再告诉我。”

不使用：

- 一次性基于账户目标找“还应该买什么” → `portfolio-analysis`；
- 对某只股票做完整业务、财务与长期 thesis → `equity-research`；
- 单次财报事件本身 → `earnings-analysis`；
- 完整 DCF / Comps / SOTP → `valuation-analysis`；
- 主要问题是利率、流动性、通胀或宏观 regime → `macro-analysis`。

如果用户先要“筛一批候选，再持续跟踪”，先由 `portfolio-analysis` 完成候选选择，再把确定的候选交给本 Skill；这是顺序组合，不把两套工作流揉成一个超级 Skill。

## 1. Define Radar Scope

确定观察对象、资产类型、市场/交易所、投资 horizon、雷达目的和检查频率。用户未给精确频率时，可以完成当前扫描，但不能声称已经建立后台持续监控。

观察池可以来自用户已有列表，也可以按明确规则建立，例如“每个行业一个代表 ETF”。建立或重构观察池、ETF 雷达、状态模型时读取 `references/watchlist-and-signal-contract.md`。

## 2. Normalize Watchlist

每个条目至少记录：

- 标的身份与资产类型；
- 为什么进入观察池；
- 关注 horizon / portfolio role（已知时）；
- 触发条件；
- 失效条件；
- 当前状态；
- `last checked / as-of`。

不能只有 ticker 列表而没有 thesis 与触发器，否则后续无法判断“变化是否重要”。

## 3. Current Scan

每次扫描只使用当前可验证数据，并标注 as-of。核心检查：

- thesis 是否仍成立；
- 催化或关键数据是否靠近/发生；
- 预期差是否扩大、收敛或已被价格计入；
- 价格、相对强弱、成交与流动性是否提供确认或风险信号；
- 估值/赔率是否改善或恶化；
- 是否出现新的失效证据或事件风险。

单一涨幅、单一资金流或单一技术指标不能独立升级状态。

## 4. State Transition

默认状态：

- `NO_SETUP`：没有可验证触发器或赔率；
- `WATCH`：逻辑值得继续看，但时点/价格/证据不足；
- `NEAR_TRIGGER`：关键条件正在接近，值得提高检查优先级；
- `ACTIONABLE`：触发、预期差/赔率、流动性和失效条件同时足够清楚；
- `INVALIDATED`：核心 thesis 或原触发逻辑已经失效。

状态可以跳转，不能为了“连续性”机械逐级升级。每次升级/降级必须写出触发它的**新证据**。

`ACTIONABLE` 只表示当前 setup 值得执行层决策；如果账户适配、仓位或组合重复暴露仍不明确，应交给 `portfolio-analysis` 判断是否适合当前组合以及承担多少风险。

## 5. Monitoring Contract

当宿主具备定时任务/自动化能力并且用户明确要求持续检查时，雷达负责定义：观察池、检查维度、状态迁移规则、触发通知条件；真正的未来调度由宿主自动化能力执行。

没有真实创建任务或持久化状态时，不声称“已经每天盯着”。重复扫描默认优先报告：状态变化、重大新证据、触发器临近、thesis 失效；没有实质变化时避免重复制造噪声。

## 默认输出

1. Radar Scope & As-of
2. Watchlist Snapshot
3. State Changes Since Last Check（有历史状态时）
4. `ACTIONABLE / NEAR_TRIGGER / WATCH / NO_SETUP / INVALIDATED`
5. Why The State Changed
6. Trigger / Invalidation / Catalyst Window
7. Portfolio Handoff Needed?（适用时）
8. Missing / Unverified Data
9. Sources
