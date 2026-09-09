# 技术测试方案发布、下游 Goal 与强制检查

方案主体完成、准备 GitHub 留痕或交给 Test/Coding Agent 时读取。

# 十一、GitHub 发布

创建前查重开放与已关闭 Issue；同一测试目标已有有效方案时优先复用/更新。

默认标题：`【技术测试方案】<测试范围>`。

仓库存在 `test-plan` 标签时使用；不存在时不使用近似标签，也**不阻塞**方案创建，只在最终结果报告 `label_missing`。

正文建议：Spec Gate/权威来源、目标/非目标、事实源与目标合同、Risk Map、现有测试资产、Test Layer Matrix、Harness/Environment/Fixture/Reset、Resilience Profile、执行批次、Evidence/Fresh Run/Flake、Bug/Blocker Policy、完成标准、真实性边界、下游 Agent Goal。

GitHub 不可读/写时按 handoff 协议生成交接包，不得声称已创建 Issue。

# 十二、下游 Test/Coding Agent Goal

Goal 必须明确：

- 以技术测试方案 Issue、当前源码和 `AGENTS.md` 为事实源；
- 编写/迁移测试代码、搭建 Harness、运行命令属于**下游 Agent**职责；
- 按 Risk → Layer → Evidence 执行；
- 出现产品 Bug 时保留证据，不用刷新/重试掩盖；
- 不越过外部系统所有权；
- 所有未执行/失败/阻塞项如实报告。

本 Skill 只生成 Goal，不执行其中任务。

# 十三、最终回复

至少包含技术测试方案位置、Spec Gate/权威来源状态、范围、Risk 数、主要测试层、是否存在 Resilience、现有测试迁移、真实性边界和下游执行 Goal。

# 十四、强制检查

- [ ] 已读取 `AGENTS.md`（存在时）；
- [ ] 已执行 Spec Gate，并记录 `spec_source / spec_not_required / spec_skipped_by_user` 中适用项；
- [ ] 已区分目标合同与当前实现；
- [ ] 已建立 Risk Map；
- [ ] 已盘点现有测试资产；
- [ ] 每个关键风险选择最低充分层；
- [ ] Harness/Fixture/Reset 有明确边界；
- [ ] resilience 只在真实需要时启用；
- [ ] Evidence/Fresh Run 是“计划”，没有伪装成已执行；
- [ ] 没有写测试代码或声称测试通过；
- [ ] 已处理旁路 Bug；
- [ ] GitHub 写入结果真实。
