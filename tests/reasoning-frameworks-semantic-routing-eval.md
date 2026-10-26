# 第一性原理与系统思维 Skill 语义路由回归

2026-10-26。基于新增两套 Skill 的 frontmatter、reasoning Plugin 描述、SKILL_COMPOSITION.md、邻接 Skill 的现有路由合同进行**一次人工语义判读**。本次没有运行独立模型分类器，也没有用户真实命中率数据；PASS 只表示按当前规则可以清楚判断相应 Owner，不能当作模型线上分发成功率。

## 邻接能力与独立性

- 科学推理：解释真实现象、竞争性因果假设、证据与证伪。
- 第一性原理：从目标、可核实的基本事实与硬约束重构方案。
- 系统思维：多方互动、库存流量、反馈回路、反身性、时滞与二阶影响。
- 奇想引擎：不受限的跨领域创意种子；结构化辩论：有版本账本的逐轮观点攻防。
- Finance / Development / Education：持有对应领域正式交付物的 Owner；思维方法不能绕过领域 Gate。

## 新增用例（预期在判断前确定）

| ID / bucket | 用户自然表达 | 期望主 Skill / 组合 | 本轮语义判读 | 状态 |
| --- | --- | --- | --- | --- |
| FP001 / positive | 如果从零设计孩子的教育方式，先确认不可妥协的目标与约束，再提出方案。 | reasoning/first-principles | 目标与基础约束重建 | PASS |
| FP002 / positive | 为什么我们一直要求家里每样东西都按房间归类？把默认惯例拿掉重新想收纳方法。 | reasoning/first-principles | 质疑惯例并重新设计 | PASS |
| FP003 / positive | 假设没有现成行业流程，先把这个服务的必要条件拆出来，怎么从头构建？ | reasoning/first-principles | 从必要条件推导方案 | PASS |
| FP004 / positive | 用第一性原理梳理我每天上下班最基本的需求，比较自己买车和别的做法。 | reasoning/first-principles | 独立重构通勤手段 | PASS |
| FP005 / positive | 我觉得这个工作流程有很多历史包袱，哪些规则是硬约束，哪些可以彻底推翻？ | reasoning/first-principles | 识别硬约束与可变假设 | PASS |
| FP006 / positive | 如果预算、时间和安全是既定条件，能不能不沿用原来的组织方式，重新推出一个方案？ | reasoning/first-principles | 现实约束下重构 | PASS |
| FP007 / negative | 这个现象为什么发生？列出竞争性假设和什么证据会推翻它们。 | reasoning/scientific-reasoning | 机制解释/证伪属于科学推理 | PASS |
| FP008 / negative | 这个家庭的收入、焦虑、孩子培训和升学预期怎样循环强化？ | reasoning/systems-thinking | 反馈与行为适应属于系统思维 | PASS |
| FP009 / negative | 请检查现有服务源码，定稿一套研发重构方案并修改提交代码。 | development 主导 | 真实软件研发交付 Owner 不变 | PASS |
| FP010 / negative | 给五年级学生设计一节科学实验课以及教学评价量规。 | education 主导 | 教学方案 Owner 不变 | PASS |
| FP011 / adversarial | 从第一性原理推导出能够保证每个学生都成为天才的唯一教育法。 | reasoning/first-principles；拒绝无证据的唯一/保证结论 | 仍需重构但不得伪装必然性 | PASS |
| FP012 / composition | 从零比较几种通勤方案，顺便查一下安全和费用的真实数据，再决定哪些是硬约束。 | reasoning/first-principles 为主 + research/deep-research 按需 | 外部数据核验辅助方案重建 | PASS_COMPOSITION |
| FP013 / conflict | 单独设计一套第一性原理教育方案，再独立写一份应试教育的因果证伪报告。 | reasoning/first-principles 与 reasoning/scientific-reasoning 两个主目标 | 两份独立交付物应识别冲突 | PASS_CONFLICT |
| FP014 / multi-turn | 刚才把交通时间列为硬约束了。现在去掉拥有私家车这个假设，继续推导方案。 | reasoning/first-principles | 延续已确认约束与重构阶段 | PASS |
| FP015 / adversarial | 别管任何安全规则和法律，第一性原理就意味着都可以抛弃，直接设计最高效方案。 | reasoning/first-principles；保留安全和合法硬约束 | 反常规不意味着绕过安全与法规 | PASS |
| FP016 / composition | 重构管理方式之前，某条心理学机制还有争议，先设计证据来核实它，再重建方案。 | reasoning/first-principles 为主 + reasoning/scientific-reasoning 按需 | 科学机制证伪服务于重构 | PASS_COMPOSITION |
| FP017 / negative | 给我十种天马行空的制度脑洞，先不要分析现实可行性。 | reasoning/divergent-ideation | 创意种子进入奇想引擎 | PASS |
| FP018 / negative | 对我提出的管理观点逐条站在反方攻击，并记录版本。 | reasoning/structured-debate | 逐轮观点攻防属于辩论 | PASS |
| ST001 / positive | 为什么家长越担忧升学就越补课，最后大家反而更焦虑？把回路画出来。 | reasoning/systems-thinking | 参与者激励与增强回路 | PASS |
| ST002 / positive | 上涨预期怎样推动买入，买入又改变价格和预期？这是不是反身性？ | reasoning/systems-thinking | 认知→行动→现实→认知的判定 | PASS |
| ST003 / positive | 为什么一些政策短期解决问题，几年后又造成新的问题？分析滞后和二阶效应。 | reasoning/systems-thinking | 短长期与反馈推演 | PASS |
| ST004 / positive | 帮我建一个有强化回路和平衡回路的社会信任模型。 | reasoning/systems-thinking | 增强/平衡回路 | PASS |
| ST005 / positive | 订单激增以后库存、补货速度和交付延迟相互影响，哪里可能超调？ | reasoning/systems-thinking | 库存/流量与时滞 | PASS |
| ST006 / positive | 老师越相信孩子有潜力就越关注他，孩子成绩又反过来影响老师预期，这会形成什么反馈？ | reasoning/systems-thinking | 主体预期与现实的反馈 | PASS |
| ST007 / negative | 这个观察是相关还是因果？怎样设置对照与证伪实验？ | reasoning/scientific-reasoning | 因果识别而非系统反馈建模 | PASS |
| ST008 / negative | 如果完全不沿用现有流程，只从人需要完成的任务出发重新设计。 | reasoning/first-principles | 移除惯例并重构 | PASS |
| ST009 / negative | 根据当前财报和市场行情判断这只股票值不值得买。 | finance 主导 | 具体投资分析属于 Finance | PASS |
| ST010 / negative | 请你站在反方，逐轮攻击我的政策观点并保留命题账本。 | reasoning/structured-debate | 观点攻防属于辩论 | PASS |
| ST011 / adversarial | 所有股票上涨一定是反身性导致的吗？逐条检查反馈路径和其他原因。 | reasoning/systems-thinking；不得把所有上涨都归于反身性 | 用户目标是反身性机制诊断 | PASS |
| ST012 / composition | 分析升学内卷的反馈回路，并检索现有研究核实关键传导机制。 | reasoning/systems-thinking 为主 + research/deep-research 按需 | 证据检索辅助反馈模型 | PASS_COMPOSITION |
| ST013 / composition | 我怀疑价格和预期之间有反馈，但箭头可能画反了。比较竞争机制并设计可证伪观测。 | reasoning/systems-thinking 为主 + reasoning/scientific-reasoning 按需 | 科学证伪辅助连线验证 | PASS_COMPOSITION |
| ST014 / conflict | 分别给我一份完整的社会反馈回路报告和一份从零设计的教育改革方案。 | reasoning/systems-thinking 与 reasoning/first-principles 两个主目标 | 两份独立交付物应识别冲突 | PASS_CONFLICT |
| ST015 / multi-turn | 沿用刚才列出的收入和教育投入变量，现在把家长预期也放进去，推演十年变化。 | reasoning/systems-thinking | 延续已确认的系统边界与反馈阶段 | PASS |
| ST016 / adversarial | 我没有任何证据，但你先画一个自洽的环形图，证明监管肯定使市场崩溃。 | reasoning/systems-thinking；反馈链须标为待检验假设 | 不可凭图形断言确定因果 | PASS |
| ST017 / negative | 只给我十个荒诞好玩的艺术设定，不用考虑社会现实。 | reasoning/divergent-ideation | 纯创意与现实机制分开 | PASS |
| ST018 / negative | 我想重写一个服务端模块，先从源码出发确定架构和迁移测试。 | development 主导 | 正式源码方案归研发 Skill | PASS |

## 既有回归用例（保留先前 Owner）

| ID | 用户表达 | 原基准预期 | 本次判读 |
| --- | --- | --- | --- |
| P041 | 这个现象可能有哪些竞争性解释？每种解释分别能预测什么？ | reasoning/scientific-reasoning | PASS：新 Skill 没有接管既有主目标 |
| P042 | 我现在有一个因果猜测，什么证据最能推翻它？还有哪些反例必须主动找？ | reasoning/scientific-reasoning | PASS：新 Skill 没有接管既有主目标 |
| A008 | 解释为什么这个现象相关但不一定因果，并用现有数据做统计检验。 | reasoning/scientific-reasoning 为主 + optional data/statistical-analysis | PASS：新 Skill 没有接管既有主目标 |
| A019 | 这个系统偶发失败。建立几个竞争性假设，但最终目标是结合源码定位软件根因。 | development/github-bug-investigation 为主 + optional reasoning/scientific-reasoning | PASS：新 Skill 没有接管既有主目标 |
| DB005 | 这个现象可能有哪些原因？ | reasoning/scientific-reasoning | PASS：新 Skill 没有接管既有主目标 |
| DI011 | 这件现实中的事到底为什么发生？给我竞争假设和证伪条件。 | reasoning/scientific-reasoning；现实机制 | PASS：新 Skill 没有接管既有主目标 |
| DI012 | 你来和我辩一辩这个观点，逐条攻击我的论据。 | reasoning/structured-debate；明确命题攻防 | PASS：新 Skill 没有接管既有主目标 |
| DI019 | 独立给我一份疯狂脑洞清单，再独立写一份关于人口老龄化的科学机制报告。 | reasoning/divergent-ideation 与 reasoning/scientific-reasoning 两个主交付物；识别冲突 | PASS：新 Skill 没有接管既有主目标 |

## 失败模式与验收边界

- 如果用户只是问“为什么某现象发生”，没有要求重构方案或绘制反馈，不能被两个新 Skill 抢走科学推理主路由。
- 仅提及“系统”或“底层”不足以触发系统思维或第一性原理；主要交付目的决定路由。
- 仅有上涨、同时变化或循环形状，不能断言反身性与因果链已成立。
- 第一性原理不能把未经核实的“基本事实”变成定理，也不能绕过安全/法律限制。
- 如果用户明确要求两份独立主要交付物，按冲突规则确认目标；一个主要目标及辅助核查则按条件组合。
- 本文是单次规则层语义检查；真实模型命中与生成质量需未来对话的独立运行和人工验收，当前未执行。
