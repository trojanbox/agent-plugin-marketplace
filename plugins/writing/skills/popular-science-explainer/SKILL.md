---
name: popular-science-explainer
description: "用于把复杂科学、工程、技术、数学或机制性知识讲给非专业读者/观众听：从熟悉现象或可观察问题切入，用认知缺口、最小模型、现实约束与逐层升级建立理解。适合科普文章、视频解说稿、技术原理讲解和从零解释；一般文字润色用 clear-writing，去 AI 味用 humanizer，K-12 课堂教学设计进入 education。"
visibility: workflow
phase: explanation
optional_uses: "research/deep-research,research/knowledge-synthesis,writing/humanizer"
---

# Popular Science Explainer / 通用科普解说

## 目标

让读者从已有直觉出发，经过一连串必要的模型升级，最终能**自己解释目标现象/机制**，而不只记住术语。

## Skill Composition / 能力组合

用户同时明确要求“去 AI 味/像人写”时，本 Skill 保留知识结构和事实解释，组合 `writing/humanizer` 做风格后处理。

## Evidence Gate

事实、数字、历史、机制必须有可靠依据；时效/专业性强且当前材料不足时先补证据。不要为了讲故事伪造科学史、实验结果或工程因果。

## 核心工作流

1. **定义终点**：先确定读者最终需要解释/预测什么。
2. **选择可进入起点**：从日常经验、可观察现象或具体任务开始。
3. **制造真实认知缺口**：展示当前直觉/最小模型解释不了的东西。
4. **建立最小模型**：只引入当前这一步必需的对象和关系。
5. **暴露边界**：说明模型在哪个约束下失效。
6. **让新概念作为答案出现**：概念/术语/公式解决刚刚出现的具体问题。
7. **量化收益（能量化时）**：说明新机制换来了什么、付出了什么。
8. **重复升级**：直到能够解释目标系统；长篇、多层机制或视频脚本时读取 `references/narrative-patterns.md`。

类比、公式、句子节奏、视觉/旁白、开头结尾和输出模式按需读取 `references/explanation-craft.md`。

## Final Gate

- 每个新术语都有出现的理由；
- 类比映射清楚且及时指出失效边界；
- 没把教学重建的逻辑顺序写成真实历史；
- 解释最终回到开头的问题；
- 用户没要求长篇时不过度扩写。
