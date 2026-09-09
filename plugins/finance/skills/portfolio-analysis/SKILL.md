---
name: portfolio-analysis
description: "用于分析已有投资组合的资产配置、单一持仓/行业/地区/货币集中度、相关性、波动与回撤、流动性、风格/因子暴露和情景风险，并识别多个持仓背后的同一隐含 thesis。适合‘帮我看看持仓风险/组合太集中吗/这些股票相关性怎么样/如果降息或科技股回撤会怎样’。单只股票研究使用 equity-research。"
visibility: workflow
phase: analysis
optional_uses: "data/data-exploration,data/statistical-analysis,data/data-visualization,data/data-validation"
---

# Portfolio Analysis / 投资组合分析

执行前读取 `../../shared/finance-core/FINANCE_EVIDENCE.md`。

## 唯一目标

回答：**这个组合真正承担了哪些风险，风险是否被表面上的“持仓数量”掩盖，以及哪些情景会同时伤害多个头寸？**

默认只分析，不自动调仓或下单。

## 输入

尽量获取 holdings/ticker/asset、position value 或数量、currency、cash、portfolio total、成本（需要时）、时间范围、benchmark（如有）、用户目标与最大可接受风险（需要配置建议时）。

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

## 默认输出

1. Portfolio Snapshot
2. Concentration Map
3. Correlation / Co-movement
4. Hidden Common Bets
5. Liquidity & Structural Risks
6. Stress Scenarios
7. Top Risks Ranked
8. Possible Risk-reduction Levers（用户要求时）
9. Missing Data / Limitations

## Composition

- 复杂持仓表首次理解 → `data/data-exploration`；
- 相关性、波动、回撤等 → `data/statistical-analysis`；
- 用户要求图表 → `data/data-visualization`；
- 正式量化结果 QA → `data/data-validation`。

这些只提供辅助能力，Portfolio Analysis 保留最终风险判断。
