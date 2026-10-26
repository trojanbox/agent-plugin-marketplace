---
name: explanatory-writing
description: "解释型写作：为非专业读者写科学/技术/数学机制科普、视频原理解说，或为真实已有的系统/工具/工作流写能照着操作的使用指南。按任务分 Science Explanation 与 Practical Guide 两种模式、只读取该模式专用参考。仅编辑现成文本的清晰度或去 AI 味用 clear-writing；K-12 课堂设计进入 education；技术 API 参考文档和普通研究走其领域 Skill。"
visibility: workflow
phase: explanation
optional_uses: "research/deep-research,research/knowledge-synthesis,writing/clear-writing"
---

# Explanatory Writing / 原理讲解与实操指南

## 唯一目标

面向明确读者，生成**可独立理解的解释文章**或**可真实照做的使用指南**。这两个交付物的流程不同，但都要求先恢复事实、理解受众、再组织必要信息；用按需参考保留各自深度，不让一种形式覆盖另一种。

## 模式选择

- **Science Explanation / 原理科普**：用户说“解释量子纠缠/原理讲解/科普文章/技术解说视频稿/为什么这项技术能实现”。读取 `references/science-explanation-mode.md`；复杂长篇或视频叙事时读取 `references/narrative-patterns.md`；类比、公式、解说工艺有需要时读取 `references/explanation-craft.md`。核心路径：已有直觉 → 认知缺口 → 最小模型 → 边界 → 模型升级 → 能自行解释。
- **Practical Guide / 实操指南**：用户说“给新人一份平时怎么用的手册/直接怎么说怎么操作/从开始到结束的工作流指南”。读取 `references/usage-guide-mode.md`，从真实系统与使用场景写“什么时候进入 → 怎么说/做 → 会发生什么 → 下一步”；用真实任务组织，不能只罗列内部 Skill 名称。用户只要 API / SDK / 字段参考由原领域负责。
- 一份科普文章里包含少量操作案例，或者一份手册里要解释少量原理时，只选择一个主模式并补必要另一模式的方法；**用户明确要两份独立完整文章与指南**则按主 Skill 冲突或先后交付规则处理，不强套一份模板。
- 用户只给现成文本，要求改清楚/去 AI 味且无需新的解释结构 → `writing/clear-writing`；课堂教案 → `education`；纯材料调研 → `research/deep-research`；高层决策沟通 → `writing/executive-communication`。

## 共同工作流

1. **事实与受众**：明确读者从哪里出发、最终应理解什么或成功完成什么操作，结合用户材料确定版本、限制和用途。
2. **验证来源与能力**：来源不足时明确未知，不能把假定系统有的功能、网页按钮、软件命令或科学发现写成事实。涉及最新/争议性的科学、技术、规则时优先核验当前材料。
3. **按模式组织**：原理科普使用模型逐步升级，术语只在解释问题时引入；实操指南使用真实任务顺序，附可复用输入与操作预期，清楚标记需用户做的决定。
4. **事实检查与文风**：检查每个关键 claim、操作结果、类比边界和信息遗漏。根据用户需求决定篇幅；自然讲解但不添加虚假细节。
5. **交付边界**：文章或手册可交付，但没有真实访问/验证目标环境时不宣称命令可用、系统支持了新功能或实验结果已验证。

## Skill Composition

- 需要**新的多来源外部事实证据**，且现有材料不足以支持讲解时才组合 `research/deep-research`；用户已给多份材料，首先需要跨来源去重与冲突处理时才组合 `research/knowledge-synthesis`。
- Practical Guide 每次需要最终清晰化文本、或用户明确要“去 AI 味/像人写”时，可选组合 `writing/clear-writing` 对应清晰化/去 AI 味模式。只处理语言，不改实际使用路径与事实。
- Science Explanation 明确要求去 AI 味时，先冻结科学主张和模型，再可选组合 `writing/clear-writing` 的去 AI 味模式，不削弱科学准确性。
- 只在需要核对上游适配方式、专业方法来源与许可时读取 `references/source-derived-notes.md`；普通写作不额外加载。

## 禁止

- 不将教学上的模型介绍顺序冒充真实历史发现顺序。
- 不用科学类比“听着像”代替事实证据，不用营销范例补齐不存在的产品能力。
- 不把实操指南写成每项功能一页的目录，也不强迫科普遵循操作手册的步骤。
- 不因合并而将用户的简单解释需求膨胀为完整教程，或用通用清晰化覆盖用户已确认的作者声音。
