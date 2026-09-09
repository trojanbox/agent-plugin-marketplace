# Skill Composition

Skill Runtime 使用“**一个能力一个权威实现，任务按需组合**”的方式组织跨 Plugin/领域能力。

## Frontmatter 字段

Skill 可以声明：

```yaml
uses: "writing/clear-writing"
optional_uses: "research/deep-research,research/knowledge-synthesis"
```

### `uses`

必需依赖。只要执行当前 Skill，就应读取并遵守这些 Skill。

适合：当前 Skill 明确建立在另一个基础能力之上，例如实操指南建立在清晰写作能力之上。

### `optional_uses`

条件依赖候选。只有当前请求命中相应条件时才加载。

条件必须写在当前 `SKILL.md` 的 `## Skill Composition`（或同义明确章节）中，例如：

```text
- 用户主要问“为什么 / 原理 / 机制” → writing/popular-science-explainer
- 需要系统补充多来源外部证据 → research/deep-research
```

不要因为 `optional_uses` 里出现了一个 Skill 就每次都加载它。

## `visibility: internal` / 内部组合能力

当一个 Skill 没有独立的用户主任务目标，只用于被其它主 Skill 复用时，可以声明：

```yaml
visibility: internal
```

规则：

- 不出现在正常 `list <category>` 和 `catalog` 的主路由候选中；
- 仍然拥有稳定逻辑 Skill ID，并可被 `uses / optional_uses` 引用；
- Runtime 维护、诊断或显式组合加载时，允许通过 `skill <category>/<skill>` 读取；
- `internal` 不能用来隐藏两个真正的主工作流冲突；只有**没有独立用户主目标**的辅助能力才使用它。

例如 `development/github-incidental-bug-capture` 只负责其它研发主任务途中发现已确认 Bug 后的查重与留痕，因此属于内部组合能力；调研仍由 `github-research-document-generator` 主导，讨论、规划、测试等也保持各自主 Skill。

## 逻辑 Skill ID 与 Plugin Group Metadata

Composition 引用只使用稳定逻辑 ID：`<plugin>/<skill>`。本 Runtime 的 Plugin 名沿用原 Category 名，因此历史 ID 不变。

- 物理目录固定为 `plugins/<plugin>/skills/<skill>/SKILL.md`；
- Group 只存在于 `plugin.json` metadata，不进入 `uses / optional_uses`；
- 调整 Group metadata 不需要迁移 Composition 引用；
- 同一 Plugin 内不得出现同名 Skill，`doctor` 会报告重复；
- 同一 Plugin 的共享 references/scripts/assets/schemas 放入 `plugins/<plugin>/shared/`，避免复制到多个 Skill。


## 与主 Skill 冲突的边界

Skill Composition 只解决“一个主任务需要哪些辅助能力”。它不能用来掩盖主任务本身的歧义。

- 一个主 Skill + `uses / optional_uses`：按组合规则执行，无需询问用户。
- 两个或以上 Skill 都可能成为当前任务的主 Skill：按 `AI_USAGE.md` 的“主 Skill 冲突处理”询问用户，由用户选择当前主目标。
- 如果某个候选被阶段 Gate、适用范围或用户已经确认的目标排除，就不再算冲突候选。
- 不要为了避免询问，把两个主工作流包装成“组合执行”；这会造成重复 Issue、重复文档、阶段跳跃或意外副作用。

## 设计原则

1. **通用能力单一维护。** 科普解释、深度研究、知识综合、清晰写作等能力只保留一个 canonical Skill。
2. **领域 Skill 增加约束。** 金融、商业、教育、研发等 Skill 负责领域目标、安全边界、上下文和最终判断。
3. **组合不等于复制。** 如果 A 已经 `uses: B`，A 中只保留对 B 的覆盖项和新增规则，不重新抄一套 B 的完整方法。
4. **条件依赖要写触发条件。** `optional_uses` 只提供路由候选，正文必须说明什么时候需要它。
5. **避免环形必需依赖。** `A uses B` 与 `B uses A` 禁止；可选的双向关联也应谨慎，优先明确谁是主任务 Skill。
6. **主 Skill 拥有最终任务语义。** 辅助 Skill 提供方法，不抢走领域判断。例如股票研究任务里，Finance Skill 保留最终投资研究语义，Research Skill 只负责补充和核验外部证据。
7. **保持按需加载。** 不建立“万能 Skill”一次依赖十几个能力；依赖应该能解释当前输出为什么需要它。

## 何时新增 Skill，何时组合

新增 Skill 前先问：

- 它是否拥有独立的任务目标、输入/输出或安全边界？有的话可以独立成 Skill。
- 它只是“把已有能力用于另一个领域”吗？优先让领域 Skill 组合已有通用 Skill。
- 两个 Skill 是否大段重复同一工作流？保留更通用/更权威的一份，另一份改成组合与覆盖规则。


## Research Composition 示例

- `research/domain-knowledge-builder` 在用户要快速进入陌生领域、建立可用于真实决策的长期认知模型时保留主路由；领域地图、Decision Catalogue、Claim 状态、成熟度和实践更新都由它负责。
- 关键认知缺口需要系统外部证据时组合 `research/deep-research`；用户已有大量材料需要先归并时组合 `research/knowledge-synthesis`；需要近期真实从业者经验与失败模式时组合 `research/community-research`；高影响判断存在竞争机制时组合 `reasoning/scientific-reasoning`。
- 用户只要对一个有边界的问题做多来源研究报告时，仍以 `research/deep-research` 为主；只维护某个具体产品的 ICP、定位、客户和营销证据时，以 `business/product-marketing-context` 为主。

## Reasoning Composition 示例

- `reasoning/scientific-reasoning` 在解释现实世界现象时，如果缺少外部证据，可按需加载 `research/deep-research`；Research 只负责找证据，Scientific Reasoning 保留假设、机制、预测、证伪与模型更新语义。
- `reasoning/scientific-reasoning` 在存在可量化数据、需要检验某个预测时，可按需加载 `data/statistical-analysis`；统计结果用于更新假设，不把完整统计流程复制进 Reasoning。
- `business/competitive-analysis` 在需要解释竞品增长、用户迁移或市场结果背后的多个竞争机制时，可按需加载 `reasoning/scientific-reasoning`；竞争格局和 Strategic Implications 仍由 Business Skill 决定。
- `development/github-bug-investigation` 在存在多个实质性竞争根因、需要设计区分证据和证伪路径时，可按需加载 `reasoning/scientific-reasoning`；Bug 的源码证据、Issue、严重级别和修复验收仍由 Bug Skill 负责。

## Finance Composition 示例

- `finance/equity-research`、`finance/earnings-analysis`、`finance/valuation-analysis`、`finance/macro-analysis` 在需要全面多来源证据时可加载 `research/deep-research`；Finance Skill 保留最终金融判断语义。
- `finance/portfolio-analysis` 与 `finance/financial-planning` 在用户提供复杂表格或需要统计/验证时按需加载 `data/*`；Data Skill 只提供计算/验证能力。



## Development Composition 示例

- `development/github-research-document-generator`、`development/github-discussion-facilitator`、`development/api-contract-audit`、`development/github-spec`、`development/github-development-plan-generator`、技术/业务测试方案生成与测试方案审计在读取当前源码/证据时，如果**旁路发现已经被证据确认的独立生产 Bug**，条件成立后必须组合 `development/github-incidental-bug-capture`。frontmatter 使用 `optional_uses` 只是为了避免在未发现 Bug 时无条件加载，并不表示确认 Bug 后可以静默跳过。原主 Skill 保留当前调研/讨论/规划/审计目标，Bug Capture 只负责查重、留痕和返回。
- 如果用户这一轮的主要目标本来就是排查某个故障，直接以 `development/github-bug-investigation` 为主；不能用旁路捕获替代完整缺陷调查。
- `development/github-business-test-plan-generator` 与 `development/github-technical-test-plan-generator` 是两个独立主目标：前者定义“业务应该验什么”，后者定义“技术上如何稳定证明”。不能用 Composition 把二者静默合并；用户明确只要其中一种时走对应 Skill。
- 【实施计划】、【技术测试方案】、【业务测试方案】进入最终生成前都必须消费同一套 Spec Gate：高传播合同需要当前有效【结论】，低传播范围要记录 `spec_not_required` 与具体理由，仍未判断清楚时返回调研/讨论。测试路径不会因为名称里有“测试方案”就自动要求结论。
- `development/source-patch-implementation` 是唯一受控的生产代码实施快车道：只有根因/目标已确认且通过共享 `S` 级 Patch Fast Lane Gate 时使用。用户说“直接 patch”不能绕过 Gate；根因未明先调查，高影响未决策先讨论/Spec，M/L 继续走实施计划与下游 Coding Agent。
- Patch Fast Lane 可以随局部修复补必要的回归测试，但不承接测试体系设计、Harness 重构或完整真实环境测试执行；这些仍进入 Testing Skill / 下游 Test Agent。
- 多轮续接时继承上一轮阶段：`根因 confirmed + S + fast-lane eligible → 那直接 patch` 直接进入 `source-patch-implementation`；`hypothesis / M / L / decision_required → 那直接 patch` 仍停留在对应上游 Gate。
## Data Composition 示例

- `data/data-exploration` 首次理解数据时，如果用户同时要求画关键分布/缺失/异常概览，按需组合 `data/data-visualization`；探索保留 grain、profiling、质量和洞察语义。
- `data/statistical-analysis` 在显著性、效应量或置信区间是主问题且用户同时要求结果图时，组合 `data/data-visualization`。
- `data/data-validation` 审核已有分析时，若需要重跑关键检验或重画问题图，分别组合 `data/statistical-analysis` / `data/data-visualization`；最终 QA 结论仍由 Validation 决定。

## Writing Composition 示例

- “董事会/CEO 决策沟通 + 去 AI 味”以 `writing/executive-communication` 为主，组合 `writing/humanizer`；Humanizer 只处理表达模式，不改决策结构和 ask。
- “科普/原理解释 + 去 AI 味”以 `writing/popular-science-explainer` 为主，组合 `writing/humanizer`；事实模型和解释路径仍由科普 Skill 决定。
- “实操使用指南 + 去 AI 味”以 `writing/practical-usage-guide` 为主，它始终 `uses: writing/clear-writing`，并在用户明确要求时可选组合 `writing/humanizer`。
- 如果用户只给现成文本要求“humanize / 别像 ChatGPT”，没有更具体的内容/受众目标，`writing/humanizer` 自己就是主 Skill；若同时只附带一般“更清楚/更简洁”要求，可按需组合 `writing/clear-writing`。

## Design Composition 示例

- `design/visual-artifact-design` 在视觉交付需要最新外部事实时，可按需组合 `research/deep-research`；Research 负责证据，Design 保留信息架构、视觉方向与最终交付。
- 多份已有材料需要先综合再做 deck/视觉报告时，Design 可组合 `research/knowledge-synthesis`；若用户只要综合结论而不要求视觉交付，Research 保留主路由。
- Dashboard/产品 UI 内出现真实数据图时，可按需组合 `data/data-visualization`；若“图怎么画”本身是主要目标，Data 为主。
- 创建 tokens/components/UI Kit/Design System → `design/design-system-authoring`；使用已有 Design System 设计普通页面 → `design/visual-artifact-design`。
- baoyu-design 的 `built-in-skills/` 是 Design Skill 内部方法模块，不注册成 Runtime 顶层 Skill，避免与 Research/Data/Writing 重复主路由。

## GitHub Issue Gate 示例

- 用户只问“有没有重复、这个是不是复发、应该重开还是新建” → `development/github-issue-triage` 为主。
- 上游内容已经明确、用户当前只要求“创建/重开 Issue” → `development/github-issue-manager` 为主，并把 Triage 作为写前 Gate；Gate 未完成不构成两个主 Skill 冲突。
- 如果 Issue 写入只是 Bug 调查、讨论、结论、计划或测试方案等领域主任务的持久化副作用，领域 Skill 保留主路由，Manager 不把“会写 GitHub”提升成第二个主任务。
