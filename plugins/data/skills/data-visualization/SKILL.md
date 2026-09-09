---
name: data-visualization
description: "用于当可视化本身是主要交付物时选择、创建或审阅图表：趋势、分类比较、分布、相关、组成、地理、流程等，并检查可读性、无障碍和视觉误导。若图表只是探索、统计分析或验证的呈现步骤，由对应上游 Data Skill 保留主路由并组合本 Skill。"
visibility: workflow
phase: presentation
---

<!-- Materially adapted from Anthropic Knowledge Work data skills under Apache-2.0; host-specific connector/tool assumptions were changed. -->

# Data Visualization

## 目标

选择最能表达真实关系的图表，让读者**快速看到数据说明了什么，同时不被视觉设计误导**。

## 路由与组合边界

本 Skill 在“**图怎么画 / 应该选什么图 / 现有图是否误导**”是主问题时作为主 Skill。

如果同一句请求里，图表只是另一个数据任务的输出形式：

- 首次理解数据 + 画关键分布 → `data/data-exploration` 为主，本 Skill 作为组合能力；
- 显著性/效应量/置信区间 + 结果图 → `data/statistical-analysis` 为主，本 Skill 作为组合能力；
- QA 已有分析 + 重画问题图 → `data/data-validation` 为主，本 Skill 作为组合能力。

不要为了画图重新接管上游问题定义、统计推断或 QA 结论。

## Chart Selection

| 要表达的关系 | 常用图表 |
|---|---|
| 时间趋势 | Line |
| 类别比较 / 排名 | Bar / Horizontal bar |
| 分布 | Histogram / Box plot |
| 两变量关系 | Scatter |
| 多变量相关 | Correlation matrix / Heatmap |
| 组成 | Stacked bar；类别很少时才考虑 pie/donut |
| 组成随时间 | Stacked area / 100% stacked |
| 目标 vs 实际 | Bullet / reference line |
| 地理 | Choropleth / point map |
| 流程/流量 | Sankey / Funnel（真正顺序漏斗） |

## Avoid Misleading Charts

- 3D chart：默认禁止，透视会扭曲读数；
- bar chart：通常从 0 开始；
- dual axis：极谨慎，避免制造假相关；
- pie：类别多或需要精确比较时改用 bar；
- 多 panel 比较要保持可比尺度；
- 不截断轴来夸大微小差异；
- 不用面积/体积编码一个简单线性量，除非读者知道如何解释。

## Insight First

标题优先写读者应该看到的事实，例如：

- `Revenue grew 23% YoY` 比 `Revenue by Month` 信息量更高；
- subtitle 可放日期范围、过滤条件和数据源。

但标题不能超过证据：相关图不要写因果标题。

## Accessibility

- 不仅靠颜色区分类别；
- 保证文字和背景对比；
- 轴、单位、时间范围齐全；
- 为重要图表提供 alt text / 文字结论；
- 必要时同时给数据表；
- 控制系列数量，避免图例变成编码谜题。

## Host Tool Policy

**当前宿主的系统/工具规则优先。** 本 Skill 的上游包含 seaborn、Plotly、固定 palette 和 style 示例，它们不是本地强制合同。

在当前 ChatGPT 宿主生成用户可见 Python 图表时，遵循宿主规则，例如：

- 优先 matplotlib；
- 每张图独立 figure，不用 subplot 拼盘；
- 除非用户明确要求，不指定具体颜色或 matplotlib style；
- 如果用户任务属于 Spreadsheet artifact，使用宿主规定的 spreadsheet 工具链。

如果运行在其他宿主，使用该宿主真实可用的可视化工具，不编造不存在的库或连接器。

## Final Check

- 图表类型是否匹配关系？
- 视觉编码是否忠实于数值？
- 标题、轴和单位是否完整？
- 可否在不看颜色的情况下理解？
- 是否展示必要 uncertainty？
- 是否有任何设计选择会误导快速读者？
