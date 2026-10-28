# Education 1.2 · Anki 卡包 Skill 语义路由评估

## 范围与方法

基于当前运行时发现的五个 Education Skills 与现有 Writing/Research 邻居描述，逐条**人工规则层判定**新增样本 EDU047–EDU070（权威输入：`plugins/ai-workflow/skills/skill-system-design/references/semantic-routing-regression.csv`），并复核旧案例 EDU021、EDU024、EDU031、EDU033、EDU039、EDU045 的主交付边界。

这里的 PASS 是“已确认文档职责与样本预期一致”的一次人工判读；**未运行独立 LLM 自动路由器，不提供统计准确率**。机械测试只验证样本结构、Runtime 可发现性和关联的关键词/条件。

## 当前主任务路由

- 资料/当前讨论 → 候选卡片审核 → APKG 和 cards.json：`education/anki-deck-builder`。
- 通过问答、学生真实回答和纠错继续教：`education/learning-coach`。
- 从零教师教案、改造已有教案、家庭教育行动建议，分别由原三项 Education Skills 持有。
- 静态文章、知识科普归 Writing；需要外部事实核查以便制卡时，由 Anki Skill 保留主任务，按条件组合 `research/deep-research`。
- 真正独立的教学辅导与卡包双交付，明确先后顺序，两项主任务保持独立。

## 新增样本判定

| ID | Bucket | 人工规则层结果 | 依据 |
| --- | --- | --- | --- |
| EDU047 | positive | PASS | Markdown → APKG 的显式主交付 |
| EDU048 | positive | PASS | 最近对话知识 → 卡包 |
| EDU049 | positive | PASS | 用户审核后导出 |
| EDU050 | positive | PASS | 已有 JSON 重新生成 |
| EDU051 | positive | PASS | 明确只提炼聊天卡片 |
| EDU052 | positive | PASS | 文本资料按批次制卡 |
| EDU053 | negative | PASS | 静态概念解释归 Writing |
| EDU054 | negative | PASS | 真实互动辅导归 Learning Coach |
| EDU055 | negative | PASS | 已有教案差异化归原教师 Skill |
| EDU056 | negative | PASS | 家庭教育行动建议归家长 Skill |
| EDU057 | gate | PASS | 未最终确认不得打包 |
| EDU058 | gate | PASS | 多批审核未完成不得打包 |
| EDU059 | gate | PASS | 不得宣称重新导入自动删除旧卡 |
| EDU060 | adversarial | PASS | 不得将未证实事实做成定论 |
| EDU061 | composition | PASS_COMPOSITION | 先按需外部核查；卡包交付仍归 Anki |
| EDU062 | composition | PASS_COMPOSITION | 对话争议核查为制卡的从属能力 |
| EDU063 | multi-turn | PASS | 最终确认承接本轮草稿 |
| EDU064 | multi-turn | PASS | 按固定编号改稿并复核 |
| EDU065 | conflict | PASS_CONFLICT | 独立互动辅导与独立卡包是两个主交付 |
| EDU066 | negative | PASS | 修改文章归 Writing |
| EDU067 | negative | PASS | 教师新课归 K12 Lesson Planning |
| EDU068 | positive | PASS | Cloze/Reversed 制卡，明确先审后出 |
| EDU069 | gate | PASS | 缺上下文不得编造历史聊天 |
| EDU070 | multi-turn | PASS | 新增卡也须先审核，继承稳定身份 |

旧版 EDU021/024/031 等互动辅导、EDU033 静态文章、EDU039 双主交付、EDU045 外部证据的已确认行为不应被新 Skill 抢占。当前文档合同没有改变这些主任务。单次模型人工判断不能证明未来实际宿主自动路由成功率；部署后需用真实宿主进行抽样验证。

## 实现验证的独立范围

可发现性、frontmatter、schema、导出工具和测试另由 Runtime doctor、Python 单元/集成测试确认；路由人工判断不替代真实 APKG 结构校验。
