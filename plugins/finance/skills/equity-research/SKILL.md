---
name: equity-research
description: "用于研究某只股票或上市公司的业务质量、财务趋势、竞争优势、资本配置、市场预期、估值背景、催化剂、风险和可证伪投资 thesis。适合‘分析一下腾讯/NVDA/某股票基本面/这家公司值得继续研究吗/长期逻辑怎么样/多空逻辑是什么’。单次财报前后重点分析使用 earnings-analysis；详细 DCF/Comps 使用 valuation-analysis；持仓组合风险使用 portfolio-analysis。"
visibility: workflow
phase: analysis
optional_uses: "research/deep-research,research/community-research"
---

# Equity Research / 股票与上市公司研究

执行前读取 `../../shared/finance-core/FINANCE_EVIDENCE.md`。

## 唯一目标

形成一份**证据可追溯、明确区分事实与判断、能够被后续新信息证伪或更新**的上市公司投资研究。

核心问题：当前业务质量、盈利能力、财务结构和行业位置如何？市场大致在预期什么？哪些关键事实可能被低估或高估？什么会让当前判断失效？

## 路由边界

高信号：

- “帮我分析一下 XX 股票/公司。”
- “XX 基本面怎么样？”
- “这家公司长期逻辑还成立吗？”
- “Bull / Bear case 是什么？”
- “市场可能错在哪里？”
- “帮我做投资 thesis。”

不使用：

- 刚发布的一季财报或财报前预期 → `earnings-analysis`；
- 合理价值、DCF、Comps、SOTP → `valuation-analysis`；
- 多只持仓的整体风险 → `portfolio-analysis`；
- 宏观经济、利率、流动性为主 → `macro-analysis`；
- 纯竞争战略、不关心盈利/估值/市场预期 → `business/competitive-analysis`。

## 工作流

### 1. Research Frame

确认公司、ticker、交易所/上市地、分析时点、投资 horizon、是否需要同业比较。Ticker/上市主体有歧义时必须消歧，不能混用 ADR、A/H 股或同名公司。

### 2. Current Snapshot

核验并标注日期：

- 当前价格；
- 最新财报期；
- 市值/EV；
- 关键估值倍数；
- 最近重要公司事件。

价格、盈利、股数、净债务必须使用可比较时点。

### 3. Business & Economic Engine

回答：

- 公司靠什么赚钱；
- 分部/地区收入与利润贡献；
- 增长来自价格、量、用户、ARPU/take rate、份额还是并购；
- 毛利、营业利润、FCF 的主要驱动；
- 资本密集度、营运资本与再投资需求；
- 网络效应、转换成本、规模优势、定价权或监管依赖是否有证据。

不要把公司宣传语直接当“护城河”。

### 4. Financial Quality

至少看多个报告期趋势：

- Revenue growth；
- Gross / operating margin；
- EPS 与稀释；
- OCF / FCF；
- Capex；
- ROIC/ROE（适用时）；
- Net debt / cash；
- SBC、回购、分红、并购等资本配置；
- 一次性项目与 adjusted 指标依赖。

重点检查利润质量和现金转化。

### 5. Industry & Competitive Position

研究行业结构、竞争者/替代品、份额、成本位置、定价权、技术/监管/渠道变化以及竞争优势的变化方向。需要全面行业证据时可组合 `research/deep-research`。

### 6. Expectations / Consensus

能获得可靠数据时，整理：

- 收入、EPS、关键 KPI consensus；
- 当前估值可能隐含的增长/利润假设；
- 最近预期修正方向；
- 已经被市场广泛知道的事实。

然后验证：**Where might consensus be wrong?** 只有证据支持时才提出预期差，不为了“有观点”强造反共识叙事。

### 7. Valuation Context

这里只做估值背景：当前倍数、相对历史、相对同业、估值与增长/利润/资本回报是否匹配。完整估值交给 `valuation-analysis`。

### 8. Catalysts, Risks & Invalidation

至少列：

- 可能推动重新定价的催化剂；
- 业务、竞争、监管、财务、估值和执行风险；
- 1–3 个可观察的 thesis invalidation 条件；
- 哪些新事实会显著改变当前判断。

### 9. Investment View

默认使用：`Constructive / Neutral / Cautious`，并标注 `High / Medium / Low confidence`。

用户明确要求 Buy/Hold/Sell 时，可以给研究意义上的倾向，但必须附带假设、时间范围、风险和失效条件，不给保证收益式结论。

## 默认输出

1. Snapshot & As-of
2. Investment View
3. Business Quality
4. Financial Quality
5. Expectations / Consensus Gap
6. Valuation Context
7. Catalysts
8. Risks & Invalidation
9. What Would Change The View
10. Missing / Unverified Data
11. Sources

## Composition

- 深度多来源研究 → 可加载 `research/deep-research`；Finance Skill 保留最终投资语义。
- 用户明确要求社区/投资者 sentiment → 可加载 `research/community-research`；社区观点只承担 sentiment 证据。
