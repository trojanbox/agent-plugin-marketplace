---
name: fiction-expression-review
description: "表达审查。用于检查一部小说是否仍保持自己的 Work Voice、POV、叙事距离与表达边界，发现 Voice Flattening、AI/客服腔、说明书化、多轮对话机械对称、段落句式过度均匀、幽默和作品温度被磨平等问题。适合‘文风有没有漂/是不是越来越像 AI 写的/对白怎么越来越机械/这几章还像这本书吗’。单个角色声音用 fiction-character-review，读起来费劲用 fiction-readability-review。"
visibility: workflow
phase: verification
---

# 表达审查

## 唯一问题

**这本书现在还像这本书吗？**

先读取 `../../shared/fiction/references/review-contract.md`；有 Storybook 时读取 `style/` 当前合同、必要 Character Voice 与连续正文。

## 检查

- Work Voice Flattening；
- POV / 叙事距离漂移；
- AI / 客服式精准完整表达；
- 产品说明、后台状态、规格文档语言进入叙述；
- 多轮对话一问一答、机械对称；
- 段落与句式过度均匀；
- 旁白频繁总结“真正的问题 / 终于明白”；
- 已成立的幽默、观察方式、生活感和温度是否消失；
- 为了文学感而碎行、金句化、过度修辞；
- 素材库 / 候选句是否覆盖人物自己的声音。

详细 Work Voice Gate 读取 `../../shared/fiction/references/voice-contract.md`；长区间 Voice Flattening 读取 `revision-methods.md`。

## 边界

可以读取 Character Voice 作为约束，但不重新定义人物 Voice。具体读者认知负担由 `writing/fiction-readability-review` 判断。
