# Domain Model Contract / 领域认知模型合同

在正式构建 Domain Map、Decision Catalogue、Claim Ledger 或判断成熟度时读取。

## 1. Domain Map

优先覆盖会改变真实决策的结构，不追求百科全书式完整：

- **Actors & Incentives**：谁参与、谁决策、谁付钱、谁受益、谁承担风险，各自为什么这样行动；
- **Value / Money / Information Flows**：价值、资金、信息和责任如何流动；
- **Core Process**：领域内最常见的业务/行为链路及关键状态转换；
- **Constraints**：法规、资源、时间、技术、组织、渠道、供需等硬约束；
- **Metrics**：结果指标、领先指标、容易误导的指标，以及口径差异；
- **Vocabulary**：理解文献和从业者沟通所需的最小术语集；
- **Failure Modes**：新人常见误判、典型失败及其成立条件；
- **Environment**：会让旧经验失效的技术、市场、政策或竞争变化。

每个模块都应回答：**它会影响哪一个 Decision？** 无法回答时降低优先级。

## 2. Decision Catalogue

领域专业能力通过反复出现的决策来组织。每条至少记录：

```text
ID
Decision
Why it matters
Typical frequency / horizon
Inputs / dependencies
Observable signals
Common failure modes
Current readiness: READY | PARTIAL | BLOCKED
Blocking knowledge gaps
```

排序优先考虑：

1. 近期是否真的要做；
2. 错一次代价是否高；
3. 是否会改变多个后续决策；
4. 当前不确定性是否高；
5. 能否用较低成本获得区分性证据。

## 3. Claim Ledger

### Claim 类型

| 类型 | 含义 |
|---|---|
| `FACT` | 当前有直接、可核验事实支撑的陈述 |
| `MODEL` | 用来解释或预测领域行为的结构化模型 |
| `HEURISTIC` | 在特定条件下常有效的经验规则 |
| `HYPOTHESIS` | 当前值得验证、但证据仍不足的判断 |
| `UNKNOWN` | 已确认重要、目前没有足够答案的问题 |
| `DEPRECATED` | 曾采用，后被新证据推翻或被更好模型替代的判断 |

### 关键 Claim 字段

```text
ID
Type
Claim
Why it matters / linked decisions
Evidence
Source quality / freshness
Conditions / scope
Counterexamples / contrary evidence
Confidence rationale
What would change this belief
Status
Last updated
Replaces / replaced by
```

信心默认使用 `High / Medium / Low` 并说明依据。没有长期校准记录时避免使用看似精确的 73%、81% 等数字。

## 4. 证据权重

优先区分：

- 一手数据、法规、官方文档、原始研究；
- 多个独立高质量来源；
- 资深从业者经验；
- 真实社区/案例信号；
- 单个成功案例、营销材料或二手转述。

经验材料很有价值，但它通常需要同时记录**成立条件和失败案例**。同一个原始事实被多次转述，不算多份独立佐证。

## 5. Maturity Model

| Level | 状态 | 最低证据 |
|---|---|---|
| `L0 Unknown` | 连领域边界和主要变量都说不清 | 无 |
| `L1 Mapped` | 知道主要参与者、流程、术语、约束和指标 | Domain Map 基本成形 |
| `L2 Explained` | 能解释主要机制、条件和常见失败 | 关键 Claims 已建立并有证据状态 |
| `L3 Decision Ready` | 能完成近期主要决策，并知道哪些证据会改变判断 | Decision Catalogue 主要项 READY/PARTIAL 且风险已显式 |
| `L4 Practiced` | 已有真实行动与反馈，可用结果修正模型 | 至少一轮真实实践闭环 |
| `L5 Calibrated` | 经历多轮成功/失败，能识别经验适用条件和边界 | 多轮独立实践与稳定更新记录 |

成熟度按当前目标评估，不代表对整个学科的永久等级。新任务跨到陌生子领域时可以局部降级。
