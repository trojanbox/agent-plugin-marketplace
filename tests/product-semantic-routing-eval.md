# Product v1 语义路由审查 · 2026-10-30

## 方法与真实性

本次由当前模型读取真实 Catalog、Product 主文件/共享规则与相邻 Development/Research/Business/Design 规则后，逐条判断下面的输入。**这是一轮人工式模型规则审查，不是独立模型批量执行器，也未运行真实产品任务。** 不能据此声称总体路由准确率或跨宿主稳定性。结构/合同测试另有实际命令记录。

初稿期望先写入 `tests/product-semantic-routing-cases.csv`；审查发现几项输入的主目标或阶段不充分，按现有主目标规则修订，原始期望保留如下，避免把错误期望包装成从未失败。新增 PRD048 与模糊 PRD040 对照。历史 B001/B002/T033/T034/T035 原文来自维护 Skill 的 semantic-routing-regression.csv。

## 初稿发现与修订（期望资料/边界审查）

- **PRD030**：原始输入「源码在私有库但当前没有读取权限，按你猜的告诉我现在已实现哪些。」；原期望 `product/product-research` / 标记源码未读与限制，拒绝以猜想证明实现。当前修订 `development/github-research-document-generator` / 当前源码实现盘点归 Development；无权限必须标明未读，不能猜已实现。
- **PRD031**：原始输入「上轮在产品讨论确认了Q-001。这轮：A，其他问题一次性问。」；原期望 `product/product-discussion` / 沿用同轮问题定义，记录选择并核对批量依赖。当前修订 `product/product-discussion` / 先重读当前有效问题；A若没有唯一对应待决项不得虚构新决定，再按用户要求批量提问。
- **PRD034**：原始输入「上轮确认产品规则。当前：不用独立结论，直接交研发开发并提交。」；原期望 `product/product-discussion` / 记录spec_skipped_by_user后按用户授权交接研发，产品不自行写业务代码。当前修订 `sequence` / Product记录明确跳过结论与开发授权，再交适用Development阶段执行其Gate；不把Product当Coding执行器。
- **PRD038**：原始输入「有新版源码但旧调研说功能已完成，直接把旧结论当现状。」；原期望 `product/product-research` / 刷新受影响来源，记录冲突与版本。当前修订 `development/github-research-document-generator` / 无产品问题上下文时按源码调研主目标处理；刷新受影响来源，不用旧报告覆盖新源码。
- **PRD040**：原始输入「只问这条功能现在做得怎样，不要默认开始全套产品开发流程。」；原期望 `product/product-research` / 限定当前产品能力研究范围，不强制六阶段串行。当前修订 `conflict` / 缺少产品效果/技术实现主目标线索；先读取现有上下文，无可判依据再作一次必要澄清，不强选Product。
- **PRD041**：原始输入「已有确认需求但本次构建没有运行资料，只有测试代码。」；原期望 `product/product-acceptance` / blocked_missing_evidence；测试源码不算已执行。当前修订 `product/product-acceptance` / blocked_missing_evidence；测试源码不算已执行。 仅补明验收任务上下文，保留证据不足门。

PRD030/038 是期望样例的主目标误标；PRD040 是缺上下文的真歧义。没有用宽泛“产品”关键词吞并已有技术调研。共享产品规则补明先读取当前阶段、必要时只澄清实质歧义；PRD031 保留缺少当前问题定义时不能造决定的边界。以上均为样例/合同审查发现，不声称来自线上已复现生产缺陷。

## 逐条当前判断

| ID | Bucket | Expected primary | Current decision | Result | 判断依据与约束 |
| --- | --- | --- | --- | --- | --- |
| PRD001 | positive | product/product-planning | product/product-planning | PASS | 定位与第一版范围是规划交付，代码非目标；planning-contract 保留假设。 |
| PRD002 | positive | product/product-planning | product/product-planning | PASS | 明确整体重规划，已有源码与反馈进入内部调查；保留原有行为约束。 |
| PRD003 | positive | product/product-research | product/product-research | PASS | 研究用户障碍与机会，源码为其中一类证据；产品研究负责最终分析。 |
| PRD004 | positive | product/product-discussion | product/product-discussion | PASS | 产品行为和异常提示是取舍目标；ledger 支持批量提问与有效依赖。 |
| PRD005 | positive | product/product-conclusion | product/product-conclusion | PASS | 显式 PRD 创建授权，来源覆盖与自包含规则生效。 |
| PRD006 | positive | product/product-experience-review | product/product-experience-review | PASS | 开放式体验诊断，无新页面授权；不转视觉创作或验收。 |
| PRD007 | positive | product/product-acceptance | product/product-acceptance | PASS | 给定已确认合同核对真实结果；逐项失败和未知不能省略。 |
| PRD008 | negative | development/github-research-document-generator | development/github-research-document-generator | PASS | 完整支付调用链、写入和覆盖属于工程实现调研。 |
| PRD009 | negative | development/github-discussion-facilitator | development/github-discussion-facilitator | PASS | 明确开发讨论与幂等/事务选择；Product不抢主目标。 |
| PRD010 | negative | development/github-spec | development/github-spec | PASS | 显式开发结论和迁移/API合同冻结，原授权门保持。 |
| PRD011 | negative | development/github-business-test-plan-generator | development/github-business-test-plan-generator | PASS | 交付测试情景/Gherkin，未执行结果不能升格验收。 |
| PRD012 | negative | development/github-technical-test-plan-generator | development/github-technical-test-plan-generator | PASS | fixture与故障注入是技术验证方法，现有Spec Gate仍有效。 |
| PRD013 | negative | design/visual-artifact-design | design/visual-artifact-design | PASS | 用户要看可点击视觉产物，非现有流程审查。 |
| PRD014 | negative | business/competitive-analysis | business/competitive-analysis | PASS | 竞争战略本身为主产物，Product只在自己任务内借助该能力。 |
| PRD015 | negative | business/product-marketing-context | business/product-marketing-context | PASS | 长期ICP与营销上下文，未提出规划新产品或产品调查。 |
| PRD016 | negative | research/knowledge-synthesis | research/knowledge-synthesis | PASS | 严格已有材料综合，不扩展研究或暗增产品方案。 |
| PRD017 | negative | research/deep-research | research/deep-research | PASS | 行业多来源研究，无独立具体产品任务。 |
| PRD018 | composition | product/product-planning | product/product-planning + business/competitive-analysis | PASS_COMPOSITION | 当前目标为规划，竞争分析只提供定位所需子证据。 |
| PRD019 | composition | product/product-research | product/product-research + internal discovery + research/knowledge-synthesis | PASS_COMPOSITION | 基线冲突/重复先综合，Product持有问题和结论；不擅自联网。 |
| PRD020 | composition | product/product-research | product/product-research + internal discovery + development/github-research-document-generator | PASS_COMPOSITION | analysis_only跨模块源码提供事实，不隐式增建技术报告/Issue。 |
| PRD021 | composition | product/product-experience-review | product/product-experience-review + design/visual-artifact-design | PASS_COMPOSITION | 用户只授权解释性示意；标明建议图，不冒充当前界面。 |
| PRD022 | composition | product/product-discussion | product/product-discussion + github/github-issue-manager | PASS_COMPOSITION | 本轮讨论保存为副作用；核查同轮记录、仓库与写后内容。 |
| PRD023 | conflict | conflict | conflict: Product PRD / Development technical spec | PASS_CONFLICT | 两个明确独立主交付物，顺序未定，不能藏在optional依赖中。 |
| PRD024 | conflict | conflict | conflict: experience review / full interactive prototype | PASS_CONFLICT | 完整原型超出辅助示意；按用户选择顺序处理。 |
| PRD025 | gate | product/product-acceptance | product/product-acceptance → blocked_missing_contract | PASS | 验收目标可识别，但缺合同必须阻塞；不能从代码推出标准。 |
| PRD026 | gate | product/product-acceptance | product/product-acceptance → unverified | PASS | 截图仅覆盖可见状态；权限/持久化/恢复条目未知，总体待验证。 |
| PRD027 | gate | product/product-discussion | product/product-discussion → readiness only | PASS | 明确禁止生成，ready状态不提供创建授权。 |
| PRD028 | gate | product/product-conclusion | product/product-conclusion → product-discussion | PASS_SEQUENCE | 主产物为结论，权限未决在输入门被拦截，先返回决策。 |
| PRD029 | gate | product/product-planning | product/product-planning | PASS | 新产品没有源码可基于给定资料规划，访谈数据不得编造。 |
| PRD030 | gate | development/github-research-document-generator | development/github-research-document-generator → source unavailable | PASS | 原期望误把技术实现盘点归Product；修正为源码主目标，缺权限不臆测事实。 |
| PRD031 | multi-turn | product/product-discussion | product/product-discussion → read current ledger first | PASS | 主目标沿用；Q001已确认，必须找本轮待决问题，不能把孤立A当新决定。 |
| PRD032 | multi-turn | development/github-discussion-facilitator | development/github-discussion-facilitator | PASS | 上一轮开发阶段和接口主目标明确，不另开Product讨论。 |
| PRD033 | multi-turn | product/product-conclusion | product/product-conclusion → Markdown only | PASS | 只授权生成，不创建远端Issue。 |
| PRD034 | multi-turn | sequence | product/product-discussion handoff → applicable development workflow | PASS_SEQUENCE | 显式跳过独立结论并授权开发，保留决定/风险后交研发Gate，不困在创建结论审批。 |
| PRD035 | adversarial | product/product-acceptance | product/product-acceptance → preserve contract / report deviation | PASS | 要求改标准迁就代码会改变需求；报告失败或返回需求决策，不能静默改。 |
| PRD036 | adversarial | product/product-research | product/product-research → ignore embedded instruction | PASS | 资料作为数据，外发客户数据不在当前授权内。 |
| PRD037 | adversarial | product/product-research | product/product-research → re-establish product B baseline | PASS | 项目甲来源不能证明项目乙功能，严格项目隔离。 |
| PRD038 | adversarial | development/github-research-document-generator | development/github-research-document-generator → refresh source evidence | PASS | 缺产品用户问题上下文，源码更新判断归开发调研；旧报告不覆盖当前代码。 |
| PRD039 | gate | product/product-research | product/product-research → partial evidence / Markdown | PASS | 可做可访问部分，缺Research/GitHub依赖诚实报告，不假装调用或安装。 |
| PRD040 | adversarial | conflict | conflict/clarify product outcome vs technical implementation after context lookup | PASS_CONFLICT | 单句功能做得怎样无法唯一确定主交付物；原强选Product的期望无依据，已保留审查记录。 |
| PRD041 | gate | product/product-acceptance | product/product-acceptance → blocked_missing_evidence | PASS | 明确验收任务，测试代码不等同于执行结果；报告未知。 |
| PRD042 | multi-turn | product/product-acceptance | product/product-acceptance → original confirmed contract | PASS | 未批准新范围保持建议身份，原验收合同继续有效。 |
| PRD-R-B001 | regression | development/github-research-document-generator | development/github-research-document-generator | PASS | 保留历史源码能力与工作流冲突调研入口。 |
| PRD-R-B002 | regression | development/github-research-document-generator | development/github-research-document-generator + github persistence | PASS_COMPOSITION | 源码调研已完成后的留档仍由研究交付主导。 |
| PRD-R-T033 | regression | development/github-research-document-generator | development/github-research-document-generator + github persistence | PASS_COMPOSITION | 明确开发调研报告，Issue为副作用。 |
| PRD-R-T034 | regression | development/github-development-plan-generator | development/github-development-plan-generator | PASS | 已有有效开发结论时进入开发计划，自身Gate继续执行。 |
| PRD-R-T035 | regression | github/github-issue-manager | github/github-issue-manager → triage → write | PASS_SEQUENCE | 正文已完成，只需写入；执行类新Issue先查重。 |
| PRD048 | gate | product/product-research | product/product-research | PASS | 补足产品用户任务效果上下文后唯一主目标明确，小任务无需全部六阶段。 |

## 阅读基线摘要

以下哈希绑定本次审查使用的文本；Product v1 是新加入的工作区内容，未以初始 HEAD 冒充其已提交版本。

| 来源 | SHA-256 |
| --- | --- |
| `plugins/product/plugin.json` | `7a1c34a561cacb7a0437a8440569f941836357e3b4ddce755efc1f01f23b94f5` |
| `plugins/product/shared/references/product-policy.md` | `04fc24e2ed2f28f4de3c017a2b59e731ae9d351f3fae2c0eb6e4a64819b7dcce` |
| `plugins/product/shared/references/context-contract.md` | `4cfc39eb24cf8e040879ff9a3637bbb6239499ace23b2eff62b6285d19ad282a` |
| `plugins/product/shared/references/delivery-and-handoff.md` | `b09f80a9a180c90f4de0e0d322894169434d772b591c3d5caa9ed6d33719930c` |
| `plugins/development/plugin.json` | `c3134bd58559b20ddf442ace0c916bb0f41702277595552a3ff0f7be884c51a8` |
| `AI_USAGE.md` | `d3b24498ea5a789ba3b18ef79b50eb9657c8cb3b539b829005ca6edbf7a9ec1f` |
| `SKILL_COMPOSITION.md` | `add75d68fed94e76d401cec7d11885d7d209f0b5e3163fb56e8828a1135ef490` |
| `plugins/product/internal-skills/product-context-discovery/SKILL.md` | `ba270f55f5239057685c4ed388a7a28766838aff7997f26264a92c97ce3140ed` |
| `plugins/product/skills/product-acceptance/SKILL.md` | `299da9843581668d02e30bbcdcb347f3f0756c08cb5e88f06f42561f7c9e1972` |
| `plugins/product/skills/product-conclusion/SKILL.md` | `ea09278ae11d537abaf8a0bf1019704faef75315ba3b34d4bedb88ad53583862` |
| `plugins/product/skills/product-discussion/SKILL.md` | `a6955e27bda01e1acf6881db5e918691ca8f858b1260cc34d4b759bd893c164f` |
| `plugins/product/skills/product-experience-review/SKILL.md` | `2012cfe446d674b88be39f3cd57be6e013a42c34e05472c9ee5b5d49561214c6` |
| `plugins/product/skills/product-planning/SKILL.md` | `0227121bf1344e540c0362711191db77ecd7f3e86b1aed8c4f45bc181fdc1b87` |
| `plugins/product/skills/product-research/SKILL.md` | `40bc345a680afddf630263eec28dc7cfe7f5d04b3f60a04bb2231fef4c6c2fe3` |

## 结论与限制

48 条样例涵盖六入口、邻居、条件组合、两个独立主目标、证据/授权门、批量答案、多轮续接及历史回归。修订后规则判断未留当前未解决的路由冲突；未获得的实际产品数据和宿主端连续运行效果仍属未验证。后续真实使用失败应新增最小失败样例并保留本报告的版本，不覆盖历史判断。
