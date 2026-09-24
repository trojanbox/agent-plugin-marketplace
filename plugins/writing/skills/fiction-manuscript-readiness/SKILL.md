---
name: fiction-manuscript-readiness
description: "正文可写性检查。用于用户明确询问‘现在能不能写正文/可以开第一章了吗/这本书达到 Manuscript Ready 了吗/还缺什么才能写’，判断当前 Book / 用户材料是否已经足够稳定到可以成文。只检查权威输入、未决高影响问题、当前章 Outline、人物执行态、关系/信息边界、连续性与项目自带 Style/Knowledge 合同是否就绪；不规定句式、段落、文风或审美，也不撰写正式正文。用户直接要求‘开始/继续/重写某章正文’时由 fiction-manuscript-drafting 保留主路由，并把本 Skill 作为前置 Gate 使用。"
visibility: workflow
phase: verification
---

# Fiction Manuscript Readiness / 正文可写性检查

## 唯一目标

在正式 Manuscript 落笔前回答一个问题：**当前材料是否已经成熟到可以直接写，而不需要正文作者临场补高影响创作决定？**

本 Skill 是独立可调用的前置 Gate，也可以被 `fiction-manuscript-drafting` 作为必需 Gate 使用。它只验证“输入是否够用”；正文具体写成什么样，继续由当前 Book / 项目的 Style、Characters、Story、Outline、Knowledge / Mistakes 与正式 Manuscript 合同决定。

## 触发与所有权

以下任务由本 Skill主导：

- “现在可以开始写正文了吗？”
- “这本书达到 Manuscript Ready 了吗？”
- “帮我检查写正文还缺什么。”
- “只告诉我能不能写，不要动正文。”

邻接边界：

- 用户明确要求“开始 / 继续 / 重写正式正文” → `writing/fiction-manuscript-drafting` 保留主路由，并在内部执行本 Gate；
- 用户要新增、细化、拆合或修改章纲 → `writing/fiction-outline`；
- 为了让正文成立仍需决定高影响 World / Character / Story / Style 内容 → 建议进入 `writing/fiction-discussion`；
- 用户已经有正文，主要目标是人物 / 连续性 / 表达 / 可读性 / 节奏审查 → 对应 `fiction-*-review`；
- 本 Skill 不因为发现缺口就静默替用户补设计，也不代写正文。

## 输入恢复

1. 有项目 / Storybook 时，先遵循项目自己的恢复顺序和 Agent 规则，不用聊天记忆替代权威文件。
2. 至少确认当前 Book、当前章 / 范围、当前阶段与权威 Owner 入口。
3. 读取项目声明为正文前置输入的内容；Storybook 常见输入包括 Book README、相关 World / Characters / Story / Style、当前与相邻 Outline、上一章 Manuscript、活动 Issue / pending sync、Knowledge / Mistakes，以及项目明确要求的 Voice Baseline。
4. 没有 Storybook 时，使用用户当前提供的梗概、人物、章节计划和表达约束做等价判断；不强制用户为了通过 Gate 先建立目录结构。

## Readiness Gate

详细判据读取 `../../shared/fiction/references/manuscript-readiness.md`。

核心原则只有一条：

> 换一个没参加过讨论的 Agent，只给它当前权威材料，它能否直接写当前章，而无需重新决定关键剧情、人物反应、关系权限、信息释放或其它高影响内容？

如果仍必须临场“替作者决定”，判 `Not Ready`。

## 输出合同

默认输出：

```text
Manuscript Readiness: Ready | Not Ready
Scope: <Book / chapter / range>

Blocking gaps:
- [Owner] <缺口 + 为什么会阻塞正文>

Non-blocking notes:
- <可在正式表达阶段自然决定的事项；没有则省略>

Suggested next step:
- <最小修复动作 / 推荐 Owner 或 Skill>
```

规则：

- 不做分数或百分比；
- `Ready` 只表示“可以进入正式成文”，不表示章节质量已经通过 Review，更不表示整本出版就绪；
- `Not Ready` 时建议最小必要修复，不扩写新的世界观、支线或风格设计；
- 用户只问 readiness 时，到结论与建议为止；
- 当本 Gate 由 `fiction-manuscript-drafting` 调用时，`Ready` 把控制权返回 Drafting；本 Skill 自己不接管正式正文。

## 风格边界（强制）

本 Skill **不定义小说文本风格**。

- 不规定长句 / 短句、长段 / 短段、对白密度、幽默方式、修辞、节奏或“像不像文学”；
- 不把 `shared/fiction/references/drafting-quality.md` 或通用 Voice 建议当成正文生成模板；
- 只检查当前作品是否已经有明确、可读取的 Style / 表达合同，或用户是否明确允许自由表达；
- 项目已经声明 Voice Baseline 时，只检查它是否可读取且与当前状态无冲突，不在本 Gate 中重新定义 Voice；
- Style 内容由 Book Owner 持有，Readiness 只判断它是否足以约束当前正文，不代替它作审美决定。

## 停止边界

- 高影响创作决定未收口 → `Not Ready`，给出 Owner 与建议后停止；
- 当前章 Outline / 关系阶段 / 信息边界 / Carry-over 不足 → `Not Ready`，建议进入 `fiction-outline`；
- 缺口属于 World / Characters / Story / Style 的高影响设计 → `Not Ready`，建议进入 `fiction-discussion`；
- Gate 已 Ready 且用户只问 readiness → 本 Skill 完成；
- Gate 被 Drafting 调用 → 返回 Ready / Not Ready，不生成正文。
