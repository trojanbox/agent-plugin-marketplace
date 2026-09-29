---
name: fiction-expression-review
description: "表达审查。用于检查一部小说是否仍保持自己的 Work Voice、POV、叙事距离与表达边界，发现 Voice Flattening、AI/客服腔、说明书化、多轮对话机械对称、段落句式过度均匀、幽默和作品温度被磨平等问题。适合‘文风有没有漂/文笔漂移了吗/是不是越来越像 AI 写的/对白怎么越来越机械/这几章还像这本书吗’。审查时区分真正的 Voice Drift 与角色因压力、关系阶段、身体状态发生的正常语气变化；单个角色底色用 fiction-character-review，读起来费劲用 fiction-readability-review。"
visibility: workflow
phase: verification
---

# 表达审查

## 唯一问题

**这本书现在还像这本书吗？**

先读取 `../../shared/fiction/references/review-contract.md`；有 Storybook 时读取 `style/` 当前合同、必要 Character Voice 与连续正文。项目声明 Voice Baseline 时，必须同时读取其指向的已确认正式 Manuscript；抽象 Style 用于判断边界，正式样本用于判断实现层是否漂移。

## 检查

- Work Voice Flattening；
- POV / 叙事距离漂移；
- AI / 客服式精准完整表达；
- 产品说明、后台状态、规格文档语言进入叙述；
- 多轮对话一问一答、机械对称；
- 段落与句式过度均匀；
- 旁白频繁总结“真正的问题 / 终于明白”；
- 已成立的幽默、观察方式、生活感和温度是否消失；
- 与项目 Voice Baseline 对读时，场景运动、对白摩擦、叙述呼吸和情绪 / 幽默机制是否仍像同一本书；
- 用户只要求加强某个表达维度时，是否出现局部反馈覆盖整体 Work Voice 的过度补偿；
- 为了文学感而碎行、金句化、过度修辞；
- 素材库 / 候选句是否覆盖人物自己的声音。

## State-conditioned Voice Gate

不要用“句子长度、话多不多、笑话密度”直接判文风漂移。角色在高压、悲伤、受伤、初见、熟悉、冲突、临终等不同状态下，本来就可能说得更短、更慢、更少幽默。

优先比较**声音生成机制**是否还在：

- 角色为什么开口：虚荣、热心、防御、求生、回避、关系权限等是否仍来自同一人物；
- 作品仍然看什么、先给什么信息、怎样让情绪长出来；
- 在可比较的压力与关系条件下，是否仍接近 Voice Baseline；
- 状态变化结束后，原有表达倾向是否能自然回来，而不是永久被磨成统一客服腔。

如果只是状态合理改变了表层长度 / 幽默强度，判为**人物状态变化**，不要为了“恢复 Voice”把高压场景改回早期轻松说法。真正 Drift 是底层观察、信息顺序、人物欲望和说话机制一起换了。

详细 Work Voice Gate 读取 `../../shared/fiction/references/voice-contract.md`；长区间 Voice Flattening 读取 `revision-methods.md`。

## 边界

可以读取 Character Voice 作为约束，但不重新定义人物 Voice。具体读者认知负担由 `writing/fiction-readability-review` 判断。
