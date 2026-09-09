---
name: macro-analysis
description: "用于分析当前或历史宏观市场环境：增长、通胀、就业、货币政策、利率/收益率曲线、流动性、信用、美元/汇率、商品和风险偏好，并解释这些变量如何传导到股票、债券、行业和投资风格。适合‘现在是什么宏观环境/降息意味着什么/流动性怎么看/通胀对市场有什么影响’。单只股票基本面使用 equity-research。"
visibility: workflow
phase: analysis
optional_uses: "research/deep-research"
---

# Macro Analysis / 宏观与市场环境分析

执行前读取 `../../shared/finance-core/FINANCE_EVIDENCE.md`。

## 唯一目标

建立一张**当前宏观 regime → 变化方向 → 资产传导机制 → 关键风险**的证据地图。

不使用单一指标给市场贴标签，也不把“降息=股票一定涨”这类简化关系当结论。

## 1. Frame

确定地区（全球/美国/中国/欧元区/日本等）、时间（当前/历史）、关心的资产/行业和 horizon。

## 2. Growth

观察 GDP/nowcast、PMI/industrial production、consumption/retail、labor market、corporate earnings/capex（适用时）。

区分水平、方向和加速度：增长仍高但放缓，与已经进入衰退不是同一 regime。

## 3. Inflation

观察 headline/core、goods/services、wages、housing/rent、commodity inputs、inflation expectations，并标记数据发布日期。

## 4. Monetary Policy & Rates

分析 policy rate、central-bank communication、real rates、yield curve、term premium（证据允许时）、market-implied path 与官方 guidance 差异。

利率变化必须区分增长冲击、通胀冲击、政策预期或技术性流动性因素。

## 5. Liquidity & Credit

根据地区和可得数据检查 central-bank balance sheet、money/liquidity proxies、bank lending/financial conditions、IG/HY spreads、default/delinquency indicators。

不把某一个“流动性指标”当万能解释。

## 6. Currency & Commodities

适用时分析 broad USD/key FX、oil/industrial metals/gold，以及其对进口通胀、企业利润和地区资产的传导。

## 7. Regime Map

| Dimension | Level | Direction | Evidence | Confidence |
|---|---|---|---|---|
| Growth | | ↑/→/↓ | | |
| Inflation | | ↑/→/↓ | | |
| Policy/Rates | | | | |
| Liquidity | | | | |
| Credit | | | | |
| Risk Appetite | | | | |

不能为了整齐强行给高置信度。

## 8. Transmission To Assets

使用条件链：

```text
Macro shock
→ rates / earnings / discount rate / credit / FX
→ sector/style sensitivity
→ possible asset impact
```

例如：通胀回落且增长稳定导致的降息，与衰退导致的降息，资产传导可能完全不同。

## 9. Scenarios

至少给 Base、Upside/soft-landing-like、Downside/recession-or-inflation-risk 三类。每个场景写触发数据、利率/信用/盈利方向、最敏感资产/行业、推翻条件。

## 默认输出

1. Macro Snapshot & As-of
2. Growth
3. Inflation
4. Rates / Policy
5. Liquidity / Credit
6. Currency / Commodities（适用时）
7. Regime Matrix
8. Transmission To Assets
9. Scenarios
10. What Would Change The View
11. Key Data To Watch Next
12. Sources

## Composition

跨国家、跨周期或全面多来源宏观研究时可组合 `research/deep-research`；宏观分析保留最终 regime 和资产传导语义。
