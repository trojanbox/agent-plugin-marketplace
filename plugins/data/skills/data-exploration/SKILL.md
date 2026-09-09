---
name: data-exploration
description: "用于首次理解一个数据集、表格或数据文件：确认 grain/主键/时间范围、字段角色、缺失率、基数、分布、重复、异常值和潜在关系，并建议后续分析。若探索过程中同时要求画关键分布/概览图，仍以本 Skill 为主并组合 data-visualization；已有分析结果 QA 使用 data-validation，正式统计检验使用 statistical-analysis。"
visibility: workflow
phase: analysis
optional_uses: "data/data-visualization"
---

<!-- Materially adapted from Anthropic Knowledge Work data skills under Apache-2.0; host-specific connector/tool assumptions were changed. -->

# Data Exploration

## 目标

在开始回答业务问题之前，先弄清**这份数据到底是什么、质量如何、能安全回答什么**。

本 Skill 适配自 Anthropic Knowledge Work `explore-data`。上游支持数据仓库 MCP；本地版本不假设任何固定连接器。

## Skill Composition / 能力组合

- 用户的主要目标是**首次理解数据**，同时要求“把关键分布/缺失/异常直接画出来”时：本 Skill 保留主路由，按需组合 `data/data-visualization`；探索负责 grain、profiling、质量和洞察，可视化只负责选择忠实图形并呈现结果。
- 用户已经知道要展示的指标/关系，主要目标只是“画图/选图/改图”时：直接使用 `data/data-visualization`。
- 不因为探索里出现分布、相关或异常值就自动升级为正式统计检验；用户明确要求显著性、效应量、置信区间或假设检验时再进入 `data/statistical-analysis`。

## 1. Access & Scope

优先使用用户已提供的 CSV / Excel / Parquet / JSON / 数据表或当前已连接的数据源。

如果只有 schema，没有真实数据：

- 明确“当前只有结构，没有数据值”；
- 给出应该运行的 profiling 检查；
- 不生成假 row count、null rate、分位数或分布。

## 2. Understand Structure

先回答：

- 行数 / 列数；
- **grain**：一行代表什么；
- 主键/自然键是什么，是否唯一；
- 数据更新时间与覆盖时间；
- 每列角色：Identifier / Dimension / Metric / Temporal / Text / Boolean / Structural。

若 grain 不清楚，后续聚合可能全部失真，优先解决。

## 3. Profile Columns

### 全列

- null count / null rate；
- distinct count / cardinality；
- 高频值和异常低频值；
- 类型与格式一致性。

### 数值

- min / max / mean / median；
- p1/p5/p25/p75/p95/p99（数据量允许时）；
- std 或 IQR；
- 0、负数、极端值；
- 分布形状和偏态。

### 字符串/维度

- 空字符串；
- 长度分布；
- 大小写、空白和格式不一致；
- 占位符：`N/A / TBD / test / xxx / 999999` 等。

### 日期

- min / max；
- 意外未来日期；
- gaps；
- 粒度和 timezone；
- 是否存在 event time vs load time 延迟。

## 4. Data Quality

重点找：

- 意外高缺失；
- ID 低基数、分类字段高基数等反常；
- natural key 重复；
- 业务规则违反；
- status 与 timestamp 跨列矛盾；
- 单位/编码/格式混乱；
- 极端偏态导致平均数误导；
- stale data 或时间序列断档。

阈值只作启发式。比如 5% null 并不天然是错误，必须结合字段语义判断。

## 5. Discover Relationships

在有证据时识别：

- 外键候选和 join keys；
- 层级（country → state → city）；
- 可能的派生列/冗余列；
- 数值相关关系；
- 适合分析的 dimensions / metrics / time columns。

不要把列名相似直接写成“已确认外键”。

## 6. Output

优先给：

1. Dataset Overview；
2. Column Profile；
3. Data Quality Issues（High/Medium/Low）；
4. 重要分布/关系；
5. 3–5 个值得继续做的分析；
6. 当前限制或缺失信息。

探索的目标是建立可靠地基，不要因为发现一个相关性就跳到因果结论。
