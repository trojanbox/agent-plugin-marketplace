---
name: fiction-outline
description: "【创作·章纲】用于用户明确想做章节规划、短期 Rolling Plan、章节拆合或复杂结构预演时，把成熟 Story / Characters / Style 暂时投影成可执行的近期计划。Outline 是可选 Planning Layer，不是 Manuscript 的强制前置 Canon Owner；默认优先规划接下来 1～3 章，锁高影响锚点、关系/信息边界和离场变化，把对白、小动作、环境细节和普通场景实现留给正文。适合‘先规划接下来三章/把第5章拆开/这一段多线太复杂先做章纲/我明确要完整逐章大纲’。如果用户已经要直接开始/继续正文且高影响决定已稳定，进入 fiction-manuscript-drafting；如果 World / Character / Story / Style 仍有高影响缺口，回 fiction-discussion；不写正式正文。"
visibility: workflow
phase: planning
optional_uses: "github/github-issue-manager"
---

# 【创作·章纲】

## 唯一目标

在**确实需要规划**时，为当前 Manuscript 提供轻量、可替换的章节级导航；优先服务近期 1～3 章，不把 Planning Layer 升格成长期 Canon，也不要求所有作品先做完整逐章施工图。

长期事实继续由 World / Characters / Story / Style 持有。Outline / Rolling Plan 只消费这些 Owner，并记录当前写作范围需要的近端投影。

## 启动 Gate

以下情况适合进入本 Skill：

- 用户明确要求章纲、章节拆合、近期 2～3 章规划；
- 多 POV / 多时间线 / 高密度 reveal 等结构复杂度使直接成文容易发生真实因果错误；
- 正文阶段遇到章级结构阻塞，需要先把近端路线理清；
- 用户明确偏好完整逐章大纲。

以下情况**不要求**先进入本 Skill：

- 用户已经要求开始 / 继续正文，Story、Characters、Style、关系阶段与信息边界足够稳定；
- 缺少的只是对白、小动作、生活细节、局部场景顺序等 `creative_open`；
- 仅因为“长篇小说一般应该有章纲”。

如果为了让近端章节成立仍必须新增高影响 World / Characters / Story / Style 决定，停止在 Planning 层静默补设计，回 `writing/fiction-discussion`。

## 主流程

1. **恢复权威输入**：读取 Book README、相关 World / Characters / Story / Style、上一章正式 Manuscript、必要 Knowledge / Mistakes，以及项目当前 Planning Contract（若存在）。
2. **先找近端叙事发动机**：当前人物接下来实际在做什么；不要先把主题、设定点或人物标签拆成场景任务。
3. **锁最小硬锚点**：只记录若遗漏就会破坏 Story 因果、关系阶段、信息释放或重要状态变化的节点。
4. **保留 Creative Open**：对白、普通动作、环境细节、低影响生活摩擦、笑点实现、具体道具与大部分场景调度默认留给 Manuscript。
5. **按真实边界拆合**：章节数量服从行动、POV、时间、情绪与状态变化；不按 3 章、5 章或固定场景数配额拆分。
6. **近详远略**：默认只把接下来 1～3 章规划到可用程度；更远只保留 Story Movement / 长线锚点，除非用户明确要求完整逐章大纲。
7. **Readiness 对齐**：按 `../../shared/fiction/references/manuscript-readiness.md` 检查是否仍有高影响阻塞；**没有持久化 Outline 文件本身不是 Not Ready 理由**。
8. **按需持久化**：项目 / 用户需要跨会话恢复时写入当前 Planning Layer（推荐 `outline/current.md` 或项目自己的等价位置）；旧计划可保留为历史规划，不反向覆盖 Canon Owner。

## Rolling Plan 推荐字段

默认不写固定 Scene List。一个近期章节通常只需要：

- **Chapter Engine**：这一章人物实际在做什么；
- **Hard Anchors**：2～4 个不可丢的高影响节点；
- **Character / Relationship Boundary**：只有当前章确实需要额外提醒时记录；
- **Information Open / Closed**：当前 reveal 边界；
- **Exit Change**：章末最重要的状态变化；
- **Creative Open**：明确哪些实现留给正文现场发现。

如果这些字段仍然被写成“场景1负责 A、场景2负责 B、场景3负责 C”的知识点清单，优先判定 Planning 过度执行。

## Planning Simulation Test

问两个问题：

1. **删掉这个计划以后，长期 Canon 是否仍完整存在于真正 Owner？** 如果否，说明把 Canon 错放进了 Planning。
2. **正文作者是否被迫逐项证明计划里的每个主题 / 人设 / 信息点？** 如果是，计划太细，应退回 Engine + Hard Anchors + Boundaries。

## 按需读取

- 需要 Issue / `outline/current.md` 持久化和替代关系时读取 `references/issue-and-sync.md`。
- 需要 Story Movement / 体量方法时读取 `../../shared/fiction/references/story-movements.md`。
- 需要人物关系边界时读取 `../../shared/fiction/references/character-relationships.md`。
- 需要场景、信息释放与生活世界方法时读取 `../../shared/fiction/references/scenes-information-world.md`。
- 需要 Work Voice / POV 约束时读取 `../../shared/fiction/references/voice-contract.md`。
- 需要判断是否可以直接进入正文时读取 `../../shared/fiction/references/manuscript-readiness.md`。

## Composition

Routine Rolling Plan 不强制创建 Issue。用户明确要求 GitHub 持久化、项目规定必须通过 Issue 协作，或一次高影响章节结构调整需要保留决策历史时，组合 `github/github-issue-manager` 使用 `【创作·章纲】【书名】<版本 / 范围>`。

## 停止边界

- 高影响上游合同缺失 → 回【创作·讨论】。
- 用户已经明确要求直接开始 / 继续正式正文，且 Readiness 没有高影响阻塞 → 转 `writing/fiction-manuscript-drafting`，不要为了流程完整强制补章纲。
- 用户只要求检查能否开始正文 → `writing/fiction-manuscript-readiness`。
- 开始写完整对白 / 正式叙述 → 停止，当前 Skill 不负责 Manuscript。
- Planning 未持久化但用户没有要求持久化 → 不构成阻塞。
