---
name: fiction-story-architecture
description: "用于中篇级、多章节小说的高层故事架构与多轮共创：从一句创意、角色、关系、场景、主题或结局出发，逐步确定作品身份、核心人物关系、初始状态、Story Movements、终点、POV、时间范围和叙事体量。适合‘先陪我把故事搭起来/故事还没成形/帮我完善高层主线/从结局反推前面/继续【创作】Issue 的故事架构讨论’。故事已能从头讲到尾、当前主要补人物/场景/信息时用 fiction-story-development；当前要正式正文用 fiction-writing；软件/产品讨论用 development/github-discussion-facilitator。"
visibility: workflow
phase: architecture
optional_uses: "github/github-issue-manager"
---

# Fiction Story Architecture / 中篇小说故事架构

## 唯一目标

与用户共同确定**这是什么作品，以及它为什么会从这里走到那里**。从任意创作种子出发，解决结构性未知，保留后续创造性未知；不把讨论变成固定问卷，不提前做逐场景设计。

## 主流程

1. **读取已有材料**：先吸收当前对话、用户提供的大纲/正文、已有【创作】Issue。已经明确的内容不重复问。
2. **判断当前成熟度**：高层故事还不能从开始讲到结束时，本 Skill 保留主路由；若高层架构已成立、主要缺人物/关系/场景/信息，移交 `writing/fiction-story-development`。
3. **推进最高杠杆问题**：优先处理结构矛盾、Movement 断链、核心人物/关系缺位、POV/时间/体量冲突、终点无法自然抵达。一次主要推进一个真正影响整体的问题。
4. **使用四种动作**：引导、收集、提问、推荐。只有用户没有方向或存在真正不同的结构分叉时才给少量候选，并说明各自会怎样改变故事。
5. **持续校验**：人物行为、关系变化、事件因果和终点必须互相支持；不靠“后来发生很多事”“逐渐亲近”掩盖结构空洞。
6. **形成当前架构稿**：当故事可以完整复述、关键 Story Movements 连通、核心人物与全局约束没有明显冲突时，整理自然语言 Story Architecture Synopsis。用户若要继续深化，移交下一层；若明确要直接写且剩余决定已委托，可顺序进入 `fiction-writing`。

## 每次都要守住的边界

- Story Movements 是观察状态变化的工具，不是固定幕数、节点数或反转配额。
- 第一层人物只做到“为什么这个人会这样反应，而另一个人不会”；完整人物塑造留给下一层。
- Genre/作品身份必须在第一层结束前明确到足以约束读者预期，但不要求第一轮就贴类型标签。
- 主题只保留为问题/张力，不提前写作者答案；POV 先形成当前方案；时间范围和 Narrative Scope 作为高影响结构变量。
- 体量用于发现架构失衡，不用固定字数、章数或 Movement 数量制造内容。
- 用户明确只在聊天讨论时不强制建 Issue；缺少 GitHub 持久化不能阻塞独立可继续的创作讨论。

## 按需读取

- 需要完整架构地图、问题优先级和停止条件时读取 `references/architecture-map.md`。
- 设计 Story Movements、时间范围或体量匹配时读取 `references/story-movements.md`。
- 当前作品需要类型知识时，先读取 [Genre 索引](../../shared/fiction/genres/index.md)，只加载已存在且相关的类型 reference。
- 用户要求创建/续用【创作】Issue 时读取 [创作 Issue 工作流](../../shared/fiction/references/creative-issue-workflow.md)。

## Skill Composition / 能力组合

用户明确要求 GitHub 持久化时组合 `github/github-issue-manager`；本 Skill 保留创作决策主路由，Issue 能力只负责查找、创建、更新和核验。用户只要保存已经定稿的内容、当前不再进行创作时，由 Issue Skill 主导。

## 停止边界

- 高层故事已成立、剩余主要是人物深化/关系/场景/信息 → 停止并移交 Development。
- 用户当前明确要正文，且已有架构或已委托剩余高影响选择 → 顺序进入 Writing，不为了流程完整继续盘问。
- 当前任务只是已有文字的清晰改写或去 AI 味 → 不抢编辑类 Skill 主路由。
