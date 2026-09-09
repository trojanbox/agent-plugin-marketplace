# Practice & Persistence / 实践转化与长期维护

在需要把认知转成真实经验、设计最小实践实验，或维护长期 Domain Knowledge Pack 时读取。

## 1. Gap Priority

优先研究同时满足以下条件的缺口：

- 会阻塞近期高影响 Decision；
- 当前判断容易犯方向性错误；
- 新证据可能明显改变行动；
- 可以在合理成本内获得可靠信息或反馈。

如果一个知识点很有趣，但不会改变当前 Decision、Claim 或实验设计，把它放入 `Later / Nice to know`。

## 2. Experience Conversion Loop

将值得验证的 `HYPOTHESIS` 转成：

```text
Hypothesis
→ 适用条件
→ 如果成立会观察到什么
→ 最便宜的区分性实验
→ 预期结果 / 失败条件
→ 实际结果
→ 解释替代项
→ Claim Update
```

实验应优先改变一个高杠杆未知量，避免一次同时更改太多变量导致结果无法解释。

真实结果出现后至少更新：

- 原判断是否保留、降级或废弃；
- 哪些条件得到确认/被推翻；
- Decision Readiness 是否变化；
- 下一步最有信息增益的动作是什么。

## 3. Learning Log

每个重要更新可以记录：

```text
Date
Decision / Claim
Previous belief
New evidence / action
Observed result
Interpretation
Alternative explanations
Updated belief
Status change
Next verification
```

不要把“做过一次”自动写成稳定规律；只有跨多轮、跨情境仍能复现时，才逐渐提高经验权重。

## 4. 长期 Domain Knowledge Pack

用户明确要求长期复用时，默认在其目标工作区维护：

```text
.agents/domains/<domain-slug>.md
```

第一版保持单文件，真实膨胀后再拆分。建议结构：

```markdown
# Domain

## Current Goal
## Learning Contract
## Domain Map
## Core Vocabulary
## Actors & Incentives
## Value / Money / Information Flows
## Core Decisions
## High-Leverage Variables
## Claim Ledger
## Unknowns
## Evidence Notes
## Experiments & Learning Log
## Deprecated Beliefs
## Maturity
## Next Actions
## Changelog
```

## 5. 更新规则

- 新证据先判断来源、日期、适用范围，再更新模型；
- 已确认错误的旧 Claim 改为 `DEPRECATED`，保留 `replaced by`；
- 条件变化导致旧规律失效时，优先缩小 Scope，避免直接删掉历史；
- 新研究材料与真实实践反馈分开记录，二者的证据性质不同；
- 每轮更新优先写“哪些 Decision 发生变化”，避免日志只有资料摘要。

## 6. Exit Gate

当前轮可以停止，当且仅当：

- 近期关键 Decisions 已达到可接受 readiness；
- 高影响 Unknown 已被解决、转成可验证 Hypothesis，或明确接受风险；
- 继续查资料短期内不会明显改变行动；
- 下一步需要真实实践才能获得更高价值证据。

这时应主动进入实践，不继续用阅读替代反馈。
