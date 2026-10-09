# Fiction Prose Editing · 语义路由评估（2026-10-09）

## 范围

新增 writing/fiction-prose-editing，编辑已有小说的中文语言质地；完整正式章节由 fiction-manuscript-drafting 成稿后按条件组合。表达审查仍是 verification，只有用户同时要求修语言才交给 editing。

## 评估协议

按照 ai-workflow/skill-system-design 的 semantic-routing-eval 规则，以现有 FIC / P053 相关回归样本及新增 PROSE001～020 作一次**规则层人工语义判读**。这里只证明规则在所列案例中前后一致，尚未重复独立运行语言模型路由，不报告准确率。Git / Runtime 结构验证需另行实际执行。

| Bucket | 样本 | 判断 |
| --- | --- | --- |
| positive | PROSE001～004 | PASS：纯文笔语言质感直接归 prose-editing |
| regression | FIC041～045、FIC047～051、FIC073、FIC079、FIC090 | PASS：仅审查 Work Voice 或理解问题不被编辑流程误抢 |
| regression | FIC046、FIC052、P053 | PASS：无文学语言目标的一般 humanizer / clear-writing 仍保留旧路由 |
| negative | PROSE005～010、PROSE019～020 | PASS：诊断、一般文档、故事规划、单次错字不触发额外语言精修 |
| composition | PROSE011～012 | PASS_COMPOSITION：Drafting 主导；正式章完成以后必须进入一次受控 prose pass |
| skip gate | PROSE013 | PASS：明确只要原始草稿时不强制调用可选依赖 |
| composition | PROSE014 | PASS_SEQUENCE：Expression Review 先诊断，用户明确要求修语言时再组合 |
| verification | PROSE015 | PASS：A/B 验收仍归 Revision Validation |
| conflict | PROSE016 | PASS_CONFLICT：两个独立主交付物需澄清优先级 |
| multi-turn | PROSE017～018 | PASS / PASS_SEQUENCE：根据当前阶段继承后置精修任务 |

## 真实性

这里的 PASS 是同一评估者依据已写明的路由约束做出的**语义一致性检查**，不是多模型测出的触发成功率，也没有证明任何模型的文学能力提升。实际表现仍须以真实作品的 A/B、独立审稿结果为准。
