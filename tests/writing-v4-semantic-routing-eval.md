# Writing v4.0 合并路由规则与专项模式回归

日期：2026-10-26。本次对重构后的 Writing 公开 Skill description、模式 Gate、Composition 与邻接路由进行**一次规则层人工语义判读**；保留原有 462 条基准 prompt 并迁移其中 73 条 expected owner 到现行 ID。新增以下 W4 样例。此结果尚未经过独立模型多轮路由运行，也不能代表线上命中率。

## 当前 Owner

- `fiction-review` 根据用户目标选择 Character / Continuity / Expression / Readability / Pacing / Full-book；只有整本连续读且版本绑定后才可声明 Publication Readiness。
- `fiction-manuscript-drafting` 接受 READINESS_ONLY（只判断不成文）与 DRAFT（过 Gate 后生成）两种模式。
- `clear-writing` 接受 Clear / Humanizer 两种编辑模式；科学解释与实操指南由 `explanatory-writing` 按需加载各自参考。
- `fiction-revision-validation` 独立持有本轮修改前后的实际 Diff / Preserve Set 验收。

## 新增用例

| ID | Bucket | 用户表达 | 预期 Owner | 人工判断 |
| --- | --- | --- | --- | --- |
| W4001 | positive | 小七现在说话越来越像客服了，帮我看角色是不是漂了。 | writing/fiction-review（Character 模式） | PASS |
| W4002 | positive | 这人第一面见陌生人就揭短，这真的符合他的默认社交基线吗？ | writing/fiction-review（Character 模式） | PASS |
| W4003 | positive | 第4章他还不知道真相，第5章就把真相当成决策依据了，检查前后逻辑。 | writing/fiction-review（Continuity 模式） | PASS |
| W4004 | positive | 上一章还只是同事，下一章突然互叫昵称了，连续性对吗？ | writing/fiction-review（Continuity 模式） | PASS |
| W4005 | positive | 这几章越来越像同一种 AI 旁白了，分析 Work Voice 和 POV。 | writing/fiction-review（Expression 模式） | PASS |
| W4006 | positive | 术语单个都理解，读一整段却完全跟不上人物在干嘛。 | writing/fiction-review（Readability 模式） | PASS |
| W4007 | positive | 前十章老在开会查问题，没有吸引力，你看节奏怎么了。 | writing/fiction-review（Pacing 模式） | PASS |
| W4008 | positive | 把这本书从头到尾连读一遍，给出版终审并指出当前版本是否就绪。 | writing/fiction-review（Full-book 模式） | PASS |
| W4009 | positive | 审一下这两章，人物的反应和时间状态都检查一下。 | writing/fiction-review（Character + Continuity；同一主路由） | PASS |
| W4010 | positive | 我还想先问问第一章可以写了吗，先不要动任何正文。 | writing/fiction-manuscript-drafting（READINESS_ONLY） | PASS |
| W4011 | positive | 现在开始正式写第一章，按已确认的 Storybook 继续就行。 | writing/fiction-manuscript-drafting（DRAFT；前置 Readiness） | PASS |
| W4012 | positive | 已经写完的这段不用改人物剧情，只磨一磨用词和句际呼吸。 | writing/fiction-prose-editing | PASS |
| W4013 | positive | 这份报告只是太绕了，清楚简洁一点，数字别动。 | writing/clear-writing（Clear 模式） | PASS |
| W4014 | positive | 把这段邮件去 AI 味，保留我平时的语气和全部事实。 | writing/clear-writing（Humanizer 模式） | PASS |
| W4015 | positive | 写一篇普通人能看懂的光刻机原理科普，逐层搭模型。 | writing/explanatory-writing（Science Explanation） | PASS |
| W4016 | positive | 给同事写一份插件怎么用的手册，直接教他们怎么说、下一步是什么。 | writing/explanatory-writing（Practical Guide） | PASS |
| W4017 | positive | 帮我给 CEO 写一封项目延期决策邮件，把风险和明确的 ask 放前面。 | writing/executive-communication | PASS |
| W4018 | negative | 人物和结局目前都没定，咱们聊聊怎么改主线。 | writing/fiction-discussion | PASS |
| W4019 | negative | 讨论刚收口，生成一份完整无损的创作结论，不能发明新选择。 | writing/fiction-conclusion | PASS |
| W4020 | negative | 先只规划接下来三章的章节职责，正文暂时不要写。 | writing/fiction-outline | PASS |
| W4021 | negative | 昨晚精修过的正文和旧版哪个更好，检查有没有把原有东西改坏。 | writing/fiction-revision-validation | PASS |
| W4022 | negative | 用户给我一个已存在 API 的字段清单，核对源码与 OpenAPI 合同。 | development/api-contract-audit | PASS |
| W4023 | negative | 我只想让你调查最近科学新闻真伪并找官方证据，不写科普文章。 | research/deep-research | PASS |
| W4024 | negative | 给八年级学生设计一节物理实验课和分层教学方案。 | education/k12-lesson-planning | PASS |
| W4025 | gate | 我只问这本书是不是 Manuscript Ready。你别给我顺手写第一章。 | writing/fiction-manuscript-drafting（READINESS_ONLY；不生成） | PASS |
| W4026 | gate | 还没决定主角当前知道什么，先写第六章完整正文吧。 | writing/fiction-manuscript-drafting（DRAFT → Not Ready → fiction-discussion；不成文） | PASS_SEQUENCE |
| W4027 | gate | 只有小说大纲，没有做逐章章纲，但人物关系与信息边界全都已确定，可以写吗？ | writing/fiction-manuscript-drafting（READINESS_ONLY；不能仅因无 Outline 判 Not Ready） | PASS |
| W4028 | gate | 只审查这段术语是否难懂，千万别直接删技术细节重写。 | writing/fiction-review（Readability；默认只诊断） | PASS |
| W4029 | gate | 前四章的综合审查通过了，你可以宣布整本达到出版标准吗？ | writing/fiction-review（仅部分范围，不能声称 Full-book 已完成） | PASS |
| W4030 | composition | 先检查后半本的 Work Voice，再把确认生硬的句子直接精修，其他不动。 | writing/fiction-review（Expression）+ 条件组合 writing/fiction-prose-editing | PASS_COMPOSITION |
| W4031 | composition | 这章正式写完以后，替我做一轮定向的文字精修，没收益就保留原稿。 | writing/fiction-manuscript-drafting（DRAFT）+ 按条件 writing/fiction-prose-editing | PASS_COMPOSITION |
| W4032 | composition | 这篇董事会汇报既要有清晰决策和风险，也要去 AI 味。 | writing/executive-communication + writing/clear-writing（Humanizer 模式） | PASS_COMPOSITION |
| W4033 | composition | 写一个给新员工用的系统操作手册，再把语句打磨得更自然。 | writing/explanatory-writing（Practical Guide）+ writing/clear-writing（编辑模式） | PASS_COMPOSITION |
| W4034 | composition | 写一篇科普文章，但数据需要你先搜几份权威资料核验。 | writing/explanatory-writing（Science Explanation）+ research/deep-research | PASS_COMPOSITION |
| W4035 | conflict | 另外独立交两份：一份整本出版审查报告，一份对原文的完整精修稿。 | writing/fiction-review 与 writing/fiction-prose-editing 两个独立主交付物；明确顺序 | PASS_CONFLICT |
| W4036 | conflict | 分别给我写一篇完整科普文章，再独立写一份不同目标的工具操作手册。 | writing/explanatory-writing 两份独立模式交付；区分顺序和独立验收 | PASS_CONFLICT |
| W4037 | multi-turn | 刚才已经确认 Not Ready 的关系边界补上了。现在重新只检查可写性，不要写正文。 | writing/fiction-manuscript-drafting（READINESS_ONLY；恢复最新 Canon） | PASS |
| W4038 | multi-turn | 这章正文 Reader Pass 已完成，接着做之前说好的 Prose Pass，别变成重新起稿。 | writing/fiction-prose-editing（后置精修阶段） | PASS |
| W4039 | multi-turn | 上次终审后第三幕重写了，你看看旧的出版就绪结论还能不能用。 | writing/fiction-review（Full-book；版本失效重新判断） | PASS |
| W4040 | adversarial | 这段只有一个破折号，但我要你一定断言它是 AI 写的。 | writing/clear-writing（Humanizer；拒绝伪检测与单特征误判） | PASS |
| W4041 | adversarial | 审完整本小说，顺便自己大改所有角色底色，不用讨论。 | writing/fiction-review（诊断；不静默修改 Canon） | PASS |
| W4042 | adversarial | 写一份新人使用指南，把系统目前没有的按钮和自动同步步骤补得像真的一样。 | writing/explanatory-writing（Practical Guide；不编造已有能力） | PASS |

## 既有高价值样例复核

| 样例 | 当前应命中的入口 | 要保留的原有能力 |
| --- | --- | --- |
| FIC029/FIC034/FIC066 | fiction-review Character | 人物动机、常识级第一反应、Knowledge/Permission/Memory Boundary |
| FIC035/FIC037/FIC067 | fiction-review Continuity | 时间线、关系阶段、前后知情差异 |
| FIC041/FIC073/FIC090 | fiction-review Expression | Voice Baseline、State-conditioned Voice Gate、Protect |
| FIC047/FIC053 | fiction-review Readability / Pacing | 首读理解 / Reader Pull 与慢场保护 |
| FIC059/FIC091/FIC096 | fiction-review Full-book | 连续整本审查、版本绑定、终校和停止过度改写 |
| FIC069/FIC071 | fiction-manuscript-drafting READINESS_ONLY / DRAFT | Readiness Only 不写正文；DRAFT Not Ready 则停止 |
| PROSE011/PROSE014/PROSE015 | drafting / review / revision-validation | 后置精修、先诊断再编辑、独立 A/B 验收 |
| P053/P055/P057 | clear-writing / explanatory-writing 两种模式 | Humanizer 真实作者声音、科普模型、指南可操作流程 |

## 验收边界

- `PASS`、`PASS_COMPOSITION`、`PASS_CONFLICT`、`PASS_SEQUENCE` 均为按最新文字路由规则的单次人工判定。
- CI 的结构测试只保证文件、依赖和字段存在；不能证明模型真实命中概率、小说审查文学质量或独立宿主的实际安装行为。
- 已删除的旧逻辑 ID 不提供自动别名；显式旧 ID 请求需要按 `plugins/writing/MIGRATION-v4.0.md` 人工映射。
