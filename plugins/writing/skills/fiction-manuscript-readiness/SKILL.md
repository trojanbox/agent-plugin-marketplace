---
name: fiction-manuscript-readiness
description: "正文可写性检查。用于用户明确询问‘现在能不能写正文/可以开第一章了吗/这本书达到 Manuscript Ready 了吗/还缺什么才能写’，判断当前 Book / 用户材料是否已经稳定到可以成文。只检查高影响 Canon、Story 因果、人物/关系/信息边界、连续性与项目自带 Style/Knowledge 合同；Outline / Rolling Plan 是可选输入，没有逐章章纲本身不构成 Not Ready。普通对白、小动作、生活细节、局部场景顺序和其它 creative_open 应留给正文。用户直接要求‘开始/继续/重写某章正文’时由 fiction-manuscript-drafting 保留主路由，并把本 Skill 作为前置 Gate 使用。"
visibility: workflow
phase: verification
---

# Fiction Manuscript Readiness / 正文可写性检查

## 唯一目标

在正式 Manuscript 落笔前回答一个问题：**当前高影响决定是否已经稳定到足以写，而剩余未知主要属于可以安全留给正文的创造性实现？**

本 Skill 是独立可调用的前置 Gate，也可以被 `fiction-manuscript-drafting` 作为必需 Gate 使用。它只验证“是否存在结构性阻塞”；正文具体怎样长出来，继续由当前 Book / 项目的 Style、Characters、Story、Knowledge / Mistakes、正式 Manuscript，以及存在时的近期 Planning 决定。

## 触发与所有权

以下任务由本 Skill 主导：

- “现在可以开始写正文了吗？”
- “这本书达到 Manuscript Ready 了吗？”
- “帮我检查写正文还缺什么。”
- “只告诉我能不能写，不要动正文。”

邻接边界：

- 用户明确要求“开始 / 继续 / 重写正式正文” → `writing/fiction-manuscript-drafting` 保留主路由，并在内部执行本 Gate；
- 用户明确要新增、细化、拆合或修改章纲 / Rolling Plan → `writing/fiction-outline`；
- 为了让正文成立仍需决定高影响 World / Character / Story / Style 内容 → 建议进入 `writing/fiction-discussion`；
- 用户已有正文，主要目标是人物 / 连续性 / 表达 / 可读性 / 节奏审查 → 对应 `fiction-*-review`；
- 本 Skill 不因为发现 creative_open 就替用户补完整章纲，也不代写正文。

## 输入恢复

1. 有项目 / Storybook 时，先遵循项目自己的恢复顺序和 Agent 规则，不用聊天记忆替代权威文件。
2. 至少确认当前 Book、当前章 / 范围、当前阶段与长期 Canon Owner 入口。
3. 读取项目声明为正文前置输入的内容；Storybook 常见输入包括 Book README、相关 World / Characters / Story / Style、上一章 Manuscript、Knowledge / Mistakes、Voice Baseline，以及**存在时**的当前 Rolling Plan / Outline。
4. 没有 Storybook 时，使用用户当前提供的梗概、人物、长线方向、上一段正文和表达约束做等价判断；不强制用户为了通过 Gate 建目录或写逐章章纲。

## Readiness Gate

详细判据读取 `../../shared/fiction/references/manuscript-readiness.md`。

核心原则：

> 换一个没参加过讨论的正文作者，只给它当前权威 Canon、上一章正式正文和必要 Voice / 关系 / 信息边界，它能否继续写，而无需替作者发明会改变长线 Story、人物关系或 reveal 的高影响决定？

如果可以，哪怕没有独立 Outline 文件，也可以判 `Ready`。

## 输出合同

默认输出：

```text
Manuscript Readiness: Ready | Not Ready
Scope: <Book / chapter / range>

Blocking gaps:
- [Owner] <真正高影响缺口 + 为什么阻塞>

Creative open:
- <可以安全留给正文现场决定的事项；没有则省略>

Suggested next step:
- <最小修复动作 / 推荐 Owner 或 Skill>
```

规则：

- 不做分数或百分比；
- `Ready` 只表示“可以进入正式成文”，不表示章节质量已经通过 Review，更不表示整本出版就绪；
- `Not Ready` 时建议最小必要修复，不把“没有详细章纲”包装成设计缺口；
- 用户只问 readiness 时，到结论与建议为止；
- 当本 Gate 由 `fiction-manuscript-drafting` 调用时，`Ready` 把控制权返回 Drafting；本 Skill 自己不接管正式正文。

## 风格边界（强制）

本 Skill **不定义小说文本风格**。不规定句式、段落、文风或审美。

- 不规定长句 / 短句、长段 / 短段、对白密度、幽默方式、修辞、节奏或“像不像文学”；
- 不把 `shared/fiction/references/drafting-quality.md` 或通用 Voice 建议当成正文生成模板；
- 只检查当前作品是否已经有明确、可读取的 Style / 表达合同，或用户是否明确允许自由表达；
- 项目已经声明 Voice Baseline 时，只检查它是否可读取且与当前状态无冲突，不在本 Gate 中重新定义 Voice；
- Style 内容由 Book Owner 持有，Readiness 只判断它是否足以约束当前正文，不代替它作审美决定。

## 停止边界

- 高影响创作决定未收口 → `Not Ready`，给出 Owner 与建议后停止；
- 关系阶段 / 信息边界 / 上一章 Carry-over 存在会导致真实越界的结构性缺口 → `Not Ready`，优先回 Story / Characters / 对应 Owner；用户明确希望先做近端规划时再进入 `fiction-outline`；
- **仅缺少独立 Outline / Scene List / 逐章计划 → 不得单独判 Not Ready**；
- Gate 已 Ready 且用户只问 readiness → 本 Skill 完成；
- Gate 被 Drafting 调用 → 返回 Ready / Not Ready，不生成正文。
