---
name: "product-planning"
description: "用于从想法规划新产品的定位、目标用户、核心场景和 MVP，或对产品做明确的整体重新规划。适合“我想做一个产品/帮我定第一版做什么”。交付可讨论的产品规划；独立现状研究归 product-research，逐项取舍归 product-discussion，竞争战略归 business，架构与开发计划归 development。"
visibility: "workflow"
phase: "planning"
optional_uses: "product/product-context-discovery,github/github-issue-manager,business/competitive-analysis"
---

# 产品规划

## 目标与边界

把产品想法变成有依据、范围清楚的定位与 MVP 规划。重点是用户问题、价值、最小闭环与验证目标；不自行冻结未确认需求，不写工程任务或技术架构。

## 输入与前置

每次启动读取 `../../shared/references/product-policy.md`。确定当前产品、用户目标、资料可访问范围与本次主交付物，继承有效决定；不要求用户重复已提供的信息。

接收产品想法、目标用户、业务目标、已有素材/原型/源码和资源限制。已有产品整体重规划同样调查现状；局部功能改进不自动升级为全面产品重构。

## Skill Composition

- 首次任务、产品切换、事实基线缺失/变化、恢复长任务或重要交付前需要复核时，必须组合 `product/product-context-discovery`；源码存在且可访问时必须核查相关实现。已核验材料只在产品/版本/范围匹配后复用。
- Runtime 通过已发现的逻辑 ID 加载内部能力；原生宿主直接读取同一实现 `../../internal-skills/product-context-discovery/SKILL.md`，不要注册成第七个公开 Skill，也不要要求宿主自动解释组合元数据。
- 用户明确要求 GitHub 留档时组合 `github/github-issue-manager`，持久化前读取 `../../shared/references/delivery-and-handoff.md`；未安装/无写权限时准确交付 Markdown 和阻塞原因，不假装写入。

- 竞争取舍确实影响当前定位/MVP 时组合 `business/competitive-analysis`，只取相关竞争判断。只要求竞争分析或营销上下文时让 Business 保持主路由。

## 工作流

1. 回显用户问题、产品阶段、已确认限制与非目标；由内部调查取得事实基线。
2. 规划定位、场景和 MVP 前读取 `references/planning-contract.md`；把现状、假设、建议分开。
3. 以用户完成任务的完整闭环列候选范围、依赖、优先级依据、延期与失败边界。
4. 对影响范围或用户行为的重要取舍提供选项和推荐依据，保留未决；用户开始逐项决策时衔接产品讨论。
5. 形成有可观察验证信号的规划，记录会使方案失效的假设；交付前重新核对来源与约束。

## 交付与完成

默认输出 Markdown 产品规划与明确未决项。完成表示规划可讨论，不能称需求已冻结、市场已验证或产品已经落地。来源不足的商业收益/用户规模保持未知。

## 停止条件

高影响定位、业务可行性或关键现有能力未验证时，只交付带边界的规划草案。新增基础设施或超出用户范围的功能先暂停对应设计；用户要技术实施时按真实授权交接 Development。
