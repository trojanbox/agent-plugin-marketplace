---
name: domain-knowledge-builder
description: "用于用户进入陌生领域时，围绕真实目标和即将面对的决策，建立可追溯、可表达不确定性、可通过实践持续更新的领域认知模型。适合‘我对这个领域没经验但要尽快上手/帮我建立领域地图和判断框架/快速形成能做关键决策的知识体系/长期维护我对这个领域的认知’。若只需对一个明确问题做多来源调查，使用 deep-research；只需综合现有材料，使用 knowledge-synthesis；只分析一个机制或假设，使用 reasoning/scientific-reasoning；只维护某个具体产品的营销事实上下文，使用 business/product-marketing-context。"
visibility: workflow
phase: learning
optional_uses: "research/deep-research,research/knowledge-synthesis,research/community-research,reasoning/scientific-reasoning"
---

# Domain Knowledge Builder / 陌生领域认知构建

## 唯一目标

把用户缺乏经验的陌生领域，在有限时间内构建成**可用于实际判断、证据可追溯、适用条件明确、能随实践更新**的当前认知模型，优先推进到 `Decision Ready`，不以“学完整个领域”作为完成条件。

## 什么时候使用

高信号表达：快速进入一个新领域、建立领域地图/知识体系/判断框架、我没有经验但马上要做决策、帮我知道哪些变量重要、长期维护领域认知、把学习变成可验证经验。

以下目标由邻接 Skill 主导：

- 有边界的单一主题多来源调查 → `research/deep-research`；
- 已有多份材料的去重与综合 → `research/knowledge-synthesis`；
- 最近真实社区/从业者在说什么 → `research/community-research`；
- 一个现象的机制、竞争假设与证伪 → `reasoning/scientific-reasoning`；
- 具体产品 ICP、定位、客户、证据等长期营销 Context → `business/product-marketing-context`。

## Skill Composition / 能力组合

- 关键认知缺口需要系统补充外部证据 → 组合 `research/deep-research`；
- 用户已有书籍、报告、笔记、课程或研究结果需要先归并 → 组合 `research/knowledge-synthesis`；
- 需要真实从业者近期做法、隐性经验、失败模式或社区分歧 → 组合 `research/community-research`；
- 某个高影响判断存在多个竞争解释，需要机制分析、预测或证伪 → 组合 `reasoning/scientific-reasoning`。

辅助 Skill 负责证据、综合或推理；本 Skill 始终保留领域地图、关键决策目录、认知缺口优先级、Claim 状态、成熟度和实践更新的主语义。

## Learning Intent Gate

开始前建立最小学习合同：

- `Domain`：要进入的领域；
- `Real Goal`：进入后真正要完成什么；
- `First Decisions`：近期必须亲自做出的 3–10 个决策；
- `Existing Experience`：可迁移经验与明显盲区；
- `Time Horizon`：何时需要达到可用判断力；
- `Non-goals`：当前明确不学或不解决的范围。

信息足够时直接推进；缺口只要不改变范围和关键决策，就标为假设或 Unknown，不用为完整性反复追问。

## 核心闭环

1. **Map**：先画领域结构，识别参与者/激励、价值/钱/信息流、关键流程、约束、指标、核心术语和常见失败。正式建模时读取 `references/domain-model-contract.md`。
2. **Decision Catalogue**：列出专业人士在该领域反复面对的关键决策，按影响、紧迫性、前置知识和可验证性排序。
3. **Gap Priority**：围绕“哪些决策现在做不了”确定学习顺序；避免按教材目录平均学习。
4. **Acquire Evidence**：只为高优先级缺口调用合适的 Research/Reasoning 组合，主动寻找成功条件、失败案例、反例和版本差异。
5. **Build Claims**：把认知记录为 `FACT / MODEL / HEURISTIC / HYPOTHESIS / UNKNOWN / DEPRECATED`，关键主张绑定证据、条件、反例和信心来源。
6. **Decision Readiness**：检查用户是否已经能解释关键变量、做主要决策，并知道什么证据会改变判断。
7. **Practice**：有真实行动机会时，把高价值 Hypothesis 转成低成本、可区分结果的实践实验。实验与持久化规则见 `references/practice-and-persistence.md`。
8. **Update**：根据结果更新 Claim；旧判断被推翻时保留替代关系，不静默覆盖历史。
9. **Exit / Iterate**：达到当前目标所需成熟度后停止扩张；新的真实决策或反馈出现时再进入下一轮。

## 默认交付物

至少包含：

- 当前领域范围与真实目标；
- Domain Map 与高杠杆变量；
- Decision Catalogue 及当前 readiness；
- 关键 Claims、证据状态、成立条件与主要反例；
- 明确 Unknowns 与下一批优先缺口；
- 下一步最小研究/实践动作；
- 当前成熟度 `L0–L5` 与达到下一层缺什么。

用户明确要求长期复用时，在用户目标工作区维护 `.agents/domains/<domain-slug>.md`；不能把 Runtime 自身目录默认当业务工作区。持久化模板按需读取 `references/practice-and-persistence.md`。

## 停止边界

- 与当前真实决策无关的知识不为了“体系完整”继续扩展；
- 证据不足时保留 Hypothesis/Unknown，不把专家观点或单一案例升级成规律；
- 学习状态不替代真实领域执行能力。用户转为具体专业执行任务时，交给 Catalog 中已有对应主 Skill；没有匹配能力时明确当前 Runtime 的能力缺口，不由本 Skill继续扩写专业执行流程；
- 一次研究边际收益已经很低、不会改变 Decision Catalogue 或关键 Claim 时停止继续搜索；
- 没有真实实践结果时，不声称用户已经获得“经验”或达到 `Practiced/Calibrated`。

## 完成条件

当前目标达到 `Decision Ready`：用户能够说清重要决策、关键变量、主要条件和未知项；关键判断可追溯到证据或明确标为假设；下一步验证动作清楚；后续新证据能够进入同一模型继续更新。
