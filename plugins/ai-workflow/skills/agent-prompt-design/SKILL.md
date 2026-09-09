---
name: agent-prompt-design
description: "用于为 Codex、Browser/Test Agent、Research Agent 或其它可自主执行多步任务的模型设计可直接投喂的目标提示词/执行合同。适合‘给我一个 Codex 目标提示词/让另一个 Agent 按这个计划执行/把这些要求整理成自主执行 Prompt/加上持续进度汇报和验收条件’。重点定义 Goal、事实源、范围、执行顺序、工具/环境边界、进度汇报、证据、停止条件、完成标准和交付物；普通聊天提示词、单句润色或开发计划本身不使用本 Skill。"
visibility: workflow
phase: orchestration
---

# Agent Prompt Design / 自主 Agent 执行提示词设计

## 唯一目标

把一个已经足够明确的任务，转换成**另一个自主 Agent 可以直接执行、过程中可观察、结束时可审计**的目标 Prompt。

本 Skill 设计的是执行合同，不负责替上游重新做产品决策、Spec 或开发计划。

---

# 一、什么时候使用

高信号请求：

- “给我一个 Codex 目标提示词。”
- “我要把这份计划扔给 Luna Max / Codex 执行，Prompt 怎么写？”
- “把这些要求整理成 Agent 可以自己干完的提示词。”
- “这个 Prompt 加上随时汇报进度。”
- “给 Browser Agent 一份执行合同。”
- “让 Research Agent 自己搜、自己收口，但别跑偏。”

以下情况不使用：

- 用户仍在讨论需求本身 → 对应 discussion/spec/planning Skill；
- 用户要求先把代码改动拆成研发任务 → `development/github-development-plan-generator`；如果已经有明确开发/测试计划，只是要把它转换成 Coding/Test Agent 执行合同，本 Skill 可以直接承接；
- 只是把一句普通 Prompt 写顺 → writing/clear-writing；
- 用户要的是人类操作手册 → writing/practical-usage-guide。

---

# 二、输入成熟度 Gate

生成自主执行 Prompt 前确认任务至少具备：

- 明确 Goal；
- 可识别的事实源或输入材料；
- 大致 Scope / Out of Scope；
- 可判断的完成标准；
- Agent 有现实可能获得的工具/环境。

如果上游合同仍有关键未决项，不要用 Prompt 把歧义藏起来。应明确指出缺少什么，并路由回对应决策阶段。

用户已提供开发计划、测试计划、Issue、Spec 或明确任务时，直接以它们作为权威输入，不重复询问已经有答案的问题。

---

# 三、Prompt 的标准骨架

根据任务复杂度取舍，但长任务默认至少包含：

## Goal

一句话说明最终要完成什么，避免写成“研究一下 / 看看 / 尽量”。

## Authoritative Sources

明确事实优先级，例如：

1. 当前工作区源码；
2. 指定 Issue / Spec / Plan；
3. AGENTS.md / repo instructions；
4. 用户提供的日志、截图、附件；
5. 外部资料（只有任务允许时）。

冲突时写清谁覆盖谁。

## Scope

明确必须处理的模块、Task、Scenario、文件范围或目标。

## Out of Scope

明确这轮不能顺手扩张的事项。

## Must Read / Preconditions

列出开始执行前必须读取/确认的文件、Issue、AGENTS.md、环境状态或测试基线。

## Execution Rules

描述重要顺序、阶段 Gate、修改原则和禁止行为。

## Verification

明确哪些测试、检查、Fresh Run、浏览器验证、diff 审查或 evidence 才算完成。

## Progress Reporting

为长任务定义有意义的阶段汇报规则。

## Failure Classification / Stop Conditions

说明遇到业务 Bug、测试 Bug、环境问题、合同冲突、权限问题时如何分类和什么时候停止。

## Deliverables

明确最终需要提交：代码、Patch、测试结果、Issue 评论、报告、截图、OpenAPI、日志摘要等。

## Completion Criteria

用可验证条件定义“完成”，禁止用“看起来没问题”。

---

# 四、持续进度汇报规则

对于预计包含多个阶段、多个 Task/Scenario、真实测试或长时间执行的任务，默认加入**事件驱动式进度汇报**。

在以下节点主动汇报：

- 完成一个 Task / Feature / Scenario；
- 进入新的执行阶段；
- 关键测试、build、typecheck、E2E、browser run 得到结果；
- 失败原因发生变化，例如从运行时问题转成测试断言问题；
- 阻塞解除；
- 发现会改变下一步的重要事实；
- 开始最终收口。

每次汇报尽量包含：

- 当前正在做什么；
- 刚刚真实验证了什么；
- 当前问题属于业务 / 测试 / Harness / 环境 / 合同哪类；
- 下一步是什么；
- 若给百分比，说明它是基于 Task/Scenario/Acceptance 的近似值。

### 禁止

- 每执行一个 shell 命令都汇报；
- 无事实变化时重复“还在进行”；
- 汇报后默认等待用户批准才继续，除非 Prompt 明确设了人工 Gate；
- 凭感觉给极精确百分比；
- 把“准备运行”写成“已经验证”。

---

# 五、Agent 类型适配

## 5.1 Codex / Coding Agent

强调：

- 当前工作区和 AGENTS.md；
- 只改 Scope 内源码；
- 已确认合同优先；
- 测试先行/回归验证（按项目要求）；
- 不吞错、不靠刷新/延时/无依据重试当最终修复；
- 修改后检查 diff；
- 需要时生成 Patch；
- 未运行测试不能声称通过。

## 5.2 Browser / Test Agent

强调：

- Baseline / Reset；
- Scenario ID；
- 真实用户入口；
- Evidence Contract；
- Fresh Run；
- 失败分类；
- Stop Conditions；
- 不能把同一脏状态的 retry 当独立通过次数。

## 5.3 Research Agent

强调：

- 研究问题和时间窗口；
- 来源优先级；
- freshness；
- 多来源交叉验证；
- 区分事实/推断；
- 处理冲突证据；
- 引用和可追溯性；
- 达到答案充分条件后停止，不无界扩搜。

---

# 六、事实与权限边界

Prompt 只能要求 Agent 使用它真实拥有或任务明确提供的能力。

禁止写入虚构能力，例如：

- “访问生产数据库”但 Agent 没有连接；
- “读取 GitHub Issue”但环境没有权限；
- “真实运行浏览器”但环境只有源码；
- “自动通知我”但没有调度/消息能力。

存在环境不确定性时，Prompt 应要求 Agent：

1. 先验证能力/环境；
2. 能继续则继续；
3. 不能继续则记录精确 blocker 和已经完成的静态部分；
4. 不伪造结果。

---

# 七、不要把 Prompt 写成“角色扮演作文”

降低以下低价值内容：

- “你是世界顶级工程师”；
- 大量人格形容词；
- 重复强调“认真、仔细、专业”；
- 与任务无关的背景故事；
- 不能被执行/验证的抽象要求。

优先写：

- 事实源；
- 行为约束；
- 验证；
- Evidence；
- Stop Conditions；
- 完成标准。

---

# 八、Prompt 自包含性

目标 Prompt 应尽量让新 Agent 在脱离当前聊天后仍能理解任务。

必须保留：

- 关键 Issue / Plan / Spec 标识；
- 重要范围和排除项；
- 用户已经确认的决定；
- 必要路径/命令/测试目标（来源已确认时）；
- 交付物要求。

不要写：

- “按我们刚才说的做”；
- “那个问题”；
- “剩下的继续”；
- 只有当前聊天才能解析的代词。

---

# 九、完成标准设计

Completion Criteria 应可机械或人工核验，例如：

- 开发计划中所有 required Task 有对应实现和验证；
- 指定测试命令 exit code = 0；
- 指定 Scenario 完成要求的 Fresh Run；
- Patch 可应用且 diff 只包含 Scope 内修改；
- 报告包含所有要求的章节和证据链接。

避免：

- “质量足够高”；
- “全面处理”；
- “没有明显问题”；
- “尽量覆盖”。

---

# 十、默认输出

用户只要 Prompt 时，直接给一份**可复制投喂**的完整 Prompt。

复杂任务可在 Prompt 前用很短说明指出：

- 目标 Agent 类型；
- 使用了哪些上游权威材料；
- 是否包含人工 Gate。

不要额外写一篇解释 Prompt 理论的文章，除非用户明确要求。

---

# 十一、强制检查

- [ ] Goal 是单一明确任务；
- [ ] 权威事实源和优先级明确；
- [ ] Scope / Out of Scope 明确；
- [ ] 没有要求 Agent 使用不存在的能力；
- [ ] 已定义关键执行顺序和 Gate；
- [ ] 长任务已加入事件驱动进度汇报；
- [ ] 进度百分比有 Task/Scenario/Acceptance 基础；
- [ ] 已定义 Verification / Evidence；
- [ ] 已定义失败分类或 Stop Conditions（适用时）；
- [ ] Completion Criteria 可验证；
- [ ] Prompt 在离开当前聊天后仍基本自包含；
- [ ] 未把未确认计划写成已经完成事实。
