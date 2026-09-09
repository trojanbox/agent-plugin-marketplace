---
name: scientific-reasoning
description: "用于跨领域的科学推理与机制分析：面对现象、规律或猜测时，区分事实/主张/解释，澄清定义与测量，建立合理的竞争性假设，比较潜在机制，生成可区分预测，检查相关与因果，主动寻找反例和证伪条件，并根据新证据更新当前模型。适合‘这个现象背后的规律是什么/还有没有其他解释/怎么验证这个猜测/这是相关还是因果/什么证据能推翻我的判断/底层机制是什么/帮我建立几个可能解释’。若主目标是查外部资料、做统计检验、审查数据分析或定位软件 Bug，分别由 research、data 或 development 对应 Skill 主导。"
visibility: workflow
phase: analysis
optional_uses: "research/deep-research,data/statistical-analysis"
---

# Scientific Reasoning / 科学推理

## 唯一目标

在证据不完整、解释存在不确定性时，建立**可检验、可证伪、可修正**的当前最佳解释模型。

## 什么时候使用

高信号：规律、底层机制、还有什么解释、相关还是因果、如何验证猜测、什么证据能推翻判断、建立多个可能解释。

主要任务是查外部资料 → research；主要做统计检验 → data；检查已有数据分析 → data-validation；具体软件 Bug 根因 → development。

## Skill Composition / 能力组合

- 需要外部证据时按需组合 `research/deep-research`；
- 某个区分性预测需要量化检验时组合 `data/statistical-analysis`。

辅助 Skill 提供证据/计算，本 Skill 保留假设比较与模型更新。

## 核心闭环

1. **Observation**：只列已知事实和当前未知，分开观察、主张和解释。
2. **Definition & Base Rate**：先澄清概念、测量口径、比较基准和基础发生率。
3. **Competing Hypotheses**：至少建立真正能解释现象的候选，不堆同义句。
4. **Mechanism**：为主要假设写出因果链与必要条件，检查替代路径和混杂。
5. **Discriminating Predictions**：设计不同假设会给出不同结果的预测。
6. **Falsification & Counterexamples**：主动寻找反例、失败条件和能推翻当前模型的证据。
7. **Update**：根据新证据调整相对可信度，并保留未解释问题。

深度执行时读取 `references/reasoning-playbook.md`；选择 Lightweight/Deep、正式输出和失败模式时读取 `references/modes-output-failures.md`。

## 真实性边界

证据不足时保持假设状态；相关性不自动升级为因果；没有实际数据检验时不声称统计显著；结论必须写明适用条件和会改变判断的新证据。
