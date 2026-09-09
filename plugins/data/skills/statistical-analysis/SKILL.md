---
name: statistical-analysis
description: "用于描述统计、分布、趋势、异常值、相关性、假设检验、效应量、置信区间和统计结果解释。适合 A/B、前后对比、分组差异和时间序列；若同一请求还要求把统计结果画出来，本 Skill 保留主路由并组合 data-visualization。已有分析主要做 QA 时使用 data-validation。"
visibility: workflow
phase: analysis
optional_uses: "data/data-visualization"
---

<!-- Materially adapted from Anthropic Knowledge Work data skills under Apache-2.0; host-specific connector/tool assumptions were changed. -->

# Statistical Analysis

## 原则

统计方法服务于问题和数据生成过程，不为“看起来科学”而套检验。

## Skill Composition / 能力组合

- 用户的主要问题是“差异是否显著 / 效应多大 / 区间多宽 / 统计上能说到哪里”，同时要求结果图、置信区间图或分组比较图时：本 Skill 为主，组合 `data/data-visualization` 做呈现。
- 如果统计量已经给定，用户主要只问“应该怎么画、图是否误导”，使用 `data/data-visualization`。
- 如果用户主要问“这份现有统计分析是否算对、方法是否可靠”，使用 `data/data-validation`；不要因为验证过程中需要 spot-check 一个检验就与 Validation 争主路由。

### 1. 先看分布

每个主要数值指标至少考虑：

- center：mean / median；
- spread：std / IQR；
- percentiles；
- shape：normal / skewed / bimodal / heavy-tailed；
- outliers 和自然上下界。

业务类长尾指标通常同时报告 mean + median 更有信息量；若问题不需要，不机械堆全部统计量。

### 2. Trend

比较时间时检查：

- 同长度周期；
- 周期性/季节性；
- WoW / MoM / YoY 的基准是否合理；
- 是否是 partial period；
- change point 与一次性异常。

预测默认给区间或情景，避免假精确点预测。

### 3. Outliers

可以使用 Z-score、IQR、percentile 等识别候选异常，但**不要自动删除**：

- 数据错误 → 修复/排除并记录；
- 真实极端值 → 保留，使用 robust statistics；
- 不同群体 → 分层分析。

### 4. Hypothesis Testing

先写清：

- H0 / H1；
- 样本和独立性；
- 测量类型；
- alpha；
- 选用检验的假设。

常见选择：t-test、proportion z-test、paired test、ANOVA、Mann-Whitney、Chi-square。

不要只报 p-value。尽量同时给：

- effect size；
- confidence interval；
- **实际意义 / practical significance**；
- 样本量和 power 限制。

### 5. 相关与因果

发现相关时显式检查：

- reverse causation；
- confounders；
- selection / survivorship bias；
- post-treatment variables；
- 多重比较产生的偶然发现。

**相关不等于因果。** 除非设计和证据支持，结论写“相关/伴随”，不要写“导致”。

### 6. 常见陷阱

- Simpson's paradox；
- multiple comparisons / p-hacking；
- small sample；
- average of averages；
- ecological fallacy；
- survivorship bias；
- cherry-picked time window；
- denominator 变化；
- look-ahead bias；
- 4.73% 这类超出证据精度的数字。

## 输出

1. Question & data assumptions；
2. Method；
3. Results（含 effect / uncertainty）；
4. Interpretation；
5. Alternative explanations；
6. Limitations；
7. 结论能说到哪里、不能说到哪里。

如果用户只要求检查一份已有分析是否可靠，使用 `data-validation`。
