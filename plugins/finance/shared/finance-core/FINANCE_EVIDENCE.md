# Finance Evidence & Safety Core

这是 Finance Category 的共享证据协议。各 Finance Skill 执行前读取并遵守。

## 1. Current-data Gate

以下事实默认具有时效性，不能依赖模型训练记忆作为当前事实：

- 股票/ETF/指数/债券/商品/外汇/加密资产价格；
- 市值、EV、P/E、EV/EBITDA、收益率、波动率等市场衍生指标；
- 最新季度/年度财报、guidance、earnings date、consensus；
- 利率、收益率曲线、通胀、就业、GDP、信用利差、央行政策；
- 当前持仓价值、资产权重与组合风险。

若当前环境可以联网或有市场数据工具，应先核验。无法获得当前数据时明确写 `STALE_OR_UNAVAILABLE`，并说明结论受什么影响。

所有关键市场/财务数据至少带一个：

- `as of YYYY-MM-DD`；
- `FY2026 / Q2 2026 / TTM` 等报告期；
- 数据发布日期。

## 2. Source Priority

根据任务选择最直接的一手来源：

1. 监管披露、交易所、公司 IR、官方财报/演示稿/公告；
2. 央行、统计局、财政/监管机构、官方宏观数据库；
3. 可信市场数据、consensus、机构级数据库；
4. 高质量财经媒体与专业研究；
5. 社区、社交媒体、论坛用于 sentiment/观点证据，不承担核心财务事实。

搜索摘要只用于发现来源。关键结论尽量回到原始披露或原始数据。

## 3. Evidence Labels

重要结论区分：

- `FACT`：来源直接支持的事实；
- `CONSENSUS`：市场/分析师共识或公开预期；
- `INFERENCE`：基于多个事实的推断；
- `INVESTMENT_VIEW`：分析后的投资判断；
- `UNKNOWN`：当前证据不足。

不要把 management guidance 当成已经实现的事实，也不要把单一分析师预测写成“市场共识”。

## 4. Calculation Discipline

涉及计算时：

- 明确币种、单位、时间口径、GAAP/IFRS/Non-GAAP；
- 区分 reported / adjusted；
- 区分 basic / diluted shares；
- EV 与 Equity Value 之间的桥接要显式；
- 现金、债务、少数股东权益、优先股、投资资产等调整不得重复计算；
- 同比/环比/复合增长率必须注明起止期；
- 不能因数据缺口伪造精确小数。

能用计算器/代码确定的数学部分优先确定性计算，LLM 负责解释含义和假设。

## 5. Scenario & Uncertainty

预测不是事实。至少在关键判断中说明：

- 核心假设；
- 上行/下行驱动；
- 哪些变量最敏感；
- 什么证据会改变当前判断；
- 数据或模型限制。

投资 thesis 应包含 `Risk / Invalidation / What would change the view`，避免只收集支持原观点的证据。

## 6. Execution Boundary

Finance Skill 默认提供研究、分析、规划与决策支持，不自动：

- 下单、调仓或连接券商执行交易；
- 代表用户签署金融产品或开立账户；
- 将不确定的模型观点包装成保证收益或确定性价格预测。

若未来 Runtime 增加交易执行能力，必须是独立 Skill/工具，并建立显式确认、权限和风险 Gate。

## 7. Personal Finance Jurisdiction Gate

个人财务中的税率、税优账户、养老金、社会保障、遗产、保险监管等规则高度依赖地区。涉及这些结论时：

1. 先确认国家/地区以及必要的税务身份；
2. 使用当前有效规则；
3. 无法确认时只提供通用结构，不编造当地具体额度/税率/法律结论。
