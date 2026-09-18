---
name: fiction-writing
description: "用于把已经明确或被用户明确委托的小说方向真正写成正文：支持中篇级多章节小说、短篇轻量直写、续写、按章/按部分创作、场景级重写和确认后的结构重写。适合‘直接开始写/这是完整大纲按它写/继续下一章/人物和结尾保留直接给新版/剩下细节你定别问我’。故事高层仍需共同决定时用 fiction-story-architecture；高层已定但主要补人物/关系/场景/信息时用 fiction-story-development；只改清晰措辞用 clear-writing，只去 AI 味用 humanizer。"
visibility: workflow
phase: creation
optional_uses: "writing/humanizer,github/github-issue-manager"
---

# Fiction Writing / 小说成文

## 唯一目标

在用户已经确认或明确委托的方向范围内，把作品真正写成小说。**拥有表达自由，不拥有未授权的方向自由。**

## 主流程

1. **读取创作合同**：优先使用当前对话、用户给出的架构/大纲/正文、【创作】Issue 当前正文和 Story Development Plan。已经确认的内容不重问。
2. **判断授权范围**：Genre/作品身份、核心阅读体验、关键人物关系、Story Movements、终点、POV、明确禁区默认不能自行改变；对白、动作、段落、场景内部节奏、生活细节和局部描写属于表达层自由。
3. **直接写模式**：用户明确“剩下你定/别问我/直接写”时，可在其授权范围内内部完成必要的轻量 Architecture + Development，再直接交正文；不展示机械问卷，不伪称模型选择是用户原话确认。
4. **执行作品表达合同**：保持已定调性、语言倾向、叙事距离、描写密度、对白和节奏方向。人物反应来自既有人格，不来自类型套路。
5. **诚实 POV 与信息**：不靠作者作弊隐瞒视角人物自然知道的信息；给读者足够方向感。安静场景、概述和省略都可以按作品需要使用。
6. **保持连续性**：分章/多轮写作时检查人物位置、关系、时间、物件、已知信息和上一个自然单元的结尾，不重复回放同一事件。
7. **完稿与修订**：整本完成后先连续通读，再做问题导向修订；最后才进入句子级精修。统计只用于诊断，不作为字数、章长或词频 KPI。

## 结构性重写边界

- 只压缩冗余、改对白、调整段落、重写某场但保持原作用 → 本 Skill 直接执行。
- 会改变 Story Movement、核心人物、重要关系、作品身份、POV、时间范围、终点或主要支线 → 先使用 Architecture/Development 完成重新设计，再由本 Skill 写入正文。
- 用户明确“结构你自己定/直接给新版”时，视为相应高影响选择的委托，可内部顺序执行前两层能力后直接重写，不额外制造确认轮次。

## 按需读取

- 正式场景落地、连续性和 Show/Tell 取舍需要检查时读取 `references/drafting.md`。
- 整本通读、结构修订、章节边界复核和停止修订时读取 `references/revision.md`。
- 当前作品需要类型知识时读取 [Genre 索引](../../shared/fiction/genres/index.md)，只加载已经与作品身份匹配的类型 reference；类型知识不得重新定义作品。
- 用户要求长期 GitHub 正文存档时读取 [创作 Issue 工作流](../../shared/fiction/references/creative-issue-workflow.md)。

## Skill Composition / 能力组合

- 用户明确要求“去 AI 味 / humanize”时，在叙事事实、人物、信息和作品合同确定后组合 `writing/humanizer`；本 Skill 保留小说事实和场景决策。
- 用户明确要求【正文】Issue/长期 GitHub 存档时组合 `github/github-issue-manager`；本 Skill 负责正文，Issue 能力只负责真实持久化。

## 停止边界

- 发现一个未授权的高影响方向必须重定 → 不在正文里偷改；回到对应前置阶段或向用户确认。
- 当前主要任务只是已有文本清晰改写/去 AI 味 → 不抢编辑类主路由。
- 用户要求暂停/只看当前稿时立即停，不为了“完整流程”继续扩写或修订。
