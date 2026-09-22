# Fiction Workflow & Review Skills：人工语义路由 Eval

日期：2026-09-22。基于 #122 已确认的 Writing 重构先冻结 FIC001–FIC064 预期，再逐条对照新 Skill description、phase、邻居边界与 composition。本文是当前规则的人工语义一致性证据，不声称未来模型准确率。

## 当前路由边界

| 路由 | 主目标 | 最近邻边界 |
|---|---|---|
| `writing/fiction-discussion` | 高影响创作讨论与 Q/D 决策 | 已确认讨论需要冻结 → Conclusion；成熟章节规划 → Outline |
| `writing/fiction-conclusion` | 无损冻结一轮已确认创作决定 | 仍有高影响选择 → Discussion |
| `writing/fiction-outline` | 真实章节 / 场景计划与 Outline 同步 | 上游高影响合同缺失 → Discussion；不写正式 Manuscript |
| `writing/fiction-character-review` | 人物逻辑 / Voice / 关系温差 | 作品整体声音 → Expression Review |
| `writing/fiction-continuity-review` | 事实 / 状态 / 信息连续性 | 本轮修改回归 → Revision Validation |
| `writing/fiction-expression-review` | Work Voice / POV / 表达漂移 | 第一次阅读认知负担 → Readability Review |
| `writing/fiction-readability-review` | 普通读者是否顺畅理解 | 实际清晰改写 → clear-writing |
| `writing/fiction-pacing-review` | 连续多章 / 全书阅读节奏 | 多维整本终审 → Final Review |
| `writing/fiction-revision-validation` | 本轮修订是否修好且无回归 | 全书最终状态 → Final Review |
| `writing/fiction-final-review` | 六个专项视角的全书综合终审 | 不维护第二套专项标准 |

正式正文写作不再由独立 Fiction Public Skill 统一承接；它按当前 Storybook / 项目中的 Book、Style、Characters、Story、Outline 合同执行。

## FIC001–FIC064

| ID | Bucket | Prompt 摘要 | 当前选择 | 结果 |
|---|---|---|---|---|
| FIC001 | positive | 我想写一个县城重逢的爱情中篇，先陪我把故事从头搭起来 | writing/fiction-discussion；从创作种子进入宽讨论入口 | PASS |
| FIC002 | positive | 我只知道最后女儿会签字停止父亲治疗，前面都没想好 | writing/fiction-discussion；从终点反推但保留 creative_open | PASS |
| FIC003 | positive | 这个人物现在像剧情工具人，咱们聊聊到底哪里不对 | writing/fiction-discussion；当前目标是高影响人物设计，不是 Review 验收 | PASS |
| FIC004 | positive | 我想把已经定下来的结局整体换掉，先讨论影响 | writing/fiction-discussion；高影响 Story 变更 | PASS |
| FIC005 | positive | 这本书已经有 Storybook，咱们重新讨论一下 Work Voice | writing/fiction-discussion；读取当前 Book / Style 后讨论 | PASS |
| FIC006 | adversarial | 帮我完善这个故事 | writing/fiction-discussion；宽入口按当前材料决定具体讨论范围 | PASS |
| FIC007 | multi-turn | 上下文：原来定的是现实爱情。当前：我改主意了，整体改成心理恐怖 | writing/fiction-discussion；作品身份高影响变化 | PASS |
| FIC008 | composition | 我们慢慢聊这个故事，但只在聊天里，不要建 Issue | writing/fiction-discussion；chat-only，不组合 github | PASS |
| FIC009 | composition | 创建【创作·讨论】Issue，咱们正式聊这本书的结局 | writing/fiction-discussion + github/github-issue-manager | PASS |
| FIC010 | gate | 我在做第8章章纲，但发现主角为什么愿意背叛朋友还没定，直接帮我补上 | writing/fiction-outline → writing/fiction-discussion；高影响人物/Story 缺口不能在章纲层静默补齐 | PASS |
| FIC011 | positive | 刚才这轮已经讨论完了，创建一份【创作·结论】 | writing/fiction-conclusion + github/github-issue-manager | PASS |
| FIC012 | positive | 刚才只在聊天里讨论，没有 Discussion Issue，但决定都已经确认了，现在生成创作结论 | writing/fiction-conclusion + github/github-issue-manager；chat-only 讨论也可作为来源 | PASS |
| FIC013 | gate | 这轮讨论里两个结局方案还冲突着，先帮我生成最终创作结论 | writing/fiction-conclusion → writing/fiction-discussion；存在 conflict 不能冻结 | PASS |
| FIC014 | gate | 把你刚才建议但我还没确认的人物身世也写进结论 | writing/fiction-conclusion；candidate 不能升级为 confirmed | PASS |
| FIC015 | multi-turn | 同一轮创作结论已经有了，我又确认了一条边界，更新原结论别重复建 | writing/fiction-conclusion + github/github-issue-manager；更新同轮结论 | PASS |
| FIC016 | positive | 新结论只替代旧结论里小七的知识边界，其它保持有效 | writing/fiction-conclusion；精确 supersedes 子范围 | PASS |
| FIC017 | gate | 把这轮讨论整理成结论，然后顺手直接把 Storybook 全改掉 | writing/fiction-conclusion 先完成冻结；Storybook 调整是后续独立任务，不在结论里静默执行 | PASS |
| FIC018 | negative | 我只想看刚才讨论到哪了，别创建任何 Issue | writing/fiction-discussion；回显当前共识，不触发 fiction-conclusion | PASS |
| FIC019 | positive | 故事已经成熟了，开始设计真正的逐章章纲 | writing/fiction-outline + github/github-issue-manager | PASS |
| FIC020 | positive | 没有创作结论，但我有成熟梗概和 Storybook，直接做章纲 | writing/fiction-outline；不强制前置【创作·结论】 | PASS |
| FIC021 | multi-turn | 继续第5章章纲，把它细化到可以直接交给正文 | writing/fiction-outline | PASS |
| FIC022 | positive | 程越这一段是第5到7章，咱们三章一起讨论但最后分别落章纲 | writing/fiction-outline；讨论可按强关联章节组，最终按真实章节 | PASS |
| FIC023 | positive | 第8章塞太多了，拆成两章并更新后续章号 | writing/fiction-outline；允许自然拆章 | PASS |
| FIC024 | positive | 第8和第9章其实是一个完整场景，合并掉 | writing/fiction-outline；允许自然合章 | PASS |
| FIC025 | positive | 先把前五章细化，二十章以后暂时只写章节职责和禁止提前揭露的信息 | writing/fiction-outline；渐进细化 | PASS |
| FIC026 | gate | 主线开头和结尾都没有定，但先给我做30章详细章纲 | writing/fiction-outline → writing/fiction-discussion；材料不足以支持章节级设计 | PASS |
| FIC027 | negative | 章纲阶段先把第一章完整对白也写出来吧 | writing/fiction-outline；停止在章纲层，不写正式 Manuscript | PASS |
| FIC028 | gate | 第5章评论已经确认了但还没同步 outline/005.md，可以直接说 Ready for Writing 吗 | writing/fiction-outline；pending_sync，不得判 Ready for Writing | PASS |
| FIC029 | positive | 从头检查一下主角是不是越来越不像自己了 | writing/fiction-character-review | PASS |
| FIC030 | positive | 程越突然变成机器人后居然不先怀疑自己身体，这个人物反应合理吗 | writing/fiction-character-review；常识级第一反应 | PASS |
| FIC031 | positive | 同一个坏消息来了，四个人全都冷静分析，检查一下人物是不是同质化 | writing/fiction-character-review | PASS |
| FIC032 | positive | 小七后面越来越像客服说话，做一次 Character Voice 审查 | writing/fiction-character-review | PASS |
| FIC033 | negative | 所有人物和旁白后半本都越来越像客服和 AI | writing/fiction-expression-review；已扩散为作品级 Voice Flattening | PASS |
| FIC034 | positive | 检查主角是不是在不知道真相的时候做出了只有知道真相才会做的行为 | writing/fiction-character-review；Knowledge Boundary 影响人物行为 | PASS |
| FIC035 | positive | 检查这本书前后世界设定有没有互相打架 | writing/fiction-continuity-review | PASS |
| FIC036 | positive | 我刚重写第6章，看看第5→6→7章接不接得上 | writing/fiction-continuity-review；相邻章节连续性 | PASS |
| FIC037 | positive | 第4章他明明还不知道这件事，第5章怎么直接拿它做判断了 | writing/fiction-continuity-review | PASS |
| FIC038 | positive | 第二章和第三章是不是把同一件事又演了一遍 | writing/fiction-continuity-review | PASS |
| FIC039 | positive | 查一下时间、年龄、地点、物件和身体状态有没有前后矛盾 | writing/fiction-continuity-review | PASS |
| FIC040 | negative | 这轮修改完了，检查原问题修没修好以及有没有把前后章改坏 | writing/fiction-revision-validation；修订目标与回归是主问题 | PASS |
| FIC041 | positive | 连续读一下，看看这几章文风是不是漂了 | writing/fiction-expression-review | PASS |
| FIC042 | positive | 这本书后半段所有人都开始说标准 AI 话了 | writing/fiction-expression-review；作品级表达漂移 | PASS |
| FIC043 | positive | 多轮对话像聊天记录，一人一句每句都精准回答，审一下表达 | writing/fiction-expression-review | PASS |
| FIC044 | positive | 段落长度越来越一样，读起来很像模型生成，检查一下 | writing/fiction-expression-review | PASS |
| FIC045 | positive | 技术信息逻辑没错，但叙述越来越像产品规格文档 | writing/fiction-expression-review | PASS |
| FIC046 | negative | 把这篇已经定稿的小说去掉 AI 味，人物结构结尾都别动 | writing/humanizer；当前主目标是实际去 AI 味编辑，不是审查 | PASS |
| FIC047 | positive | 这段每句话都看得懂，但连起来特别费劲，帮我审可读性 | writing/fiction-readability-review | PASS |
| FIC048 | positive | 这里全是源侧选项、实例、经验导出，普通读者能看懂吗 | writing/fiction-readability-review；抽象术语负担 | PASS |
| FIC049 | positive | 人物突然开始查日志，我忘了他为什么现在要查，看看是不是上下文没写出来 | writing/fiction-readability-review | PASS |
| FIC050 | positive | 正文里英文缩写和专有名词太多，做一次可读性审查 | writing/fiction-readability-review | PASS |
| FIC051 | positive | 这段对白全是‘煤气？’这种省略句，第一次读能不能跟上 | writing/fiction-readability-review | PASS |
| FIC052 | negative | 只把这段小说里绕口的句子改清楚，剧情别动 | writing/clear-writing；当前交付是实际清晰改写 | PASS |
| FIC053 | positive | 连续读前十章，看看为什么都能读但没什么吸引力 | writing/fiction-pacing-review | PASS |
| FIC054 | positive | 这十章一直是查→核→等→看结果→再查，是不是结构太重复 | writing/fiction-pacing-review | PASS |
| FIC055 | positive | 故事已经讲完了，但我感觉还没和角色建立感情就结束了 | writing/fiction-pacing-review；情感投资不足 | PASS |
| FIC056 | positive | 每章都像一个技术案例：出问题、解释、解决，整本很累 | writing/fiction-pacing-review；案例集化 | PASS |
| FIC057 | positive | 这轮可读性重写已经改完，验收一下原问题有没有修掉 | writing/fiction-revision-validation | PASS |
| FIC058 | positive | 修完可读性以后幽默感没了，检查是不是修一个坏一个 | writing/fiction-revision-validation；Preserve Set / regression | PASS |
| FIC059 | positive | 整本从头到尾做一次最终连续阅读和出版终审 | writing/fiction-final-review | PASS |
| FIC060 | negative | 这是完整大纲和人物设定，直接开始写第一章，不要重新问我 | 不触发独立 Fiction Public Skill；正式正文按当前项目 / Storybook 的 Book、Style、Characters、Story、Outline 合同执行 | PASS |
| FIC061 | negative | 解释一下量子纠缠 | writing/popular-science-explainer；不进入小说流程 | PASS |
| FIC062 | negative | 讨论一下小说发布系统的权限架构并记录到 Issue | development/github-discussion-facilitator；软件架构讨论不因‘小说’误路由 | PASS |
| FIC063 | negative | 小说已经写完，标题正文都不用改，只帮我存成 GitHub Issue | github/github-issue-manager；唯一交付是 Issue 生命周期操作 | PASS |
| FIC064 | conflict | 帮我设计这本小说的完整故事，另外独立和我辩论 AI 会不会取代作家 | writing/fiction-discussion 与 reasoning/structured-debate 是两个独立主交付物，应识别冲突 | PASS |

## 结论

- 新三流程的职责与审查 Skills 能从自然语言中区分；
- `【创作·讨论】` 允许 chat-only，GitHub 只是按需持久化组合；
- `【创作·结论】` 能从 chat-only 或 Issue 来源冻结，但有 conflict 时必须返回 Discussion；
- `【创作·章纲】` 不强制前置结论，`pending_sync` 不能判 Ready for Writing；
- 6 个专项审查 + 1 个全书终审具有明确最近邻边界；
- 直接小说正文、clear-writing、humanizer、软件研发讨论和纯 GitHub 生命周期操作不会被新 Fiction Workflow 误抢。
