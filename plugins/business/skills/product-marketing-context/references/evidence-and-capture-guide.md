# Product Marketing Context 证据原则与字段采集指南

创建或大幅更新 Context 时读取，用于 Source First、Fact/Inference、客户原话以及各 Context 字段采集。

## 核心原则

### 1. Source First

优先从用户已经提供的材料和当前工作区读取事实：

1. 用户明确陈述；
2. 当前项目中的 README、官网/落地页文案、产品文档、价格页、销售材料、客户访谈、支持记录；
3. 用户授权或任务需要时的第一方网页；
4. 其他外部来源。

用户要求基于给定材料建立 Context 时，只写入材料能支持的内容。缺失项标记为未知，不用常识补齐。

### 2. Fact / Inference Separation

Context 里的重要信息必须区分证据状态。使用以下 `Evidence Status`：

- `confirmed`：用户明确确认；
- `supported`：有当前材料或可靠来源直接支持；
- `inferred`：根据证据合理推断，但尚未确认；
- `unknown`：当前没有足够证据。

不得把 `inferred` 写成既定事实。关键定位、ICP、竞争优劣、客户痛点和 Proof Point 如果只是推测，要显式保留状态。

### 3. Customer Language Must Be Real

客户原话价值很高，但只有真正来自访谈、评论、销售记录、支持记录或用户提供的真实语句才可以放进“Customer Language / Testimonials”。

不要为了让 Context 更完整而编造客户引语、案例、Logo、指标或 testimonial。

### 4. Reuse Without Staleness

Context 是长期文件，不是一次性 Prompt。所有实质修改都要版本化并写 Changelog；旧内容若被新证据推翻，要更新正文并保留变更记录。

### 5. Ask Only for Material Gaps

已有材料足够时直接起草，不重复问用户已经回答过的问题。缺口很多时，一次只追问少量会显著改变定位或后续输出的问题，不要一次倾倒整套问卷。

---

# Workflow

## Phase 1 — Resolve Context Target

1. 识别当前真实项目/工作区根目录。
2. 检查以下位置：
   - `.agents/product-marketing.md`（canonical）
   - `.claude/product-marketing.md`
   - `.agents/product-marketing-context.md`
   - `.claude/product-marketing-context.md`
3. 如果只发现旧位置：
   - 读取并保留内容；
   - 告知用户存在旧位置；
   - 在有明确工作区且用户没有要求保留旧路径时，可迁移到 `.agents/product-marketing.md`；
   - 不同时维护多份互相漂移的 Context。

### 若已有 Context

- 读取完整文件；
- 先识别 `Document version`、`Last updated`、最近 Changelog；
- 判断用户是全量 refresh 还是局部更新；
- 未要求修改的章节尽量保持原样；
- 只为受影响章节收集新证据。

### 若没有 Context

优先采用“从现有材料起草”：

- 读取用户已经提供的产品资料和当前工作区相关文件；
- 若用户给了官网或明确要求查外部最新信息，再使用当前环境的检索/页面读取能力；
- 先起草能被证据支持的部分；
- 把 `inferred` / `unknown` 集中列出给用户核对。

如果没有足够材料，再进入对话采集模式。

---

## Phase 2 — Build Evidence Inventory

在形成正文前，内部建立最小证据清单，至少覆盖会影响定位的核心信息：

| Area | Evidence | Status | Notes |
|---|---|---|---|
| Product | 产品实际做什么 | confirmed/supported/inferred/unknown | 来源或缺口 |
| Audience | 谁最需要它 | ... | ... |
| Pain | 为什么会购买 | ... | ... |
| Alternatives | 当前替代方案 | ... | ... |
| Differentiation | 为什么选它 | ... | ... |
| Proof | 哪些结果可证明 | ... | ... |

这张表用于防止“把营销愿望当事实”。最终 Context 不必逐条暴露全部研究过程，但关键 `inferred` / `unknown` 必须可见。

---

## Phase 3 — Capture the Context

覆盖以下 12 个主题。某一主题不适用时可以删掉，不要为了模板完整硬填。

### 1. Product Overview

- 一句话描述；
- 产品实际做什么；
- Product category：客户会把它放在哪个“货架”上寻找；
- Product type：SaaS / marketplace / service / e-commerce 等；
- Business model 与已知 pricing。

### 2. Target Audience

- 目标公司/人群；
- 行业、规模、阶段等关键筛选条件；
- 决策角色；
- Primary use case；
- Jobs to be done；
- 典型使用场景。

### 3. Personas

仅在确实存在多角色购买/使用链时保留，例如：

- User；
- Champion；
- Decision Maker；
- Financial Buyer；
- Technical Influencer。

每个角色记录：关心什么、主要阻力、承诺的价值。

### 4. Problems & Pain Points

- 购买前最核心的问题；
- 现有方案为什么不够；
- 时间/金钱/机会成本；
- 有证据支持时记录情绪张力。

### 5. Competitive Landscape

区分：

- Direct：同类方案解决同一问题；
- Secondary：不同方案解决同一问题；
- Indirect：继续人工、内部自建、不做、旧流程等替代。

竞争优劣必须标注证据状态。没有证据时写“待验证”，不要替竞争对手编缺点。

### 6. Differentiation

- 真正的关键差异；
- 实现方式有什么不同；
- 对客户带来的具体收益；
- 客户为什么会因此选择。

把 feature → mechanism → benefit → proof 串起来；没有 proof 时不要冒充已验证优势。

### 7. Objections & Anti-Personas

- 高频异议；
- 当前有证据支持的回答；
- 明确哪些客户不适合。

### 8. Switching Dynamics

使用 JTBD Four Forces：

- Push：什么把用户从旧方案推走；
- Pull：什么吸引用户采用新方案；
- Habit：什么让用户继续留在旧方案；
- Anxiety：切换时担心什么。

### 9. Customer Language

只记录真实语言：

- 客户如何描述问题；
- 客户如何描述产品；
- 建议沿用的词；
- 应避免的词；
- 产品/行业术语表。

### 10. Brand Voice

- Tone；
- Style；
- 3–5 个人格形容词；
- 必要时记录“不要怎样说”。

### 11. Proof Points

- 有来源的关键指标；
- 客户/Logo；
- testimonial；
- 案例结果；
- Value Theme → Evidence。

所有 Proof Point 默认要求 `confirmed` 或 `supported`。无法证实的数字不要进入可引用证据区。

### 12. Goals

- 当前首要业务目标；
- 关键 conversion action；
- 当前指标（若有）；
- 时间范围（若有）。

---
