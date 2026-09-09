---
name: data-validation
description: "用于在分享数据分析、SQL、图表或结论前做 QA：检查问题定义、数据选择、grain、Join、过滤、聚合、分母、时间窗口、统计偏差、图表误导和结论是否被数据支持。若验证需要重跑关键检验或重做问题图表，本 Skill 保留主路由并按需组合 statistical-analysis / data-visualization。输出 Ready to share / Share with caveats / Needs revision。"
visibility: workflow
phase: verification
optional_uses: "data/statistical-analysis,data/data-visualization"
---

<!-- Materially adapted from Anthropic Knowledge Work data skills under Apache-2.0; host-specific connector/tool assumptions were changed. -->

# Data Validation

## 目标

把“看起来合理的分析”变成经过方法、计算、偏差和叙事检查的分析。

## Skill Composition / 能力组合

- 用户的主目标是**审核已有分析/结论**，验证过程中需要独立重跑一个关键显著性检验、效应量或置信区间时：本 Skill 为主，组合 `data/statistical-analysis` 提供验证证据。
- 用户的主目标是审核现有图表，且要求把确认有问题的图重新画成不误导的版本时：本 Skill 为主，组合 `data/data-visualization`。
- 如果用户没有现成分析需要 QA，而是从头要求完成新的统计推断，直接使用 `data/statistical-analysis`；如果主要交付物就是图表，直接使用 `data/data-visualization`。
- 组合能力只提供重算/重画证据，最终 `Ready to share / Share with caveats / Needs revision` 仍由本 Skill 判断。

## 1. Methodology Review

检查：

- 问题是否答对；
- population / cohort 是否定义准确；
- grain 是否匹配聚合；
- 数据源和时间范围是否适合；
- metric 定义与利益相关者理解是否一致；
- baseline 是否可比；
- 关键假设是否公开。

## 2. Calculation QA

有底层数据/查询时尽量 spot-check：

- 关键数字独立重算；
- subtotal vs total；
- percentage / denominator；
- filters 一致性；
- period 对齐；
- unit / timezone；
- join 前后 row count。

### Join Explosion

Many-to-many Join 可能悄悄放大 COUNT/SUM。出现 Join 时检查关系基数和 join 后行数，必要时回到底层 grain。

### 其他高频陷阱

- average of averages；
- incomplete period；
- denominator shifting；
- survivorship / selection bias；
- timezone mismatch；
- Simpson's paradox；
- multiple testing；
- look-ahead；
- cherry-picked range。

## 3. Reasonableness

做 smell test：

- 数量级是否符合已知规模；
- rate 是否在合理范围；
- 大幅跳变是否有解释；
- 是否出现 0% / 100% / 完美吻合等可疑结果；
- 能否用另一条路径 cross-check。

## 4. Visualization QA

检查图表：

- bar baseline 是否合适；
- scales 是否让比较失真；
- 标题是否准确描述展示内容；
- 时间范围和单位是否清楚；
- 图表是否暗示不存在的因果关系；
- 是否使用 3D、双轴或截断轴造成误导。

## 5. Narrative QA

逐条验证：

- 结论是否真的由数据支持；
- 替代解释是否被忽略；
- uncertainty 是否透明；
- recommendation 是否跨越了证据；
- 相关是否被写成因果；
- caveat 是否放在读者能看到的位置。

## 6. Overall Assessment

只用三级：

- **Ready to share**：方法和关键计算可靠，没有阻断问题；
- **Share with caveats**：核心结论可用，但必须带明确 caveat；
- **Needs revision**：存在错误、方法问题或缺失验证，修复前不应用于决策。

## 输出

```text
Overall Assessment
Methodology Review
Issues Found (High / Medium / Low)
Calculation Spot-checks
Visualization Review
Required Caveats
Suggested Fixes
```

如果没有底层数据，明确哪些项只能审逻辑、无法复算，不能假装“验证通过”。
