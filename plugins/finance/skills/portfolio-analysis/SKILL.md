---
name: portfolio-analysis
description: "用于分析已有投资组合的资产配置、集中度、相关性、回撤、流动性、风格/因子与情景风险，也用于基于账户目标和现有暴露做一次性新增标的筛选与组合适配判断。适合‘帮我看看持仓风险/组合太集中吗/我还应该买什么/筛一批适合长期持有的/找一批未来几周几个月有明确催化的候选/长期和短期标的分别怎么看’。已建立观察池后的持续扫描、状态变化和触发监控使用 market-radar；点名单只股票完整基本面使用 equity-research；详细估值使用 valuation-analysis；宏观 regime 为主使用 macro-analysis。"
visibility: workflow
phase: analysis
optional_uses: "data/data-exploration,data/statistical-analysis,data/data-visualization,data/data-validation"
---

# Portfolio Analysis / 投资组合分析

执行前读取 `../../shared/finance-core/FINANCE_EVIDENCE.md`。

## 唯一目标

回答：**这个组合真正承担了哪些风险，风险是否被表面上的“持仓数量”掩盖；当用户要新增资产时，还要判断组合缺什么、候选承担什么角色，以及应按长期复利还是短期催化逻辑筛选。**

默认只分析，不自动调仓或下单。

## 输入

组合风险分析时，尽量获取 holdings/ticker/asset、position value 或数量、currency、cash、portfolio total、成本（需要时）、时间范围、benchmark（如有）、用户目标与最大可接受风险。

新增标的筛选时，优先获取账户 mandate、已有资产/暴露、投资 horizon、允许的资产类型、流动性需求和主要风险约束；没有精确金额也可以做定性筛选，但不能伪造组合权重。

缺少实时价格时可以基于用户提供的持仓市值分析；不能用过期价格伪造当前权重。

## 1. Portfolio Snapshot

计算/整理：

- 每个持仓权重；
- Top 5 / Top 10 concentration；
- Cash；
- Asset class；
- Sector / industry；
- Geography；
- Currency。

## 2. Concentration Risk

检查单一证券、行业、地区/国家、币种、公司规模/成长风格、同一供应链/商业模式的集中风险。

关键原则：**10 个不同 ticker 也可能只有 2–3 个真正独立的风险来源。**

## 3. Correlation & Co-movement

有足够价格序列时可组合 `data/statistical-analysis`，计算 rolling/static correlation、benchmark beta（适用时）、volatility、drawdown、tail co-movement。

必须注明样本周期和频率，历史相关性不能写成未来固定关系。

## 4. Factor / Thesis Exposure

证据允许时识别 growth/value、duration/rate sensitivity、cyclical/defensive、commodity sensitivity、地区暴露，以及 AI capex / consumer / housing / credit 等共同 thesis。

优先使用可解释的实际暴露，不为了“专业”强行套复杂因子模型。

## 5. Liquidity & Structure

检查 cash buffer、小盘/低流动性资产、fund lock-up（如有）、leverage/margin（用户提供时）、单一头寸退出难度。

## 6. Scenario / Stress Test

按组合选择真正相关的 3–6 个场景，例如：

- equity market -20%；
- long rates ±100bps；
- tech valuation compression；
- recession / credit widening；
- USD shock；
- commodity shock；
- China demand slowdown。

明确结果属于历史映射、敏感度近似还是定性压力测试，不制造虚假精确度。

## 7. Risk Prioritization

按 impact、concentration、likelihood（有证据时）、controllability、monitoring signal 排序。

## Candidate Selection Mode / 新增标的筛选

当用户问“我还应该买什么 / 帮我筛选适合长期持有的 / 找短期可能快速重估的机会 / 这两类分别应该看什么”时，先读取 `references/investment-selection-modes.md`。

核心 Gate：

- 先确定账户 mandate 与 portfolio role，再筛产品；
- 长期候选看可持续收益引擎、质量、结构优势、估值、回撤韧性和组合适配；
- 用户说“短期爆发”时可做一次性 tactical / catalyst-driven 候选筛选，必须有可观察催化、预期差、赔率、流动性和明确 invalidation，不承诺收益；候选确定后的持续观察与状态迁移转 `market-radar`；
- 普通场外主动基金通常不作为短线工具；
- 点名单只股票要做完整业务/财务/长期 thesis 时转 `equity-research`，不要在本 Skill 复制完整公司研究；
- 用户要求完整 DCF/Comps 时转 `valuation-analysis`；宏观 regime 本身是主问题时转 `macro-analysis`。

候选筛选可直接使用当前组合的定性暴露；缺少精确金额时不要伪造权重。

## 默认输出

1. Portfolio Snapshot
2. Concentration Map
3. Correlation / Co-movement
4. Hidden Common Bets
5. Liquidity & Structural Risks
6. Stress Scenarios
7. Top Risks Ranked
8. Possible Risk-reduction Levers（用户要求时）
9. Candidate Shortlist & Selection Rationale（用户要求新增资产时）
10. Missing Data / Limitations

## Composition

- 复杂持仓表首次理解 → `data/data-exploration`；
- 相关性、波动、回撤等 → `data/statistical-analysis`；
- 用户要求图表 → `data/data-visualization`；
- 正式量化结果 QA → `data/data-validation`。

这些只提供辅助能力，Portfolio Analysis 保留最终风险判断。

纯 Candidate Selection 请求按 `references/investment-selection-modes.md` 的输出合同交付，不强制机械生成完整 Portfolio Snapshot。
