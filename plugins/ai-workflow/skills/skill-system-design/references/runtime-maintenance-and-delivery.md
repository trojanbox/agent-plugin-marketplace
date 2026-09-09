# Composition、变更根因、验证与交付

修改现有 Skill、组合/Gate、删除合并、运行验证或打包交付时读取。

# 六、Composition 设计

遵循 Runtime 的 `SKILL_COMPOSITION.md`。

原则：

- 一个通用能力只保留一个权威实现；
- `uses` 只放每次执行都必须加载的基础能力；
- `optional_uses` 只放条件依赖，并在正文写清触发条件；
- 不建立大而全的“依赖十几个 Skill”的超级 Skill；
- 不允许必需依赖环；
- 主 Skill 保留最终任务语义和决策权。

---

# 七、修改现有 Skill 时

先判定问题类型：

- `TRIGGER_GAP`：真实用户表达命不中；
- `FALSE_POSITIVE`：太容易误触发；
- `NEIGHBOR_CONFLICT`：两个主 Skill 边界不清；
- `PHASE_GATE_GAP`：阶段约束缺失；
- `WORKFLOW_GAP`：Skill 本身少关键步骤；
- `COMPOSITION_DUPLICATION`：重复实现已有通用能力；
- `COMPOSITION_GAP`：常见自然任务需要组合，但当前被误判成多个主 Skill；
- `GATE_OWNERSHIP_GAP`：下游动作与前置 Gate 的主路由所有权不唯一；
- `STALE_RULE`：保留了已经废弃的流程/术语/工具假设；
- `DELIVERY_GAP`：修改了内容但没有产生用户可用交付物。

只修对应根因，不为了“顺便优化”大范围重写其它稳定 Skill。

---

## 7.1 Semantic Routing Eval Gate（路由/组合修改时强制）

`doctor` 只能证明结构合同没有坏，不能证明自然语言路由正确。只要本轮修改涉及以下任一内容，就必须增加一轮**语义路由 Eval**：

- `description / phase / visibility`；
- `uses / optional_uses`；
- Category 路由规则；
- 主 Skill 冲突规则；
- Spec/Triage/其它阶段 Gate；
- Skill 的拆分、合并、删除或职责边界变化。

执行方法使用主 `SKILL.md` 已声明的语义路由评估方法与回归基准；只选择与本次受影响 Skill / 邻居 / Gate 相关的历史样本，不要求小改动机械跑满全集。最低要求：

1. **Regression**：复用上一轮已通过的相关用例，先确认没有回归；
2. **Positive**：用户自然表达应该稳定命中本 Skill；
3. **Negative**：近邻 Skill 的高信号表达不能被误抢；
4. **Neighbor Conflict**：真正双主目标要识别冲突，不能为了“通过率”硬合并；
5. **Composition / Gate**：一个主 Skill + 辅助能力、以及下游 Skill + 前置 Gate，要得到唯一所有权；
6. **Multi-turn**：如果修改阶段继承/Gate，补“上一轮已经完成 X，现在继续 Y”这类上下文用例。

结果使用语义状态而不是伪精确准确率：`PASS / PASS_COMPOSITION / PASS_SEQUENCE / PASS_CONFLICT / ISSUE`。单次当前模型逐条判断只能称为**语义回归证据**；没有重复独立模型运行时，不得声称“路由准确率 98%”。

如果 Eval 新发现其它稳定问题：先记录根因和失败样本；只有与当前修改强相关且证据充分时才一并修复，避免边测边大范围重写。


# 八、删除 / 合并 Skill

删除或合并前检查：

- 哪些 Category/Skill 引用了它；
- `uses / optional_uses` 是否需要更新；
- AI_USAGE / CATEGORY 路由是否还有旧名字；
- 是否存在共享 references/scripts/assets；
- 用户真实使用入口由谁接管。

合并后必须保留原来有价值的触发表达和安全边界，不能只保留名字更漂亮的那一份。

---

# 九、Runtime 修改后的验证

实际修改完成后至少：

1. 运行 Runtime 的完整性检查（如 `doctor`）；
2. 确认无 duplicate plugin / logical skill，并确认 Group metadata 与 Skill 物理深度合法；
3. 确认 composition 引用存在且无自引用/坏引用；
4. 用 `list <category>` / `catalog` 确认新增项可发现，并核对公开/internal 数量与 `phase` 路由提示；
5. 用 `skill <category>/<skill>` 确认 frontmatter 可解析；
6. 检查受影响 Plugin manifest / AI_USAGE 的路由文字已同步；
7. 涉及路由/Gate/Composition 时，运行语义路由 Eval，保留回归、冲突与新问题结果；
8. 若用户需要可安装产物，重新打包完整 Runtime 并验证压缩包可读。

未真实执行的校验不能写成“通过”。

---

# 十、打包交付

用户要求“加到我的 Skills / 改完给我”时，修改完成后默认应提供可直接使用的完整 Runtime 包，而不只报告文件已改。

交付至少说明：

- 新增/修改了哪些 Skill / Category；
- 当前 Category / Skill 数；
- `doctor` 真实结果；
- ZIP 完整性结果；
- 下载文件；
- 如有条件，提供 SHA-256。

不要只提供单个 `SKILL.md`，除非用户明确只要单文件。

---

# 十一、真实性边界

- 不凭记忆声称 Runtime 当前有多少 Skill；要用当前目录/Runtime 命令确认。
- 不声称某个触发效果已在未来对话“验证成功”，除非有真实路由测试证据。
- 不因为 Skill 写得很完整就声称业务能力已经实现。
- 不把 ChatGPT 容器能做的静态审计写成 Codex 真实运行环境已完成。
- 工具或文件操作失败必须如实说明。

---

# 十二、强制检查

- [ ] 已读取当前 Runtime 的 `AI_USAGE.md`；
- [ ] 已通过 `list / catalog` 盘点现有能力；
- [ ] 新增前已完成 Existing Skill / Gap / Conflict 判断；
- [ ] 能通过一句话清楚区分新 Skill 与最近邻 Skill；
- [ ] 已覆盖正向触发、误触发和冲突场景；
- [ ] 路由/Gate/Composition 修改已执行语义 Eval，并区分 PASS / COMPOSITION / SEQUENCE / CONFLICT / ISSUE；
- [ ] 未复制已有通用能力；
- [ ] `uses / optional_uses` 符合 Composition 规则；
- [ ] Marketplace / Plugin / Group metadata / AI_USAGE 路由与目录规则已同步；
- [ ] 实际修改后已运行 `doctor`；
- [ ] 用户需要使用产物时已打包并验证 ZIP；
- [ ] 未通过的验证没有写成“已通过”。
