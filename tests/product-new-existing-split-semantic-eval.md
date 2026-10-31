# 新产品讨论与已有产品迭代讨论分离：语义回归（2026-10-31）

## 根因与修复目标

- 真实失败样例：企业 AI 新产品的讨论持续按单一插件问题深入，遗漏全局骨架；同时担心对已有产品迭代造成过度规划。
- 根因：`PHASE_GATE_GAP / NEIGHBOR_CONFLICT`。`product/product-discussion` 曾同时承接新产品骨架阶段和已有产品局部迭代，输入与完成 Gate 明显不同。
- 修复：保留原稳定 ID `product/product-discussion` 处理已有产品的功能迭代，新增 `product/product-new-product-discussion` 处理构思期新产品正式讨论（`skeleton_draft → skeleton_review → skeleton_confirmed` 后进入细化）。初次新产品定位/MVP 规划仍归 `product/product-planning`。已有产品整体重新规划仍可由规划承接，但局部迭代不强制完整骨架。
- 公共逻辑：两份讨论 Skill 共用 `shared/references/product-decision-ledger.md` 的 Q/D、依赖、讨论状态与授权合同。事实调查、GitHub 持久化仍按现有条件组合；没有复制业务资料或技术实现。

## 本轮验证方法与真实性

**人工逐条**将真实用户措辞和构造的边界用例，与已读取的新旧 Skill description / phase / 工作流 / 停止条件进行对照，检查主目标、阶段 Gate、GitHub 副作用和真实双主目标冲突。**没有调用独立模型批量路由器**，不代表模型跨宿主的持续准确率；表格的 PASS 是**当前文字规则在这些样例上的人工语义一致性判断**。`doctor` 与单元测试属于结构验证，需另行实际运行。

## 新增语义回归：20 条

| 编号 | 用户意图（摘要） | 路由结果 | 状态 |
| --- | --- | --- | --- |
| PRD-SPL001 | 我要正式创建新产品的产品讨论，先把模块和对外连接全部聊清楚。 | product/product-new-product-discussion | PASS |
| PRD-SPL002 | 新做的企业 AI Agent 平台还没上线，继续之前的产品讨论，先整… | product/product-new-product-discussion | PASS |
| PRD-SPL003 | 我们正在做的新产品骨架已确认，现在逐项讨论插件的界面规则。 | product/product-new-product-discussion | PASS |
| PRD-SPL004 | 已有产品的收藏功能要改，咱们建立讨论记录逐项确认行为。 | product/product-discussion | PASS |
| PRD-SPL005 | 上线多年的服务有个权限设置流程要优化，讨论旧行为和新行为。 | product/product-discussion | PASS |
| PRD-SPL006 | 我想从零设计一个简单提醒产品，先帮我规划完整功能，再聊 MVP。 | product/product-planning | PASS |
| PRD-SPL007 | 把还在构思的新产品讨论决定写回我们已建的 GitHub 产品讨论 I… | product/product-new-product-discussion | PASS_COMPOSITION |
| PRD-SPL008 | 已有产品的这轮功能讨论确认好了，更新对应产品讨论 Issue。 | product/product-discussion | PASS_COMPOSITION |
| PRD-SPL009 | 新产品骨架还没有整体确认，先把其中一个模块的 UI 和权限定稿。 | product/product-new-product-discussion | PASS |
| PRD-SPL010 | 旧产品只改一个按钮文案，不想重新梳理整个系统。 | product/product-discussion | PASS |
| PRD-SPL011 | 上轮新产品讨论已经记了 D-012，这一轮继续讨论模块分工。 | product/product-new-product-discussion | PASS |
| PRD-SPL012 | 我们之前确认了已有产品支付流程的 Q-002，现在选 C 继续。 | product/product-discussion | PASS |
| PRD-SPL013 | 把现有产品用户反馈和当前源码做成机会调研报告。 | product/product-research | PASS |
| PRD-SPL014 | 追踪现有项目跨模块 API 和数据库的完整真实调用链。 | development/github-research-document-generator | PASS |
| PRD-SPL015 | 这是现有产品整体重新规划，要从全局重新梳理所有功能和 MVP。 | product/product-planning | PASS |
| PRD-SPL016 | 我要同时交付新产品的完整 PRD 和独立的数据库技术实施结论，先做哪… | conflict | PASS_CONFLICT |
| PRD-SPL017 | 新产品整个骨架还没确认，现在不要重复问我插件细节，先把所有模块依赖列… | product/product-new-product-discussion | PASS |
| PRD-SPL018 | 骨架未完成的新产品现在就写正式产品结论。 | product/product-conclusion | PASS_SEQUENCE |
| PRD-SPL019 | 只做现有界面操作效率和一致性的体验审查。 | product/product-experience-review | PASS |
| PRD-SPL020 | 已经建立了新产品产品讨论，现在 Q-010 选择 A，请更新决定账本。 | product/product-new-product-discussion | PASS |

## 与既有 17 条骨架回归的关系

- `PRD-SK001/002/003/006/016/017`：首次新产品规划仍在 `product-planning`，包含极简单功能骨架。
- `PRD-SK004/005/009/010/012/014`：已存在的**新产品讨论轮次**改为 `product-new-product-discussion`，不重复建 Issue，未整体确认前仍停留骨架审查。
- `PRD-SK007/008/011/013/015`：既有体验审查、Development 技术调研、正式结论输入 Gate 和冲突处理不被新 Skill 抢路由。
- `PRD004/PRD022/PRD027/PRD031` 原始措辞缺少新旧背景：新增“已有产品”上下文以使其归入保留的 `product-discussion`；其余既有样例保持原期望，历史报告不覆盖。

## 回归结论和边界

- **PASS**：新产品计划、新产品讨论、已有产品迭代、调研、体验审查的邻接职责清楚。
- **PASS_COMPOSITION**：新/已有产品讨论需要 GitHub 留档时均由对应主 Skill 持有产品语义，GitHub 只负责写入。
- **PASS_SEQUENCE**：下游产品结论面对未确认的新产品骨架应返回新产品讨论阶段。
- **PASS_CONFLICT**：独立的产品 PRD 与数据库技术结论同句时仍须明确主目标顺序。
- **遗留限制**：短句“继续”必须读本轮 Issue 上下文，不能脱离产品身份凭文字猜新旧；用户已授权的正式留档不表示可自动创建产品结论。未做实际跨宿主模型路由或完整产品开发验收。
