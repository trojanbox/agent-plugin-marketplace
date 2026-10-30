# Product v1 方法来源与决定覆盖

维护资料，只有核对设计来源/变更依据时读取；不作为每次产品任务的前置。使用 Product 不要求源码仓库存在这些兄弟 Plugin 文件，也不把方法参考当具体产品事实。

## 已读取的工程方法

基线：仓库提交 `298760ba5d8255bec41a034b53b24701ed09e79c`，核对日期 2026-10-30；当时工作区含其它任务未提交修改。下表 SHA-256 绑定实际阅读的文件字节，后续文件变化不自动成为本版来源。

| 仓库内来源 | 借鉴内容 | 阅读时 SHA-256 |
| --- | --- | --- |
| `AI_USAGE.md` | 逐层发现、唯一主 Skill 与按需读取 | `d3b24498ea5a789ba3b18ef79b50eb9657c8cb3b539b829005ca6edbf7a9ec1f` |
| `PLUGIN_MODEL.md` | Public/Internal/shared 物理分层及原生宿主边界 | `c7a3251287c159d2bb2b22576f4818105df42f0aef7647a9d7c063f128eadbee` |
| `SKILL_COMPOSITION.md` | 单一权威、条件组合、两个主目标不可隐藏 | `b0f46529d5afa4fbb81ef5319acade0a3c2ca304a6e2bb177a9d82f095a0fa58` |
| `plugins/development/shared/github-core/references/collaboration-policy.md` | 证据类型、决策门、范围门与真实性 | `27ddb296fa1df9bd2deb79c9d2763eb79306592a14e8027eebb635c526cf4481` |
| `plugins/development/skills/github-discussion-facilitator/references/issue-recording.md` | 决策编号、依赖/替代、写后状态与收口审查 | `33c3fa7a84018d36506b8b6ebf442a3c04c34caa69de7926ddf7ebf183d4ae4a` |
| `plugins/development/skills/github-research-document-generator/references/evidence-and-research-method.md` | 源码基线、关键主张证据、当前实现与目标分离 | `6816ae75c164435520d2a69d64ccac48a8dc7ee5d49f5049dad10a9b016dc4da` |
| `plugins/development/skills/github-spec/references/source-and-integrity.md` | 来源覆盖、独立阅读与双向完整性审计 | `e3176bf21d6facd86ea98bb7353174ac164b1332ef003f78384e981d0d84ea20` |
| `plugins/development/skills/github-business-test-plan-generator/references/business-plan-contract.md` | 业务预期与现状分离、用户可观察证据及非目标不变量 | `a19a173b708397ac3e5cbf142caa6805100420daadb3294a85ee7b474cf4e84e` |

借鉴的是严谨的工作方法：产品目标、证据、决定、产物与责任边界。没有复制整套 API/数据迁移/TDD/E2E 工程模板，也未声称这些内部方法是经过外部研究证明的通用产品理论。

## 本轮产品决定

权威讨论：[产品 Skill 套件讨论](https://github.com/trojanbox/project-documents/issues/316)。该链接仅用于本套件设计溯源，运行时不绑定这个仓库或依赖其在线状态。讨论中 D-001～D-014 的用户决定及本轮直接开发授权为实施依据；没有另建开发结论。

| 决定 | 本版落实位置/行为 |
| --- | --- |
| D-001 跨产品通用 | 各 Skill 无项目硬编码，当前任务事实由 context-contract 提供 |
| D-002 新/老双模式 | context-contract 调查矩阵与 product-planning |
| D-003 事实与相关源码必查 | product-policy、内部调查及 context-contract |
| D-004 独立 Plugin | plugin.json、公开 skills 与内部 internal-skills |
| D-005 共享调查 | product-context-discovery、公开 Skill 条件组合/原生同源引用 |
| D-006 使用中迭代 | shared/references/iteration.md |
| D-007 影响面深度与时效 | context-contract 源码、版本、变化检查 |
| D-008 六个公开入口 | 六份独立 SKILL.md 与六份专项 references |
| D-009 自包含 Markdown/可配载体 | delivery-and-handoff、conclusion-contract |
| D-010 复用现有能力 | 明确 optional_uses 触发及跨主目标边界 |
| D-011 产品/开发/验收分工 | delivery-and-handoff、acceptance-matrix |
| D-012 反馈与回归 | iteration、路由样例、合同测试与结果记录 |
| D-013 项目隔离复用 | context-contract 的产品/版本/范围核对；无集中库 |
| D-014 借鉴开发结构且有来源 | 本表、证据账本、决策依赖与双向覆盖审计 |

## 适配与局限

产品结论只冻结产品行为；开发结论的技术专用 Gate 由 Development 自身持有。产品调研不能从代码推出用户价值；产品验收依赖真实交付证据。当前交付的是 Skill 工作合同和路由集成，不包含自动研究代理、测试执行平台或资料同步服务。

静态测试证明结构/引用与关键规则，当前模型的逐条语义审查仅证明这些样例的规则一致性。真实新/老产品任务的持续表现仍需使用反馈验证，不能据此宣称总体准确率、产品商业成功或所有环境已验收。
