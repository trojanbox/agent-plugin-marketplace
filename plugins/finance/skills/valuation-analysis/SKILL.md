---
name: valuation-analysis
description: "用于对上市公司/可投资资产做系统估值：DCF、Comparable Companies、历史倍数、SOTP 与 Bear/Base/Bull 情景，显式记录收入/利润/FCF/WACC/终值/净债务/稀释股数等假设并做敏感性分析。适合‘合理价值多少/DCF 算一下/和同行比贵不贵/目标估值区间/SOTP’。公司整体投资逻辑使用 equity-research。"
visibility: workflow
phase: analysis
optional_uses: "research/deep-research"
---

# Valuation Analysis / 估值分析

执行前读取 `../../shared/finance-core/FINANCE_EVIDENCE.md`。

## Skill Composition / 能力组合

- 用户已提供可核验财务数据，且公开基准、同业和利率输入能够由少量权威来源确认时，不加载 `research/deep-research`；
- 需要系统寻找可比公司、分部资料、行业周期、资本成本依据、交易先例或多来源冲突核验，且这些证据会改变关键估值假设时，按需组合 `research/deep-research`；
- 外部研究只负责证据获取与核验，本 Skill 保留方法选择、口径统一、模型计算、敏感性与估值区间的最终分析语义。

## 唯一目标

建立一个**假设透明、数学可复核、方法互相校验**的估值区间，而不是给一个没有来源的“目标价”。

## Method Selection Gate

先判断业务类型：

- 稳定产生现金流 → DCF 通常适用；
- 有成熟同业 → Trading Comps；
- 多业务分部估值逻辑差异大 → SOTP；
- 金融机构 → P/B、P/E、ROE/资本充足率等行业方法，普通 EV/EBITDA 可能不适合；
- 早期高增长/尚未盈利 → 基于业务特征选择收入倍数、单位经济或情景法，并明确局限。

不要机械对所有公司跑同一套 DCF + P/E。

## 1. Valuation Date & Inputs

核验 price as-of、diluted shares、market cap、cash/debt/investments、EV bridge，以及利率/WACC 市场输入日期。

## 2. Financial Base

统一 LTM/NTM/FY、reported/adjusted、Revenue/EBITDA/EBIT/EPS/FCF、一性项目、SBC/lease/capitalized R&D 等口径。

## 3. DCF

适用时显式列：

- revenue growth；
- operating margin / EBIT；
- tax；
- D&A；
- capex；
- working capital；
- unlevered FCF；
- forecast horizon；
- WACC；
- terminal growth 或 exit multiple。

结果必须展示 Enterprise Value → net debt / non-operating asset bridge → Equity Value → diluted per-share value。

### Sensitivity

至少对两个关键变量做二维或明确区间敏感性，例如 WACC × terminal growth，或 revenue growth × terminal margin。

## 4. Comparable Companies

可比公司优先匹配业务、增长、利润、资本强度、地区和风险，不以数量为目标。

至少比较 valuation date、EV/market cap、增长、margin，以及适用的 P/E、EV/EBITDA、EV/Sales 等倍数，并解释 premium/discount 与不可比之处。

## 5. Historical Multiples

比较当前倍数和自身历史时，先检查历史阶段的增长、利润结构和业务组合是否仍可比。重大业务转型后不能机械使用旧均值。

## 6. SOTP

不同分部应各自选择合理 metric/multiple/DCF，再加总并调整净债务、公司层成本、少数股权等。Holding-company discount 必须有依据。

## 7. Scenario Valuation

| Scenario | Core Assumptions | Earnings/FCF | Valuation Method | Implied Value |
|---|---|---|---|---|
| Bear | | | | |
| Base | | | | |
| Bull | | | | |

场景概率只有在用户需要且证据允许时给，不伪造精确概率。

## 8. Cross-check

比较 DCF、Comps、Historical multiples、SOTP（适用时）。如果差异大，先解释模型差异原因，不能简单取平均。

## 默认输出

1. Valuation Date & Data Quality
2. Method Selection
3. Key Assumptions
4. DCF（适用时）
5. Comps
6. Historical / SOTP（适用时）
7. Bear/Base/Bull
8. Sensitivity
9. Valuation Range
10. Biggest Model Risks
11. What Would Change The Range
12. Sources

估值是对假设的映射，不是确定价格预测。
