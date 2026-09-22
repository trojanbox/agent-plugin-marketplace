# 【创作·结论】来源与完整性合同

## 有效来源优先级

1. 用户当前最新明确决定；
2. 当前 Book / Owner 权威文件；
3. 当前 Manuscript / Outline 的真实内容；
4. 本轮【创作·讨论】已确认决定；
5. 明确继承且仍有效的历史结论；
6. 必要研究事实。

摘要和聊天记忆不能替代可重读来源。

## 来源状态

- `confirmed_decision`：进入结论；
- `current_fact`：可作为 Current Creative State；
- `inference`：只能标明推断，不能冻结为事实；
- `candidate`：未确认，不进入最终决定；
- `superseded`：仅保留追溯；
- `deferred`：必须保留边界；
- `non_goal`：必须保留；
- `creative_open`：必须显式保留，不能被“补完整”；
- `conflict`：停止成文并回 Discussion。

## Coverage Table

内部至少映射：来源条目 → 状态 → 是否必须进入 → 结论落点。任何高影响已确认决定、Preserve Set、creative_open、deferred 或非目标没有落点时，不得完成。

## Standalone Reader Gate

后续 Agent 只读结论应知道：

- 为什么讨论；
- Current Creative State；
- 本轮 Scope / 非目标；
- 最终创作决定与理由；
- 被否决 / superseded 方向；
- Preserve Set；
- deferred / creative_open；
- 主 Owner 与传播影响；
- 受影响章节 / Manuscript 范围；
- 后续应该调整什么以及如何验收。

## 双向审计

来源→结论：无遗漏、过度压缩、含义改变。

结论→来源：每个关键结论可追溯；没有把建议写成确认、没有新增设定、没有锁死 creative_open、没有复活 superseded。
