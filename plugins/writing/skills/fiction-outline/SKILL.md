---
name: fiction-outline
description: "【创作·章纲】用于把已经足够成熟的小说材料通过与用户逐轮确认，落实成真实章节 / 场景计划，并维护长期可恢复的章纲 Issue；章纲同时要把关键人物的当章执行态、关系阶段与互动边界明确到可直接指导正文。输入可以是 Storybook、成熟梗概、半成品、旧章纲、已有正文或一份/多份【创作·结论】，不强制要求前置结论。适合‘开始设计章纲/继续第5章章纲/把这几章细化到可以写/调整章节拆分’。如果用户只想判断现有材料是否已经可以进入正式正文，使用 fiction-manuscript-readiness；如果高影响 World / Character / Story / Style 决策仍缺失，回 fiction-discussion；不写正式正文。"
visibility: workflow
phase: planning
optional_uses: "github/github-issue-manager"
---

# 【创作·章纲】

## 唯一目标

把当前成熟故事落成**可直接指导 Manuscript 的真实章节计划**，同时保持 Storybook `outline/` 作为长期 Canonical Owner，Issue 作为协作、讨论和工作视图。

## 启动 Gate

不检查“有没有前置【创作·结论】”，只检查材料是否足以进行章节级设计。有效输入可来自 Storybook、成熟梗概、旧章纲、已有正文、用户明确方向或创作结论。

如果为了让某章成立仍必须新增高影响 World / Characters / Story / Style 决定，停止在章纲层静默补设计，回 `writing/fiction-discussion`。

## 主流程

1. **恢复权威输入**：读取 Book README、Outline Directory Contract、当前 World / Characters / Story / Style、相关结论、已有 Outline / Manuscript 与章纲 Issue。
2. **先打通全书骨架**：保证开头到结尾可完整复述，主要 Story Movement、人物/关系变化与信息释放没有明显断链。
3. **按强关联章节组讨论**：每轮范围由真实依赖决定，不固定 3 章/5 章；最终仍按真实章节分别落纲。
4. **渐进细化**：近端章节可很细，远端章节可暂时只保留职责、核心变化、禁止提前开放的信息；不要求全书同一字段密度。
5. **允许自然拆合**：过载拆章，实际属于一个完整场景时合并；不为整数章数机械操作。
6. **Ready for Writing Gate**：按 `../../shared/fiction/references/manuscript-readiness.md` 检查本章；只要正文作者仍需临场决定关键剧情、人物反应、关系权限、信息释放或高影响事实，就不能判 Ready。
7. **同步 Canonical Outline**：用户确认一个章节/章节组后，必须把当前有效版本同步到 Storybook `outline/`；同步前标记 `pending_sync`，不能视为 Ready for Writing。
8. **写后检查**：Issue 索引、当前评论、`outline/` 文件、前后章与全局合同一致后才结束本轮。

## Character Execution

章纲只实例化**本章真正影响成文的当前态**，不要复制整张角色卡。关键人物按需明确：当前目标/注意力、压力水平、默认社交姿态、当前关系阶段、已经建立与尚未建立的互动边界、上一章 Carry-over、本章离场变化。

稳定默认基线归 Characters，跨章关系阶段归 Story；缺哪一层就回对应 Owner 补齐，不能让正文作者自行用“这个角色幽默/直率/话多”去猜当前应该有多熟。

## Writing Simulation Test

换一个没参加讨论的 Agent，只给它当前 Storybook 权威内容 + 本章 Outline，它是否仍必须重新决定关键剧情、人物反应、信息释放，或猜“他们现在有多熟、能不能这样开玩笑 / 打断 / 触碰 / 揭短 / 替答 / 问私人问题”？如果会，章纲还不够细。

## 按需读取

- 需要 Issue 正文/评论维护、`pending_sync`、拆合章与 `outline/` 同步规则时读取 `references/issue-and-sync.md`。
- 需要 Story Movement / 体量方法时读取 `../../shared/fiction/references/story-movements.md`。
- 需要人物反应与关系检查时读取 `../../shared/fiction/references/character-relationships.md`。
- 需要场景、信息释放与生活世界方法时读取 `../../shared/fiction/references/scenes-information-world.md`。
- 需要 Work Voice / POV 约束时读取 `../../shared/fiction/references/voice-contract.md`。
- 需要判断当前 Outline 是否真正达到正文可写状态时读取 `../../shared/fiction/references/manuscript-readiness.md`。

## Composition

正式启动【创作·章纲】时需要长期 Issue；组合 `github/github-issue-manager` 使用 `【创作·章纲】【书名】<版本 / 范围>`。GitHub 暂不可写时只能生成待同步交接，不能声称远端章纲已更新。

## 停止边界

- 高影响上游合同缺失 → 回【创作·讨论】。
- 用户只要求检查现有 Book / 当前章能否开始正文 → 路由 `writing/fiction-manuscript-readiness`。
- 开始写完整对白/正式叙述 → 停止，当前 Skill 不负责 Manuscript。
- 尚未同步到 `outline/` 的确认内容 → 保持 `pending_sync`，不得宣布 Ready for Writing。
