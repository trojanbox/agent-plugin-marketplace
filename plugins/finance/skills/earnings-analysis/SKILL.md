---
name: earnings-analysis
description: "用于上市公司财报前预期梳理或财报后结果分析：核验最新报告期，比较实际值/consensus/guidance，分析收入、EPS、利润率、分部、现金流、管理层指引、预期修正、股价反应与 investment thesis 变化。适合‘这次财报怎么样/beat 还是 miss/财报前看什么/Q2 结果意味着什么’。完整公司研究使用 equity-research，详细估值使用 valuation-analysis。"
visibility: workflow
phase: analysis
optional_uses: "research/deep-research"
---

# Earnings Analysis / 财报分析

执行前读取 `../../shared/finance-core/FINANCE_EVIDENCE.md`。

## Skill Composition / 能力组合

- 财报文件、公司指引和必要市场数据已经足以回答单季度问题时，不加载 `research/deep-research`；
- 需要跨多期文件、行业资料、竞品财报、管理层历史表述或多来源冲突核验，且这些证据会实质改变财报判断时，按需组合 `research/deep-research`；
- 外部研究只负责补充和核验证据，本 Skill 保留报告期口径、beat/miss、经营驱动、指引变化与投资逻辑更新的最终分析语义。

## 唯一目标

围绕一个明确报告期回答：**市场原来预期什么，实际/即将披露什么，差异来自哪里，这些变化对未来盈利与 investment thesis 有什么影响？**

本 Skill 同时支持：

- `PREVIEW`：财报发布前；
- `POST_EARNINGS`：财报发布后。

先确认模式，不能把预期值和实际值混为一谈。

## Timeliness Gate

任何当前财报分析都先确认：

- 当前日期；
- 最近一次已发布财报期；
- 用户指定季度是否已发布；
- earnings release / filing / transcript 日期；
- consensus 的 `as of` 是否早于实际结果发布。

用户说“最新财报”却给了旧季度时，用具体日期说明并切到真正最新季度，除非用户明确要历史季度。

## 来源优先级

1. Earnings release；
2. 10-Q / 10-K / 20-F / 当地监管披露；
3. Investor presentation / supplemental；
4. Earnings call transcript / prepared remarks；
5. 可靠 consensus 数据；
6. 价格反应与高质量财经报道作补充。

## PREVIEW

### Consensus Setup

整理 Revenue、EPS、关键分部/KPI、margin、prior guidance 和市场最关注的 3–6 个变量。

### Scenario Frame

至少给 Bull / Base-consensus / Bear 三种场景。每个场景说明：

- 哪些数字需要达到；
- guidance 需要怎样变化；
- 市场可能如何解释；
- 什么结果会真正改变 thesis。

价格反应只能作为条件情景，不写成确定预测。

## POST_EARNINGS

### 1. Beat / Miss

| Metric | Actual | Consensus / Prior Guide | Variance | Interpretation |
|---|---:|---:|---:|---|

不仅报差值，还要解释差异驱动。

### 2. Operating Drivers

检查 segment/geography、volume/price/mix、公司特有 KPI、gross/operating margin、opex、cash flow/capex 与 balance sheet 重大变化。

### 3. Guidance

明确 raised / maintained / lowered / withdrawn，新旧 guidance、修订原因以及新 guidance 相对 consensus 的位置。

### 4. Management Commentary

区分管理层事实陈述、管理层目标/预测和分析者推断。关注相对上一季度真正改变的措辞、优先级与风险提示。

### 5. Estimate & Thesis Update

回答：

- 下一年度收入/EPS/FCF 预期应上调、下调还是基本不变；
- 哪个关键假设被验证或削弱；
- 新风险/新催化剂；
- 是否需要进入 `valuation-analysis` 重估。

### 6. Price Reaction

需要时核验财报前收盘价、盘前/盘后和正式交易时段的可比时点。不能把一次价格波动自动归因于一个原因。

## 默认输出

### Preview
1. Earnings date / report period
2. Consensus snapshot
3. What the market is watching
4. Bull/Base/Bear
5. Key risks
6. What would change the thesis
7. Sources / data dates

### Post Earnings
1. Quick Take
2. Beat/Miss Table
3. Segment & KPI Analysis
4. Margins / Cash Flow
5. Guidance Change
6. Management Commentary
7. Estimate / Thesis Impact
8. Price Reaction（需要时）
9. What To Watch Next
10. Sources / as-of
