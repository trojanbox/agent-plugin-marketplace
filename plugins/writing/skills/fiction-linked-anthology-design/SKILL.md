---
name: fiction-linked-anthology-design
description: "【创作·系列架构】为共享世界观、由相对独立短中篇/档案/案件/单元故事构成且有贯穿主线的系列小说，设计和维护跨篇结构。适合‘每份绝密档案都是独立故事但背后有一条主线/给单元故事做关联图/安排跨篇线索与揭示顺序/维护系列故事总表’。交付 Series Contract、Unit Ledger 与 Throughline Ledger；普通开放选题讨论由 fiction-discussion 主导，章节规划由 fiction-outline 主导，正文由 fiction-manuscript-drafting 主导，已有正文的事实核查由 fiction-continuity-review 主导。"
visibility: workflow
phase: architecture
optional_uses: "github/github-issue-manager"
---

# 【创作·系列架构】关联单元小说

## 唯一目标

让一组**各自值得阅读**的短篇/中篇共享可信的世界、相互留下可追踪的关联，同时让贯穿主线有真实推进。可用于绝密档案、异闻录、案件集、跨年代群像等形式；不强制采用超自然、秘密机构或统一幕后黑手。

## 路由与边界

- 用户明确要求**跨篇系列架构**、单元目录、不同档案如何相连、总主线证据与揭示顺序 → 本 Skill 主导。
- 只是讨论一个新点子、档案故事的人物/结局、尚未确认的大方向 → `writing/fiction-discussion`；不得借本 Skill 把候选变成 Canon。
- 明确要拆分某篇的章节、制定近期章纲 → `writing/fiction-outline`，按需消费本 Skill 的既有系列合同。
- 明确要写正式正文 → `writing/fiction-manuscript-drafting`，由其 Readiness Gate 检查跨篇信息边界。
- 已有文本只要查前后矛盾、人物提前知情或线索重复 → `writing/fiction-continuity-review`。
- 用户要单纯爆破更多离奇点子，未选择系列架构目标 → `reasoning/divergent-ideation`。

## 工作流程

1. **恢复事实与范围**：读取项目 AGENTS.md（存在时）、Book README、已确认 World / Story / Characters / Style、当前系列索引及关联 Issue；无 Book 时从当前用户材料开始。严格区分 confirmed、proposal、creative_open、deferred、superseded。
2. **确认最小 Series Contract**：只有当前范围确实需要时才决定档案/单元为何被记录、为何可能被隐藏、谁在阅读或讲述、哪些世界事实必须共享、单篇与主线预期的关系。不预设所有机密来自一个机构或同一原因。
3. **先验证单篇叙事发动机**：每个已选单元要有主人公或行动主体、明确欲望/问题、阻力、变化与独立的阅读回报；“展示一种奇观”或“放一个主线线索”本身不足以撑起中篇。
4. **再建立最小跨篇联系**：区分共享世界事实、可重用人物/事件/物件、读者可识别的弱回声，以及会改变主线理解的硬线索。不要强制每篇都提供钩子、彩蛋或主线证据。
5. **让主线有人物与行动**：说明谁在追寻/隐瞒/争夺何事，为什么现在必须行动，失败有什么代价；将线索与决策造成的状态变化关联，避免把“所有档案背后还有更大秘密”当成完整主线。
6. **维护双层信息边界**：分别记录作品世界中谁知道、叙述者/档案编者知道、读者已见与仍可误解的事实；设计 reveal 与 recontextualization 的因果，不依赖临时反转。
7. **最小维护而非预制全集**：只为已确认或近期待写的单元建卡；远期保留大方向和 creative_open。选题更改时先做影响检查，不暗改现有 Canon、已发表单篇或已经兑现的线索。
8. **Reader Gate**：分别以第一次接触该单篇的读者和连续阅读全系列的读者检查：能否单篇读懂、有无完整变化、跨篇信息是否可信、主线有没有实质推进、不同单元是否题材和情绪过于雷同。

## 默认交付物

- **Series Contract**：共享世界与结构性硬约束、主要开放问题、权威 Owner。
- **Unit Ledger**：仅列已选/近期单元的独立故事核心、长度预期（如确有必要）、跨篇连接与当前状态。
- **Throughline / Reveal Ledger**：主线目标与压力、已确认线索、阅读顺序、已公开/未公开信息及后续兑现责任。
- **Decision Delta**：本次确认了什么、推翻了什么、什么仍然开放。用户没有要求文档或 Issue 时，优先用简洁对话推进。

需要实际创建跨篇信息表、复杂跨年代校验或多单元状态更新时，读取 `references/series-ledgers.md`，不在轻量构思时无条件加载模板。

## Skill Composition

用户明确要求把系列架构决策记录到 GitHub、已有同轮创作 Issue 必须续记，或项目规则要求长期持久化时，条件加载 `github/github-issue-manager`。普通聊天不自动建 Issue；本 Skill 保留系列结构的设计所有权。

## 停止边界

- 核心人物、世界前提或主线谜底还在选择 → 保留候选并回 `fiction-discussion`，不擅自冻结。
- 用户当前只需一个独立故事 → 不强制设计整个系列。
- 不因为“绝密档案”就新增机构层级、编号制度、收容设施或全知旁白。
- 不直接起草完整 Manuscript，不取代作品自己的 Style/Canon；如涉及真实历史事件，虚构设定与需查证的真实事实分开标记。
