# Domain Knowledge Builder Semantic Routing Eval — 2026-09-07

本次新增 `research/domain-knowledge-builder` 后，对 20 条新增稳定语义样例做边界审阅。评估依据为 Runtime Catalog frontmatter、各邻接 Skill 正文、`SKILL_COMPOSITION.md` 与 `semantic-routing-eval.md` 的主 Skill / Composition / Conflict / Stop Boundary 规则。

| ID | 预期 | 结果 | 说明 |
|---|---|---|---|
| K001-K004 | domain-knowledge-builder | PASS | 高信号目标都是“进入陌生领域并形成决策能力”，而非单次研究 |
| K005 | deep-research | PASS | 有边界的单点多来源研究报告由 Deep Research 主导 |
| K006 | knowledge-synthesis | PASS | 只综合现有材料，没有长期领域模型目标 |
| K007 | community-research | PASS | 最近社区真实观点是主要交付物 |
| K008 | scientific-reasoning | PASS | 单一机制与竞争假设问题由 Reasoning 主导 |
| K009 | product-marketing-context | PASS | 具体产品营销 Context 的长期维护由 Business 主导 |
| K010 | Builder + Deep Research | PASS_COMPOSITION | 最终状态是领域模型，外部研究只补关键缺口 |
| K011 | Builder + Knowledge Synthesis | PASS_COMPOSITION | 已有材料先归并，再进入 Decision-driven Model |
| K012 | Builder + Community Research | PASS_COMPOSITION | 社区隐性经验作为领域 Claim 的证据来源 |
| K013 | Builder + Scientific Reasoning | PASS_COMPOSITION | Builder 保留领域状态，Reasoning 处理一个高影响机制判断 |
| K014 | Builder + Competitive Analysis | PASS_CONFLICT | 长期领域模型与完整竞品战略分析可独立验收，不静默合并 |
| K015 | Builder multi-turn | PASS | 继承上一轮 Map，继续 Decision Catalogue |
| K016 | Deep Research multi-turn | PASS | 当前交付物已切换为单点研究报告，上一轮 Builder 状态不抢路由 |
| K017 | no forced skill | PASS | 单一术语解释不升级为领域认知构建 |
| K018 | Education | PASS | K-12 课堂设计由 Education 保留主语义 |
| K019 | Builder + Product Context | PASS_CONFLICT | 两个独立长期持久化目标，需要拆开处理 |
| K020 | capability gap | PASS | Builder 在专业执行阶段停止；Catalog 没有对应执行 Skill 时明确缺口 |

结论：新增 Skill 能稳定覆盖“陌生领域 → 决策驱动认知模型 → 实践更新”这一独立目标，同时没有接管 Deep Research、Synthesis、Community、Reasoning、Product Marketing Context 与 Education 的既有主语义。该结果属于当前规则对这些样例的语义回归证据，不代表线上总体路由准确率。
