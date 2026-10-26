---
name: fiction-review
description: "小说内容与质量审查统一入口：人物/Character Voice、跨章连续性与信息边界、作品 Work Voice/POV、第一次阅读可读性、多章节节奏/Reader Pull，以及整本连续通读和出版终校。按用户明确意图选择专项模式，只诊断或在授权下有限修复；本轮改稿是否修好走 fiction-revision-validation，纯文笔精修走 fiction-prose-editing，高影响剧情决定走 fiction-discussion。"
visibility: workflow
phase: verification
optional_uses: "writing/fiction-prose-editing"
---

# Fiction Review / 小说内容审查

## 唯一目标

用**一套审查入口、六种按需加载的审查模式**，回答当前作品的人物、事实、表达、理解、节奏或全书质量是否存在有正文证据的真实问题。共享评判合同以 `../../shared/fiction/references/review-contract.md` 为准；不把不同维度强行合并为一个评分，也不因为审查就重写作品。

## 路由与审查范围

依据用户主要问题确定模式，**只加载命中模式所需的 reference**。用户一句话涉及相近维度时在同一 Review 内按需检查，无需让用户在五个审查 Skill 之间选择。

| 用户真正想确认的内容 | 模式（按需读） |
| --- | --- |
| “这个人还像自己吗”“为何像客服”“他知道却为何不说”“初见就像老熟人” | Character → `../../shared/fiction/references/review-character-mode.md` |
| “前后设定打架”“上一章客气、下一章突然亲密”“第 5→6→7 章接不上” | Continuity → `../../shared/fiction/references/review-continuity-mode.md` |
| “文风漂移”“旁白和角色越来越像 AI”“POV 乱了” | Expression → `../../shared/fiction/references/review-expression-mode.md` |
| “第一次读看不懂”“术语密度太高”“不知道谁在做什么” | Readability → `../../shared/fiction/references/review-readability-mode.md` |
| “前十章读着累”“重复流程”“后半段赶进度”“读者拉力不够” | Pacing → `../../shared/fiction/references/review-pacing-mode.md` |
| “整本从头到尾审”“出版终校”“达到发布标准了吗”“旧终审还算吗” | Full-book → `../../shared/fiction/references/review-full-book-mode.md` |

- 只问一个局部问题 → 加载单一专项模式，必要时增加一个相关模式；不得默认执行全书终审。
- 只问“全书人物 / 整本节奏” → 仍由 Character/Pacing 为主，连续阅读范围可到全书；只有综合 Publication Readiness / 出版终校才进入 Full-book。
- 用户已做过一次改稿，要求“本轮改完修好了吗、有无回归、A/B 哪个更好” → `writing/fiction-revision-validation` 保留独立验收。
- 用户明确只要“剧情不变，直接把句子写自然、细腻一点” → `writing/fiction-prose-editing`；一般文本润色 → `writing/clear-writing`。
- 人物/Story/结局尚无已确认设计，需要重新讨论 → `writing/fiction-discussion`；正文生成 → `writing/fiction-manuscript-drafting`。

## Evidence First / 统一执行流程

1. **恢复来源**：读取项目 AGENTS、Book README、对应 Directory Contract、当前 World/Characters/Story/Style、必要 Manuscript 与 Preserve Set；不以过期稿或聊天记忆替代现行 Canon。
2. **明确范围与模式**：段落、单章、相邻章节、Story Movement 或整本；仅引用必要专项参考。关键 Knowledge / Permission / Memory Boundary 检查时读 `../../shared/fiction/references/character-knowledge-boundaries.md`。
3. **先连续阅读，再找证据**：给出具体段落、状态前后、可复现的读者阻力或重复机制；优先记录已成立的 1–2 个有效细节作为 Protect Set。
4. **定位根因与 Owner**：明确问题属于 World / Characters / Story / Style / Planning / Manuscript；按共用 Review Contract 给 P0/P1/P2 与影响范围。不凭“个人喜欢另一种写法”判缺陷。
5. **输出**：问题、原文证据、为什么影响阅读、涉及的 Owner、严重度、建议方向，以及“不必修改”的 Protect / No Change 项。若缺少必要正文或权威文件，说明无法完整验收的范围。

长篇跨章节读法与防重复方法需要时读 `../../shared/fiction/references/revision-methods.md`，作品声音判断需要时读 `../../shared/fiction/references/voice-contract.md`。上述 reference 仅在真实触发时加载，不预读全部。

## Full-book / 终校附加 Gate

全书综合模式**必须**从头到尾连续阅读当前完整 Manuscript，并记录仓库/分支/commit（可取得时）、章节集合和 Revision 基线。若未完整通读，不宣称 `Continuous Read Complete` 或 `Publication Readiness Reviewed`。

终审结论仅绑定审查过的版本；实质改写可能使其失效，按影响范围决定局部重检或重新整本阅读。用户明确要出版终校或检查标点/章名/格式时，再读 `../../shared/fiction/references/publication-proofread.md`。一般内容审查不自动执行出版级文本修改。

## Skill Composition / 条件组合

仅用户明确要求“审查并修复”且有证据表明问题**限于措辞、句际连贯或细腻感**时，先完成 Review 诊断与 Protect Set，再按需组合 `writing/fiction-prose-editing`；只审查、不需要修改时不加载。父级 Review 保留审查结论，语言编辑不得越过 Canon。

## 修改与停止边界

- **默认只诊断**：不静默改 World、Characters、Story、Style、Planning 或 Manuscript；无用户要求不建 Issue。
- 用户同时明确要求“审查并修复”，且问题仅限遣词、句际连贯、细腻感：先完成诊断与 Protect，再按需组合 `writing/fiction-prose-editing` 进行定向修改并核对 A/B；这不授权改高影响剧情或 Canon。
- 高影响设计问题交给 `writing/fiction-discussion`；本轮修改的独立验收交给 `fiction-revision-validation`。
- 没有具体缺陷或优化会伤害已成立的人物 Voice、生活感与表达时明确 `Protect / No Change`。只有真实执行过的审查范围与验证可声称完成。
