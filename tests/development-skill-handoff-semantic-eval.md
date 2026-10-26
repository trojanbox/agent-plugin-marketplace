# Development Skill 路由与交付边界语义审阅（2026-10-21）

> 基于当前 `plugin.json`、`SKILL.md`、Gate 和自然语言样本逐条**静态语义审阅**。这不是独立模型的在线动态路由测试，不据此宣称未来模型路由准确率。

## 范围

- 主要影响：`development/github-spec`、`development/github-development-plan-generator`。
- 邻接回归：讨论、调研、API 审计、业务测试、技术测试、纯 GitHub Issue 写入和 Bug 调查。
- 目标行为：结论自包含且通俗；开发计划只做 TDD，不包含业务验收/E2E。

| 用例 | 类型 | 自然语言请求 | 期望主路由/顺序 | 当前规则审阅 |
|---|---|---|---|---|
| SKD001 | positive | 咱们已经商量完了，给我创建一个可以直接转发给研发的开发结论 Issue。 | `development/github-spec` | 规则一致：从交付物措辞匹配唯一主 Skill，检查相邻测试流程不会抢路由 |
| SKD002 | positive | 结论要像人写的一样，自包含，全部接口签名写进去，不要贴原讨论评论链接。 | `development/github-spec` | 规则一致：从交付物措辞匹配唯一主 Skill，检查相邻测试流程不会抢路由 |
| SKD003 | multi-turn | 上下文：五个上传接口决定已确认。当前：整理成一份完全独立的【开发·结论】。 | `development/github-spec` | 规则一致：继承上轮已确认范围，再按当前交付物路由，不重启原讨论 |
| SKD004 | gate | 产品接口全定了，但尚未运行真实 E2E，先生成正式开发结论，清楚标记验证义务。 | `development/github-spec；真实系统测试未通过不自动阻塞已确认规格冻结` | 规则一致：保留前置 Spec Gate 的负责人；已确认合同不被未运行 E2E 自动阻塞 |
| SKD005 | positive | 给我基于现有结论生成只包含 TDD 的开发实施计划，别安排 E2E。 | `development/github-development-plan-generator` | 规则一致：从交付物措辞匹配唯一主 Skill，检查相邻测试流程不会抢路由 |
| SKD006 | positive | 拆分 Coding Agent Task，按 Red Green Refactor Regression，测试只做单元和接口合同。 | `development/github-development-plan-generator` | 规则一致：从交付物措辞匹配唯一主 Skill，检查相邻测试流程不会抢路由 |
| SKD007 | multi-turn | 上下文：开发结论已经审核通过。当前：就照这个拆一个 TDD 开发计划。 | `development/github-development-plan-generator` | 规则一致：继承上轮已确认范围，再按当前交付物路由，不重启原讨论 |
| SKD008 | positive | VCP 环境启动太复杂，开发计划不要业务测试和 Playwright，只给我可执行的开发 Task。 | `development/github-development-plan-generator` | 规则一致：从交付物措辞匹配唯一主 Skill，检查相邻测试流程不会抢路由 |
| SKD009 | gate | 这个跨模块功能还没结论，先判断 Spec Gate，再给我一份 TDD 实施计划。 | `development/github-development-plan-generator → Spec Gate → ready_for_spec；先问用户是否创建，未经明确同意不调用 github-spec` | 规则一致：不能因下游需要规格而擅自建结论；即使 E2E 未运行也不自动阻塞已确认合同的冻结可行性 |
| SKD010 | positive | 生成一份【开发·实施计划】Issue，包含自包含的源码改动任务和局部回归，不要环境级验收。 | `development/github-development-plan-generator` | 规则一致：从交付物措辞匹配唯一主 Skill，检查相邻测试流程不会抢路由 |
| SKD011 | negative | 我们继续讨论字体上传方案，先不生成结论。 | `development/github-discussion-facilitator` | 规则一致：相邻调研/讨论/测试/纯写入 Skill 必须保持自身主路由 |
| SKD012 | negative | 看看现有 VCP 发布模块的真实调用链和缺口，先调研。 | `development/github-research-document-generator` | 规则一致：相邻调研/讨论/测试/纯写入 Skill 必须保持自身主路由 |
| SKD013 | negative | 这个 API 的当前实现和 OpenAPI 文档是否一致？先只读核对。 | `development/api-contract-audit` | 规则一致：相邻调研/讨论/测试/纯写入 Skill 必须保持自身主路由 |
| SKD014 | negative | 我要一份独立的系统 E2E 技术测试方案，包含 Harness 和环境准备。 | `development/github-technical-test-plan-generator` | 规则一致：相邻调研/讨论/测试/纯写入 Skill 必须保持自身主路由 |
| SKD015 | negative | 另写一份从用户角度验收功能的业务测试方案，列场景和期望结果。 | `development/github-business-test-plan-generator` | 规则一致：相邻调研/讨论/测试/纯写入 Skill 必须保持自身主路由 |
| SKD016 | negative | 开发结论正文已经写好了别修改，直接发到 GitHub 新 Issue。 | `github/github-issue-manager（完整现成正文的纯写入）` | 规则一致：相邻调研/讨论/测试/纯写入 Skill 必须保持自身主路由 |
| SKD017 | adversarial | 我既要开发结论又要随后开发计划；先把完整自包含结论定下来再派工。 | `development/github-spec → development/github-development-plan-generator（按依赖顺序）` | 规则一致：两个有先后依赖的产物按结论→计划执行，不并列创建两套 Issue |
| SKD018 | negative | 帮我看一下最近的线上字体上传 Bug 是什么根因，先收集证据。 | `development/github-bug-investigation` | 规则一致：相邻调研/讨论/测试/纯写入 Skill 必须保持自身主路由 |

## 审阅结论及局限

- 这 18 个新增场景对应的主路由、邻接排除和阶段顺序在当前文字规则中均有明确依据；未发现本组样本存在互相矛盾的主 Skill 触发。
- 原有 402 条语义回归期望保留；当前共 420 条样本。已有 Python 合同测试验证了关键新触发表达、下层模板和 ID 完整性。
- 真正的模型动态调用可能偏离文本约束；此处只提供可审计的静态评估样本和预期，不能替代后续使用中的实际路由观测。
