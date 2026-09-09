# 轻量/深度模式、输出结构与失败模式

选择分析深度、组织正式输出或做最终自检时读取。

# 十五、轻量模式与深度模式

不要机械输出完整报告。

## Lightweight

适合问题边界清楚、证据不多、用户主要想快速挑战一个判断：

```text
现象 / 已知事实
→ 2~3 个真正合理的解释（有必要时）
→ 当前领先解释
→ 最有区分力的验证方法
→ 什么会推翻当前判断
```

## Deep

用于复杂、重要、争议大或证据冲突的问题。可以展开：

```text
Facts
Unknowns
Definitions & Measurement
Patterns / Base Rate
Competing Hypotheses
Mechanisms
Supporting / Contradicting Evidence
Discriminating Predictions
Counterexamples
Falsification Criteria
Alternative Explanations
Confidence
Next Evidence
Model Update
```

模式由问题复杂度和用户需要决定，不按固定字数切换。

---

# 十六、推荐输出结构

复杂问题可以使用：

```markdown
## 已知事实与当前未知

## 定义、测量与基准

## 观察到的模式

## 竞争性假设

### 假设 A
- 支持证据：
- 反对证据：
- 如果成立还应看到：
- 最有区分力的预测：
- 证伪条件：

### 假设 B
...

## 当前最可能机制

## 反例与替代解释

## 下一步验证

## 当前置信度

## 什么证据会改变当前结论
```

简单问题不强制套模板。

---

# 十七、失败模式

禁止：

- 把用户的解释直接写成事实；
- 在存在多个合理解释时无比较地锁定第一个原因；
- 为满足“多假设”形式制造明显荒谬的陪跑假设；
- 把相关性直接升级成因果；
- 用一个生动机制故事代替因果证据；
- 只找支持证据，不找反例和证伪条件；
- 用什么结果都能解释的不可证伪理论；
- 在定义、样本或测量含糊时宣称发现规律；
- 忽略 base rate、reference class、对照组和样本选择；
- 用伪精确概率表达主观置信度；
- 把规律写成脱离条件的绝对命题；
- 因为“科学推理”听起来重要，就覆盖 Research、Data、Finance、Business 或 Development 的领域主任务；
- 把内部长链路推理过程当成交付物；最终只展示可审计的事实、假设、证据、预测、反例和结论更新。

---

# 十八、完成检查

- [ ] 已区分事实、主张、观察、推断与假设；
- [ ] 重要概念的定义和测量边界足够清楚；
- [ ] 已检查 base rate / reference class（适用时）；
- [ ] 存在实质解释不确定性时已建立合理竞争性假设；
- [ ] 已说明潜在机制，而不只描述相关模式；
- [ ] 已产生能够区分重要假设的预测或验证；
- [ ] 已主动寻找反例和替代解释；
- [ ] 已定义关键假设的证伪条件；
- [ ] 未把相关性写成已确认因果；
- [ ] 已说明规律的适用条件和边界；
- [ ] 置信度与证据强度匹配，没有伪精确概率；
- [ ] 已说明什么新证据会改变当前模型；
- [ ] 未复制 Research / Statistical Analysis / Data Validation / Bug Investigation 的完整工作流。
