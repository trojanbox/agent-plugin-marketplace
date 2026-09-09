# Finance Skill Method Sources

Last reviewed: 2026-08-26

本文件只记录 Finance Category 的公开方法来源与本地化方向，不参与 Runtime 路由，也不要求执行时逐一加载。

## Anthropic Financial Services

Source: https://github.com/anthropics/financial-services

本 Runtime 主要吸收并本地化以下思路：

- Equity Research 把 company fundamentals、market expectations、valuation context 与 thesis 连起来；
- Earnings Analysis 强制先验证报告期/发布日期/数据时效，再做 beat/miss、guidance、estimate 与 thesis update；
- Financial Analysis 使用 DCF / Comps / scenario / sensitivity，并强调口径一致和模型可复核；
- Wealth Management 将现金流、目标、资产配置和长期计划组织成可执行工作流。

没有复制 Anthropic 的机构报告篇幅、Word/Excel 输出要求，也没有绑定其 MCP/数据 Connector。

## OpenAI Role-Based Plugins / Financial Markets

Source: https://github.com/openai/role-based-plugins

参考其“金融市场工作流应围绕 public-equity research、earnings、valuation、model update、risk review、investment memo 等任务组织”的角色化设计。当前 Runtime 不复制 Connector 绑定，只保留与 ChatGPT 容器匹配的研究与分析方法。

## Questflow Investor Skills

Source: https://github.com/questflowai/investorskills

主要吸收：

- Facts / assumptions / judgment 分离；
- thesis 不只写支持理由，还必须写 Risk / Invalidation；
- 明确 What Would Change The View；
- 不强迫模型在证据不足时输出 buy/sell；
- 不因缺失或陈旧市场数据制造确定性判断。

没有按投资大师/交易者逐人复制 Skill，避免 Runtime 路由污染。

## Open Accountant Skills

Source: https://github.com/openaccountant/skills

个人理财部分吸收其现金流、spending review、net worth、emergency fund、debt payoff、financial goals 等任务结构，并在本 Runtime 中合并为单一 `financial-planning`，避免第一版拆成过多细 Skill。

没有绑定 Wilson、银行同步或美国税务实现；税务/养老金/账户制度统一经过 Jurisdiction Gate。

## 本地化原则

1. 适合当前 ChatGPT 容器：通过 Web、用户文件、计算与现有 Data/Research Skills 完成；
2. 不假设 Bloomberg / FactSet / LSEG / 券商 MCP 必然存在；
3. 当前数据必须验证并注明 as-of；
4. 逻辑 Skill 数量保持克制，优先在单 Skill 内提供模式而不是不断拆分；
5. 默认只研究、分析与规划，不执行交易。
