---
name: k12-lesson-planning
description: "用于 K-12 教师从零创建数学、ELA、科学或社会学科的新课、mini-lesson、daily lesson 或 unit 中单课。即使新课同时要求 differentiated/tiered materials，也由本 Skill 统一设计。已有课程需要分层适配时使用 k12-lesson-differentiation；不用于单独评分、rubric、quiz 或作业反馈。"
visibility: workflow
phase: planning
---

# K-12 Lesson Planning

执行前读取 `../../shared/core/pedagogy.md`。确定主学科后，再读取对应 `references/<subject>-pedagogy.md`（math / ela / science / social-studies）；这一步是教学法的按需加载，不要一次加载四科。

## 目标

产出教师能直接判断和实施的 lesson package：教学目标、标准对齐、时间结构、teacher moves、学生任务、材料、formative check / exit ticket，以及需要的 student-facing materials。

本 Skill 适配自 Anthropic / Learning Commons `k12-lesson-planning`。本地版本保留学科教学法与版权/标准 guardrails，移除了对 Learning Commons KG 和自带 Word renderer 的硬依赖。

## Step 1. Route Subject

识别 Math / ELA / Science / Social Studies。跨学科时确定主要学习目标，必要时再补次要学科。

只问真正阻塞设计的信息，优先：

- grade；
- topic / standard / anchor text；
- Social Studies 对齐州标准时的 state；
- 特定时间长度或 curriculum（用户已给则不再问）。

默认 45–60 分钟和 universal-access design；具体学科可因年龄调整。

## Step 2. Ground the Lesson

### Standards

- 用户提供标准文本/代码：以用户材料为准；
- 任务需要当前精确标准时，使用可用官方来源核验；
- 当前无法核验时，说明“标准文本/代码需要教师本地确认”，**不声称**已通过某 KG 或数据库验证；
- Social Studies 若要求 state alignment 且 state 未知，需要获取州信息。

### Curriculum

只有教师明确提供、上传或可靠识别某 curriculum 时，才使用其专有结构名称。否则用通用教学术语。

## Step 3. Build

严格使用 `shared/core/pedagogy.md` 中对应学科的核心：

- Math：结构案例覆盖、学生先尝试、视觉表示、最能暴露 misconception 的 Exit Ticket；
- ELA：按 grade band，complex text / decoding / text-dependent evidence 等；
- Science：phenomenon-first、investigation、SEP/DCI/CCC、CER/model revision；
- Social Studies：state content scope + C3 inquiry、真实 sources、sourcing/contextualization/corroboration。

## Step 4. Differentiate Inside a New Lesson

如果教师在创建新课时同时说“要分层 / below-at-above / ELL / IEP 支持”，仍留在本 Skill。应用 `shared/core/pedagogy.md` 的 differentiation invariants：保留同一标准和核心任务，改变 access/support，并明确哪些是 universal supports、哪些针对具体 learner needs。

不要再额外路由 `k12-lesson-differentiation`。

## Copyright Guardrail

**版权规则是硬边界。**

- 不大段复制商业教材、课程平台、教师指南或受版权保护学生任务；
- 可用其结构、范围、现象/文本选择逻辑来设计原创任务；
- 公共领域文本可以在许可范围内使用并保留 provenance；
- 受版权保护 anchor text 只引用 title/author/source，让教师提供副本，除非用户已合法提供文本用于当前任务。

## Output

默认 teacher-ready 结构：

1. At a glance：grade / subject / time / standard boundary / materials；
2. Learning goal + prerequisite；
3. Vocabulary / anticipated misconceptions；
4. Lesson sequence（每 phase minutes + teacher move + student work + look-fors）；
5. Student-facing tasks/materials；
6. Exit ticket + lesson-specific success criteria；
7. Differentiation / UDL notes（若适用）；
8. Design notes：哪些元素适配时不要破坏。

## Artifact Boundary

上游会用 bundled scripts 生成 Word 文档；当前 Runtime **不包含这些脚本**。

- 用户只要 lesson plan 内容时，直接完整交付；
- 用户明确要 `.docx` / PDF / 文件包时，使用当前宿主真实存在的文档 artifact 工具；
- 工具不可用时如实说明，不伪造下载链接或文件；
- 不把 JSON/rendering 机制暴露成教师必须理解的流程。
