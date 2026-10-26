---
name: k12-lesson-planning
description: "教师从零创建 K–12 单课或教学活动（数学、语文/ELA、科学、社会学科等），包含学习目标、活动、材料和形成性检查；新课要求分层时由本 Skill 内处理。根据用户实际学段、地区与真实课程标准/教材适配中国及其他地区，不伪造课标；已有课程的调整进入 k12-lesson-differentiation，学习者直接互动辅导归 learning-coach。"
visibility: workflow
phase: planning
---

# K-12 Lesson Planning

执行前读取 `../../shared/core/pedagogy.md`。只有主学科适用时，才选择 `references/<subject>-pedagogy.md`（math / ela / science / social-studies）中的**教学方法**；非美国地区或不同学科体系不得把美国 ELA/NGSS/C3 方法冒充当地官方课标，按下方 Locale Gate 决定是否加载本地化参考。不要一次加载四科。

## 目标

产出教师能直接判断和实施的 lesson package：教学目标、标准对齐、时间结构、teacher moves、学生任务、材料、formative check / exit ticket，以及需要的 student-facing materials。

本 Skill 适配自 Anthropic / Learning Commons `k12-lesson-planning`。本地版本保留学科教学法与版权/标准 guardrails，移除了对 Learning Commons KG 和自带 Word renderer 的硬依赖。

## Step 1. Route Subject

识别当前地区实际的学科与教学目标（美国常见 Math / ELA / Science / Social Studies；中国可出现数学、语文、英语、科学、物理、化学、历史、地理等）；跨学科时确定主要学习目标，必要时再补次要学科。不能为了适配四个旧 reference 强行改变课程科目。

只问真正阻塞设计的信息，优先：

- grade；
- topic / standard / anchor text；
- Social Studies 对齐州标准时的 state；
- 特定时间长度或 curriculum（用户已给则不再问）。

默认 45–60 分钟和 universal-access design；具体学科可因年龄调整。

## Step 2. Ground the Lesson

### Locale & Standards Gate

若用户要求适配中国或任何非美国课程体系、给定当地教材/课标，或有标准版本歧义，按需读取 `../../shared/core/curriculum-localization.md`；保留真实地区、学段、学科、教材及版本，不默认套用美国州标准。中国语文不能直接等同美国英语母语 ELA，学校英语也不能自动照搬母语 Phonics；历史/道德与法治的具体标准不来自美国 C3。

### Standards

- 用户提供适用的当前标准文本/代码：以该材料为本轮事实基础，并明确版本与当地适用条件；
- 任务需要当前精确标准时，使用可用官方来源核验；
- 当前无法核验时，说明“标准文本/代码需要教师本地确认”，**不声称**已通过某 KG 或数据库验证；
- **只有确实使用美国州标准且需要精确州级对齐时**才向教师确认州；中国及其他地区应获取对应的实际课程体系，不默认追问美国州名。

### Curriculum

只有教师明确提供、上传或可靠识别某 curriculum 时，才使用其专有结构名称。否则用通用教学术语。

## Step 3. Build

优先保持 `shared/core/pedagogy.md` 中可跨课程体系复用的教学原则；美国专项内容**仅在实际适用时**使用，不得覆盖用户所在地区的真实教学目标：

- Math：结构案例覆盖、学生先尝试、视觉表示、最能暴露 misconception 的 Exit Ticket；
- ELA：按 grade band，complex text / decoding / text-dependent evidence 等；
- Science：phenomenon-first、investigation、SEP/DCI/CCC、CER/model revision；
- Social Studies：state content scope + C3 inquiry、真实 sources、sourcing/contextualization/corroboration。

## Step 4. Differentiate Inside a New Lesson

如果教师在创建新课时同时说“要分层 / below-at-above / ELL / IEP 支持”，仍留在本 Skill。应用 `shared/core/pedagogy.md` 的 differentiation invariants：保留同一标准和核心任务，改变 access/support，并明确哪些是 universal supports、哪些针对具体 learner needs。

不要再额外路由 `k12-lesson-differentiation`。

## 任务与相邻 Skill 边界

用户是教师但主要要求直接给学习者提问、根据真实回答开展互动 → `education/learning-coach`。家长需要亲子沟通与家庭教育方案 → `education/family-education-guidance`。新课设计与新课内分层仍由本 Skill 主导，不与旧教案改造抢主路由。

学生材料涉及未成年人个人信息、敏感行为或真实个体记录时，按需读取 `../../shared/core/education-evidence-and-safety.md`；仅使用与当前课程设计必要的最少资料，不因教师身份默认建立学情档案。

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
