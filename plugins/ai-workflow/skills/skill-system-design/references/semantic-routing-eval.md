# Semantic Routing Eval / 语义路由回归协议

本协议用于验证 Skill Runtime 的**自然语言路由、组合和阶段 Gate**。它补充 `doctor`，不替代结构检查。

## 1. 用例桶

至少覆盖：

| Bucket | 目的 |
|---|---|
| regression | 复用历史通过样本，检查修改是否造成回归 |
| positive | 自然语言正例，不依赖 Skill 内部术语 |
| negative | 最近邻 Skill 的明确表达，防止 false positive |
| adversarial | 一句话多个意图、模糊表达、用户强制交付物 |
| composition | 一个主任务 + 辅助能力，应能直接组合 |
| conflict | 两个独立主交付物，应明确识别冲突 |
| gate | 下游交付物 + 前置条件，验证 Gate 所有权 |
| multi-turn | 阶段继承、‘继续/基于刚才/现在创建’等上下文 |

小改动通常至少 12–20 条；涉及多个邻接 Skill 或 Category 时建议 30–60 条。已有基准集优先复用，不为了数量重复同义句。

## 1.1 内置回归基准

Runtime 随本 Skill 提供 `references/semantic-routing-regression.csv`，保存已经用于真实路由审计的 `prompt + expected` 基准样本。

使用原则：

- 小范围修改先按受影响 Skill、邻居、Gate 或 Category **选择相关样本**，不要求每次机械跑满全集；
- 修改涉及全局主 Skill 冲突规则、Category 边界或多处 Composition 时，再扩大到完整基准；
- 新发现的稳定语义缺陷修复后，应把最小代表性失败样本加入基准，避免同一根因复发；
- 基准文件只保存输入和期望，不保存某一轮的 `PASS/ISSUE` 结果，避免把历史判断冒充当前验证；
- 项目真实表达优先保留，即使包含具体项目名，因为它们能覆盖自然语言续接、产物指定和副作用组合等真实路由形态。

## 2. 每条记录

```yaml
id: A001
prompt: 用户真实会说的话
expected: 期望主 Skill / composition / conflict / sequence
current_decision: 按当前 Runtime 实际规则得到的决定
result: PASS | PASS_COMPOSITION | PASS_SEQUENCE | PASS_CONFLICT | ISSUE
finding: ISSUE 时填写根因 ID
```

`expected` 先依据已确认的产品/Runtime 设计写出，再判当前规则，避免看到结果后倒推标准。

## 3. 判定规则

- **PASS**：唯一主 Skill 与预期一致；
- **PASS_COMPOSITION**：一个主 Skill + `uses / optional_uses` 辅助能力，职责所有权清楚；
- **PASS_SEQUENCE**：两个阶段按 Gate/工作流顺序执行，没有并列争主；
- **PASS_CONFLICT**：确实存在两个独立主要交付物，Runtime 正确要求用户选择；
- **ISSUE**：出现误触发、漏触发、所有权歧义、错误组合或错误阶段。

不要把所有冲突都当失败。一个真正的“双主目标”被明确识别为冲突，是正确行为。

## 4. 根因归类

优先使用：

- `TRIGGER_GAP`
- `FALSE_POSITIVE`
- `NEIGHBOR_CONFLICT`
- `PHASE_GATE_GAP`
- `COMPOSITION_DUPLICATION`
- `COMPOSITION_GAP`
- `GATE_OWNERSHIP_GAP`
- `STALE_RULE`

多条失败能由同一规则解释时，合并成一个根因，不按样本数制造多个问题。

## 5. 对比方式

修改前保留失败样本；修改后至少：

1. 失败样本全部重跑；
2. 同一邻居补不同措辞；
3. 相关旧回归集重跑；
4. 再补少量跨 Category/多轮用例，检查修复是否扩大误触发。

## 6. 真实性边界

单个模型对一组 Prompt 逐条判断，能证明“当前规则在这些样本上的语义一致性”，不能自动推导总体准确率。只有真实进行多次独立运行并统计后，才报告百分比、置信度或稳定率。
