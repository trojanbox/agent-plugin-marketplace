---
name: "product-discussion"
description: "用于已有产品的单功能/跨功能迭代讨论，核查当前实现与受影响范围、对比方案并记录编号决定。适合“这个已有功能怎么调整/继续现有产品讨论/这轮我选 A”。新产品的骨架讨论及未上市产品的后续完整产品讨论归 product-new-product-discussion；整体产品重新规划归 product-planning；技术方案归 development。"
visibility: "workflow"
phase: "discussion"
optional_uses: "product/product-context-discovery,github/github-issue-manager"
---

# 已有产品迭代讨论

## 目标与边界

处理**已存在产品**的功能、流程、权限及体验变更；先理解现有业务/源码和影响面，再形成可追溯的产品行为决定。讨论范围可跨模块，但以真实的现有产品为基线，不强制每次重建新产品骨架。新产品初始构思与同轮新产品方案决策交 `product/product-new-product-discussion`，技术合同归 Development。

## 输入与前置

每次启动读取 `../../shared/references/product-policy.md`。确定当前产品、用户目标、资料可访问范围与本次主交付物，继承有效决定；不要求用户重复已提供的信息。

先重读同轮讨论与全部有效评论、当前用户补充、事实来源。已有同轮未结束记录继续使用，不能重建重复讨论。正式留档须有当前产品的载体配置和授权。

## Skill Composition

- 首次任务、产品切换、事实基线缺失/变化、恢复长任务或重要交付前需要复核时，必须组合 `product/product-context-discovery`；源码存在且可访问时必须核查相关实现。已核验材料只在产品/版本/范围匹配后复用。
- Runtime 通过已发现的逻辑 ID 加载内部能力；原生宿主直接读取同一实现 `../../internal-skills/product-context-discovery/SKILL.md`，不要注册成第七个公开 Skill，也不要要求宿主自动解释组合元数据。
- 用户明确要求 GitHub 留档时组合 `github/github-issue-manager`，持久化前读取 `../../shared/references/delivery-and-handoff.md`；未安装/无写权限时准确交付 Markdown 和阻塞原因，不假装写入。

需要研发可行性调查时由内部事实调查按真实条件取得源码依据；产品讨论不生成另一份开发讨论或开发结论作为隐式副作用。

## 工作流

1. 正式讨论或记录决定前读取 `../../shared/references/product-decision-ledger.md`；先重读同轮讨论、有效评论与当前产品事实。
2. 围绕现有用户任务和相关源码建立**当前行为 → 期望变化 → 影响范围**，标记其它模块与外部系统的直接/间接依赖；范围不清先补事实。
3. 提供选项、代价、推荐与依据，只有**变更影响整体产品骨架**时才核对受影响的全局边界；日常局部迭代不强制重新规划整套产品。
4. 用户确认后记录 D-xxx、对应 Q-xxx、理由/边界、depends_on/supersedes；保持未确认方案为建议，不改变已确认旧需求的适用范围。
5. 复核当前流程、目标、权限、失败与边界影响及状态；仅评估是否可生成产品结论，不自动创建结论或开发任务。

## 交付与完成

交付当前有效决策、未决/阻塞、证据及跨功能影响清单与讨论状态。`ready_for_product_conclusion` 仅代表可整理正式产品结论，未经授权不创建、不关闭讨论或启动开发。

## 停止条件

会改变产品语义的未知先停相应分支；未实现且未授权的新功能不继续展开设计。用户明确跳过独立结论转开发时读取交接规则并保留原始决定与授权范围。
