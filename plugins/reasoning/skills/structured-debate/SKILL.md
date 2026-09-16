---
name: structured-debate
description: "对用户提出的明确观点进行结构化攻防：站在反方逐轮攻击最高价值弱点，记录命题版本、认输条件与状态，留下经得起攻击的最终版本。适合‘站在反方和我辩一辩/不要顺着我说/逐条攻击核心论点/不能偷偷换说法/adversarial debate’。解释现象、竞争假设和预测进入 scientific-reasoning；软件方案选择与源码决策进入 development；只把定稿内容写入 GitHub 进入 github。"
visibility: workflow
phase: analysis
optional_uses: "reasoning/scientific-reasoning,research/deep-research,github/github-issue-manager"
---

# Structured Debate / 结构化辩论

## 目标与输入

以明确命题、适用范围与用户提供的论据为输入，通过逐轮攻防让观点被保留、收缩或击穿。默认在对话中交付 Claim Ledger 与最终版本，不自动创建 Issue。没有明确命题时先请用户给出观点，不凭空替用户立靶。

## 核心协议

1. **冻结命题**：攻击前逐字记录 `Original Claim`，澄清必要的定义和边界。后续任何改动都记录版本、原因和轮次；原文不可覆盖，禁止静默移动论点。
2. **拆分子命题**：为可独立成立或失败的主张分配稳定 ID（C-001 等），区分任务划分、能力冲击和人力压缩等不同命题，不混成单一输赢。
3. **Steelman**：攻击前复述对方最强、仍忠于原意的版本。新增限定必须显式标记，不能替对方加强后冒充原话。
4. **单点攻击**：每轮优先只攻击一个影响主命题最大的弱点。标注 `Definition / Logic / Evidence / Boundary / Hidden Assumption`，给出理由和必要证据，避免一次抛出多个独立问题。
5. **认输条件**：攻击者必须说明什么证据或论证会使自己撤回这次攻击；条件满足就撤回，不能不断抬高门槛。条件不可检验时承认证据边界，不作无限质疑。
6. **等待回应并更新**：不替用户编造答辩。根据实际回应逐条更新 `supported / narrowed / defeated / unresolved`；证据不足是 unresolved，不是 defeated；supported 只表示经受住当前攻击，不代表永久正确。修改后的观点需用户接受，尚未接受时记录为候选。
7. **维护 Claim Ledger**：每条保留 Original、版本历史、Attack（轮次/类型/理由/撤回条件）、Response/Evidence、Status、Current 和未决点。用户回应后明确本轮改变了什么及下一攻击点。

开始建账或需要长轮次记录、最终整理、GitHub 留档时，读取 `references/claim-ledger.md`。

## 证据与推理约束

- **Fast-moving Evidence Gate**：AI frontier capability 等快速演进领域，核对证据日期、模型/工具版本、任务设置、输入与评估条件；对当前能力的断言须查当前来源。历史能力实验不等于当前能力边界；无法校准到现在时只能描述历史结果，当前断言保持 unresolved。
- **Hidden Work / Artifact Provenance**：当论据是“AI 可以直接完成 Jira / Spec / ADR”，检查 artifact 由谁产生、原始输入是什么、是否预先包含需求澄清、方案选择与上游认知劳动。不能把高度结构化产物当原始输入，再证明上游工作不存在。
- **功能与职业分开**：认知功能仍然必要，不自动推出对应职业永久由人类承担；任务冲击也不自动证明岗位或人力缩减，传导机制需独立论证。
- 不为反对而反对；遇到有效反驳及时撤回。事实、推断、价值偏好分开记录，价值差异不能靠虚构事实裁定。

## Scope Drift Guard 与停止条件

偏离主命题时明确指出并把支线记入待讨论项。例如“AI 对研发影响 → 架构师培养 → 未来语言”需要判断是否仍能改变主命题，不自动扩题。

核心命题稳定、新攻击主要落在支线，或连续几轮未改变主命题时，建议停止并整理；用户要求停止时立即收束。最终交付各子命题的 Original → Current、状态、修改理由、仍缺证据与适用边界，不强行宣判全局胜负。进入写作是后续阶段，不自动生成另一份独立文章。

## Skill Composition

- 攻防需要竞争性假设、机制、可区分预测或证伪设计时，按需组合 `reasoning/scientific-reasoning`，不复制其完整方法；本 Skill 继续拥有命题攻防和版本账本。
- 需要系统检索外部证据时组合 `research/deep-research`；证据是否击中命题仍由本 Skill 判断。
- 用户明确要求保存到 GitHub 时，组合 `github/github-issue-manager`。正式辩论 Issue 标题必须为 `【辩论】<主题>`，不能用 `【讨论】`。同一轮续写原 Issue，保留原始命题与修订历史；只完成本地草稿不代表远端留档成功。
- 研发方案比较（如 Kafka / RabbitMQ 选型并形成研发决定）以 `development/github-discussion-facilitator` 为主；不能因为最终写 Issue，就把通用辩论归入 Development。
