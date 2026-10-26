# 结论创建需明确授权：规则层语义回归（2026-10-26）

## 目标

为 `development/github-discussion-facilitator` / `development/github-spec` 和小说的 `writing/fiction-discussion` / `writing/fiction-conclusion` 加入同一条高优先级约束：**收口就绪≠用户已授权创建结论**。

## 规则边界

- 仅询问“能否收口/是否可以形成结论” → Discussion 审核并询问，保留 `ready_for_spec` 或 `ready_for_creative_conclusion`，不创建独立结论 Issue。
- Spec Gate 为 `required`，也不能推出用户同意写结论；下游只请求开发计划而缺规格时先停在 Gate 并询问。
- 用户当前明确说“创建/生成【开发·结论】”，或此前已明确预授权同一轮讨论结束后创建 → 才可进入 Spec 并按覆盖/查重/写后完整性检查执行。
- 用户拒绝或延后 → 不写结论，也不把“未授权”混同为“明确允许跳过必需 Spec”。

## 语义用例

在 `plugins/ai-workflow/skills/skill-system-design/references/semantic-routing-regression.csv` 新增 CAG001～CAG014 共 14 条样例，覆盖 negative、positive、gate、adversarial、multi-turn；旧 SKD009 的预期修改为“先 Gate，再征求授权”。典型：

| 样例 | 期望 |
| --- | --- |
| CAG001、CAG002、CAG004 | 可以审查收口条件，但不能擅自创建结论 |
| CAG005、CAG006 | 本轮有明确“现在创建”指令，可以执行 Spec |
| CAG007 | 先前清楚、尚有效的预授权可继承 |
| CAG008、CAG010 | Spec Gate 及下游计划要求不替代创建授权 |
| CAG011、CAG012 | Fiction 讨论和创作结论同样遵守显式授权 |
| CAG013、CAG014 | 继承用户最新的确认与撤回，不能从旧句推断同意 |

此文件属于**单次规则层审阅基准**：不能据此声称已在多模型上测得真实自然语言路由正确率。结构/Runtime/单元测试须另行运行并记录真实结果。
