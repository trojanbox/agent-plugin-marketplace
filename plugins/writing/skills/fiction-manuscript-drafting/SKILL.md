---
name: fiction-manuscript-drafting
description: "小说正文可写性检查、正式章节起草/续写与整章重写的统一入口。只问“现在能不能写/还缺什么”时进入 Readiness Only 模式，仅给 Ready/Not Ready 与阻塞 Owner，不生成正文；明确“写正文”时先执行同一 Readiness Gate，Ready 后恢复 Canon、Story、Voice Baseline、上一章并成文，无需完整章纲。正式整章初稿与 Reader Pass 后按需组合 fiction-prose-editing 精修；审查文风或连续性归 fiction-review。"
visibility: workflow
phase: generation
optional_uses: "writing/fiction-prose-editing"
---

# Fiction Manuscript Drafting / 正文可写性与正式成文

## 唯一目标

由一个主 Skill 承接**“能不能开始写”与“现在开始写”**两类紧邻任务。共用完整 Manuscript Readiness Gate，但输出权限按用户意图严格分开：只问可写性只出判断；明确要求起稿/续写/重写时，达到 Ready 才允许生成正式正文。

## 模式 Gate（必须先定）

1. **READINESS_ONLY**：用户说“现在能不能写正文 / 达到 Manuscript Ready 了吗 / 缺什么才可以写 / 只检查不要动正文”。读取 `../../shared/fiction/references/manuscript-readiness.md` 与 `manuscript-readiness-mode.md`，读取权威项目材料，只输出 Ready/Not Ready、范围、真正阻塞 Owner、Creative Open 和最小下一步，**绝不写正文、不额外生成章纲、不写入项目文件**。
2. **DRAFT**：用户说“开始第一章 / 继续下一章 / 按现有 Story 写出来 / 这一章完整重写”。**先完成同一个 Readiness Gate**；`Not Ready` 时给出关键阻塞并停止成文，`Ready` 时恢复真实 Voice Baseline 与上一章状态，继续生成当前目标 Manuscript。只有此模式读取 `../../shared/fiction/references/drafting-authoring-loop.md` 与需要的成文专项资料。
3. 用户主要想规划接下来几章/拆章合章 → `writing/fiction-outline`；高影响 Canon/关系/信息释放仍需决定 → `writing/fiction-discussion`；只审查现成正文的人物/连续性/Work Voice/节奏 → `writing/fiction-review`；只做既有文字纯文笔精修 → `writing/fiction-prose-editing`。

## Authority Recovery 与 Readiness Gate

- 有项目/Storybook 时遵循 AGENTS、Book README、Directory Contract、Knowledge / Mistakes 与当前 Canon Owner；读必要 World / Characters / Story / Style、上一章正式 Manuscript、当前明确的 Voice Baseline，以及**存在且有效时**的 Rolling Plan / Outline。项目没有 Book 时以用户提供材料做同等检查；聊天旧稿、被否决候选、过期 Issue 不能顶替现行权威。
- 检查高影响 Story 因果、人物底色与当前关系阶段、知道/不能知道/可以透露什么、World / Style 合同和前一章 Carry-over；是否能让没参与讨论的作者在不擅自决定高影响事实的前提下续写。这是 `Writing Simulation Test`。
- **没有逐章章纲本身不构成 Not Ready**；对白、小动作、生活细节、普通场景顺序属于 Creative Open，允许正文自然生成。
- 高影响 Canon Owner 存在真实冲突、当前人物信息权限未定或权威来源无法读取 → `Not Ready` 并标记最小阻塞；不为通过 Gate 而自行补完。
- 本 Readiness **不定义小说文本风格**，不规定句式、段落、幽默、修辞或节奏；不把 `shared/fiction/references/drafting-quality.md` 当成通用风格模板。风格来源只由当前作品 Style、正式 Voice Baseline 与用户已确认意图决定。

Readiness 细则统一维护在 `../../shared/fiction/references/manuscript-readiness.md`；READINESS_ONLY 专项输出及判定边界读取 `../../shared/fiction/references/manuscript-readiness-mode.md`。DRAFT 模式使用同一判据，不因为它现在是一个 Skill 内部步骤就允许跳过。

## Skill Composition / 条件组合

仅 DRAFT 模式在**正式整章初稿与 Reader Pass 完成以后**，才按需组合 `writing/fiction-prose-editing` 做诊断和有限语言精修；READINESS_ONLY、不完整草稿或明确只要原始草稿时不加载。父级继续拥有 Manuscript 写入权与最终输出。

## 正式正文模式（仅 Ready 后执行）

1. 恢复 Canon、上一章正式文本与 Voice Baseline；抽象 Style 决定不可越界的方向，正式正文样本用于实现级 **Voice Calibration**。项目未定义 Baseline 时不能从别的作品发明固定通用作者腔。
2. 建立最小 Writing Frame：Chapter Engine、Hard Anchors、人物眼前欲望/现实压力、关系与信息边界、上章余波、Creative Open；不要把 Anchor 排成逐项演示的场景施工清单。
3. 从人物正在做的事情成文，允许误解、失败、生活时间、没有直接推进剧情的有效交流。已确认硬边界始终生效；用户提出局部表达调整时只做 Feedback Delta，不让一条局部意见覆盖整本 Work Voice。
4. 每完成 1–3 章，对相邻正文连续阅读，并在项目有 Rolling Plan 时根据真实正文更新近端计划；普通实现以现行正式 Manuscript 为准，高影响矛盾回真正 Canon Owner。
5. **默认触发（必须执行）**：一章准备交付的正式小说 Manuscript 完成**初稿及 Reader Pass** 后，按需组合 `writing/fiction-prose-editing`，完成语言“诊断 → 有证据的局部改动 → A/B / Protect”。用户明确只要原始草稿、章节尚未完成或无语言目标的小勘误可跳过。没有可证明的增益 → `Protect / No Change`。
6. Postflight 对照项目现行合同检查 Character、Continuity、Information、Voice、反馈过度执行，不能把已知的回归直接留给用户。

详细正文生成/连读/Postflight 方法，**仅在 DRAFT 模式**读取 `../../shared/fiction/references/drafting-authoring-loop.md` 与 `../../shared/fiction/references/manuscript-drafting.md`。

## 输出与停止

- READINESS_ONLY 输出 `Manuscript Readiness: Ready | Not Ready`、Scope、Blocking Gaps、Creative Open、Suggested Next Step；Ready 只意味着能写，**没有生成任何正文**，也不表示 Publication Ready。
- DRAFT 输出用户指定的完整正式正文；按项目既有规则写入。若 Readiness 失败，停止生成，只报告真实阻塞与 Owner；没有 Outline 不能单独阻塞。
- 不擅自更改长期 Canon、人物底色、关系阶段、重大 reveal 或另设写作风格。整本终审、版本绑定的出版判断由 `writing/fiction-review` 全书模式负责，本轮修订验收由 `writing/fiction-revision-validation` 负责。
