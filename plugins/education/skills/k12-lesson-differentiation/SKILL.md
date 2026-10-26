---
name: k12-lesson-differentiation
description: "教师依据真实可读取的 K–12 已有教案做差异化适配：保持原学段目标、核心标准及认知难度，调整支架、进入方式和拓展；源教案不可读取时不冒造。支持中国及其他实际课程地区，官方标准需核验，不照搬美国体系；从零编写新课走 k12-lesson-planning，学习者直接互动辅导走 learning-coach。"
visibility: workflow
phase: adaptation
---

# K-12 Lesson Differentiation

执行前读取 `../../shared/core/pedagogy.md`。识别**真实源课程所属课程体系与主学科**后，适用时读取对应 `references/<subject>-pedagogy.md`（math / ela / science / social-studies）的教学方法；若源课程在中国/其他地区或精确标准存在歧义，按需读取 `../../shared/core/curriculum-localization.md`。不强行将语文/外语或地方课程等同美国 ELA/C3。

## 必须有 Source Lesson

本 Skill 处理**已有课程**：

- 当前对话已经创建/讨论的 lesson；
- 用户上传或粘贴的 lesson；
- 可读取 URL；
- 用户明确指出的一节课程并提供足够结构。

如果源课程读取失败，明确说明，不能根据标题偷偷重建一节“像它的课”。

从源课程抽取：地区和教学语言、学段年级、学科、标准/objective（注明用户提供或真实核验）、核心任务、时间、文本/phenomenon/source、assessment。适配优先尊重真实原课的目标；**缺源教案不能以本地化为由重建**。

## 核心目标

做 differentiation 时改变**access、support、entry point 和 extension depth**，不要把 Below 变成另一门课。

默认 tiers：Below / At / Above。若教师有更具体组别、ELL/WIDA、IEP/504、diagnostic 或 formative data，使用真实信息替代默认画像。

## 八条规则

严格应用 `shared/core/pedagogy.md` 的 R1–R8：

1. 一份教师 differentiation plan + 学生层面的差异化材料；
2. 保留同一标准和 hard cases；
3. 从 prerequisite teach up；
4. scaffold 不透露答案，通常每 task 1–2 个 embedded support；
5. formative check + anchor activity + **灵活分组** + misconception notes + reflection；
6. 同一 context/text/phenomenon/core task，修改尽量隐形；
7. Below 支架逐步 fade，Above extension 必须增加新思维；
8. 无真实 learner data 时明确使用默认 UDL profile，并邀请 formative evidence 更新分组。

## 地区适配与源教案 Gate

- 仅在确实给出目标地区/教材/课程标准时执行对应本地化；需要精确官方对齐但材料不足时，先按 `curriculum-localization.md` 核验或明确 `standard_unverified`，不伪造中国/美国课标。
- 美国 ELA、NGSS、C3 的学科方法可作为参考，但不能在中国语文、英语外语或社会学科中直接宣称当地标准。原课既有教育目标、材料合法性与核心认知要求优先。
- 从零生成完整新课的请求交给 `education/k12-lesson-planning`；家庭支持归 `education/family-education-guidance`；真正与学习者逐轮教学归 `education/learning-coach`。

## 学科边界

### Math

同一数学结构和核心问题。Below 可从 concrete/representational 进入，不能通过换成只有简单数字来删除标准难点。

### ELA

默认使用**同一 grade-level text 和写作目的**。Below 使用 vocabulary、chunking、annotation、sentence support、read-aloud access 等；如果 K–5 根因是 decoding/fluency，需要把它标成独立 prerequisite 支持，不把 comprehension scaffold 当治疗方案。

### Science

同一 phenomenon、investigation 和 explanation task。Below 也做科学，不允许其他组实验而 Below 只读文章。用 Observation → Representation → Explanation/CER 带上去。

### Social Studies

同一 essential question 和 disciplinary thinking。使用 vocabulary、sourcing/contextualization、evidence organizer 等支架；不能把 corroboration 降级成只找一个事实，也避免 presentism 和单因果简化。

## Output

1. Source lesson readback：grade / objective / standard / core task；
2. Differentiation overview；
3. Tier matrix：entry point、support/extension、teacher conferring move、student task；
4. Formative check + lesson-specific regroup criteria；
5. Per-tier misconception/error signals；
6. Student-facing changes；
7. Anchor/extension task；
8. Next evidence：哪些 diagnostic/exit-ticket/observation 可进一步优化分组。

已给学生个体形成性证据、IEP/504、诊断材料等包含隐私时，按需读取 `../../shared/core/education-evidence-and-safety.md`；只在当前差异化设计所需范围使用，避免输出可识别学生信息、长期能力标签或默认保存学情。

## Standards, Copyright & Artifact Boundary

- 标准无法可靠核验时明确边界，**不声称**调用了不存在的 Learning Commons KG；
- 不大段复制专有 curriculum/student materials；
- 上游自带 Word renderer 未集成；用户需要文件时只调用当前宿主真实可用的 artifact 工具；
- 未真实生成文件时不能声称文件已创建。
