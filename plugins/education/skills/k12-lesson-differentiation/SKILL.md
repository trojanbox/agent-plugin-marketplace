---
name: k12-lesson-differentiation
description: "用于把已有 K-12 数学、ELA、科学或社会学科课程适配为不同 proficiency/learner needs 的分层学习路径。核心是保留同一标准、essential question 和认知要求，通过支架、入口与 extension 调整访问方式。新课从零创建时使用 k12-lesson-planning。"
visibility: workflow
phase: adaptation
---

# K-12 Lesson Differentiation

执行前读取 `../../shared/core/pedagogy.md`。识别源课程主学科后，再读取对应 `references/<subject>-pedagogy.md`（math / ela / science / social-studies）；只加载当前学科。

## 必须有 Source Lesson

本 Skill 处理**已有课程**：

- 当前对话已经创建/讨论的 lesson；
- 用户上传或粘贴的 lesson；
- 可读取 URL；
- 用户明确指出的一节课程并提供足够结构。

如果源课程读取失败，明确说明，不能根据标题偷偷重建一节“像它的课”。

从源课程抽取：grade、subject、standard/objective、核心任务、时间、文本/phenomenon/source、assessment。

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

## Standards, Copyright & Artifact Boundary

- 标准无法可靠核验时明确边界，**不声称**调用了不存在的 Learning Commons KG；
- 不大段复制专有 curriculum/student materials；
- 上游自带 Word renderer 未集成；用户需要文件时只调用当前宿主真实可用的 artifact 工具；
- 未真实生成文件时不能声称文件已创建。
