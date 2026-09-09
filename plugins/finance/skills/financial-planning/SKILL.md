---
name: financial-planning
description: "用于个人/家庭财务体检与长期规划：收入支出、净资产、现金流、应急金、债务、保险需求、财务目标、资产配置、退休与长期储蓄。适合‘帮我看看财务状况/钱怎么规划/应急金留多少/先还债还是投资/未来几年怎么安排’。涉及具体税务、养老金或账户额度时必须先确认国家/地区和当前规则。"
visibility: workflow
phase: planning
optional_uses: "data/data-exploration,data/data-validation"
---

# Financial Planning / 个人与家庭财务规划

执行前读取 `../../shared/finance-core/FINANCE_EVIDENCE.md`。

## 唯一目标

把个人/家庭财务信息转换成一套**有优先级、能执行、能复盘**的财务计划。本 Skill 已包含基础“财务体检”，第一版不再拆 `personal-finance-review`。

## 1. Planning Frame

尽量确认：

- 国家/地区；
- 家庭结构；
- 年龄/时间范围（用户愿意提供时）；
- 稳定/波动收入；
- 月度/年度支出；
- 资产；
- 负债和利率；
- 保险；
- 当前投资；
- 近期/中期/长期目标；
- 风险承受能力与流动性需求。

无需一次收齐。缺少信息时先做 `PARTIAL` 分析，并列出真正会改变决策的数据缺口。

## 2. Financial Health Snapshot

计算/整理：

- Net worth；
- monthly/annual cash flow；
- savings rate；
- liquid assets；
- debt load；
- fixed obligations；
- emergency reserve；
- investable surplus。

区分一次性支出和结构性支出。

## 3. Cash Flow & Spending

识别必需支出、可调整支出、订阅/重复支出、lifestyle creep、大额不规则支出。目标是改善自由现金流质量，不机械套固定预算比例。

## 4. Emergency Fund

根据收入稳定性、家庭责任、医疗/保险覆盖、固定支出、可快速变现资产、职业/行业波动给合理储备范围和理由。

不要机械给所有人同一个“3/6/12 个月”。

## 5. Debt Strategy

列 balance、interest rate、minimum payment、prepayment penalty（如有）和地区相关特殊性。

优先判断高成本负债和流动性风险。可以比较 avalanche / snowball，同时说明总利息与行为执行之间的取舍。

## 6. Goals

每个目标定义 amount、target date、priority、current funding、required periodic contribution、appropriate risk horizon。

短期确定性支出不应默认用高波动资产承担。

## 7. Insurance / Protection

只做保障结构检查：重大风险是否覆盖、保障额度是否匹配家庭义务、是否明显重复。不在缺少地区/条款/资质信息时推荐具体保险产品。

## 8. Investment & Asset Allocation

在现金流、应急金和高成本负债得到处理后，再讨论长期投资：horizon、liquidity、capacity for loss、risk tolerance、diversification、rebalancing discipline。

用户提供已有证券组合并问具体风险时可转/组合 `portfolio-analysis`。

## 9. Retirement / Long-term Projection

可以做通用现金流投影，但税优账户、养老金、社保、退休规则、税率/缴费上限都受 Jurisdiction Gate 约束，必须使用当前地区规则。

## 10. Action Plan

最终必须给有序行动：

- **Now**：未来 30 天；
- **Next**：未来 3–12 个月；
- **Later**：一年以上。

每项动作注明目的、金额/范围（证据允许时）、触发条件、重新评估时间点。

## 默认输出

1. Financial Snapshot
2. Key Strengths / Risks
3. Cash Flow
4. Emergency Fund
5. Debt
6. Goals
7. Protection
8. Long-term Investment / Retirement
9. Prioritized Action Plan
10. Assumptions & Missing Data
11. Jurisdiction-dependent Items

## Composition

复杂账单/资产负债表可组合 `data/data-exploration`；正式依赖大量计算结果时可组合 `data/data-validation`。
