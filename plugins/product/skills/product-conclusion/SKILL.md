---
name: "product-conclusion"
description: "用于用户明确要求把已确认产品决定写成独立、自包含的产品结论/PRD/产品需求定稿，覆盖用户、场景、行为、边界和验收。只问能否收口不生成结论；有高影响未决先回产品讨论。【开发·结论】及技术合同冻结归 development，实施计划和测试方案也归 development。"
visibility: "workflow"
phase: "specification"
optional_uses: "product/product-context-discovery,github/github-issue-manager"
---

# 产品结论

## 目标与边界

无损整理已确认产品规则，产出无需回看讨论也可交接的需求合同。技术协议、数据模型和工程实现归 Development，不能机械搬用开发结论全部章节。

## 输入与前置

每次启动读取 `../../shared/references/product-policy.md`。确定当前产品、用户目标、资料可访问范围与本次主交付物，继承有效决定；不要求用户重复已提供的信息。

先核对用户明确要求生成本轮产品结论；“看着没问题/能否收口”无创建授权。来源可为已确认讨论、产品文档或用户逐项确认；未决高影响规则不能定稿。

## Skill Composition

- 首次任务、产品切换、事实基线缺失/变化、恢复长任务或重要交付前需要复核时，必须组合 `product/product-context-discovery`；源码存在且可访问时必须核查相关实现。已核验材料只在产品/版本/范围匹配后复用。
- Runtime 通过已发现的逻辑 ID 加载内部能力；原生宿主直接读取同一实现 `../../internal-skills/product-context-discovery/SKILL.md`，不要注册成第七个公开 Skill，也不要要求宿主自动解释组合元数据。
- 用户明确要求 GitHub 留档时组合 `github/github-issue-manager`，持久化前读取 `../../shared/references/delivery-and-handoff.md`；未安装/无写权限时准确交付 Markdown 和阻塞原因，不假装写入。

需要进入研发交接时读取 `../../shared/references/delivery-and-handoff.md`，不得把产品结论当作自动通过研发 Spec Gate 的凭证。

## 工作流

1. 授权明确后，完整重读来源、有效决定和相关事实；发生版本变化时触发内部调查。
2. 生成前读取 `references/conclusion-contract.md`，建立来源→需求→验收覆盖和反向核对。
3. 先用通俗语言总结目标与用户体验，再完整展开已确认的范围、流程、行为、边界、错误及验收。
4. 正文自包含，不通过历史讨论链接或旧决定编号代替内容；事实来源可核对，内部追溯与正文分离。
5. 核对当前实现/待开发目标、图文/需求/验收一致性，持久化后重新读取做写后审计。

## 交付与完成

交付产品需求 R-xxx、验收 A-xxx、当前差距、明确非目标和验证边界。正式产物仅在覆盖完整、无高影响未决且真实写入/交付后称完成；不宣称开发或验收已经通过。

## 停止条件

无创建授权只回报就绪状态；有效来源冲突或关键需求未决时返回讨论。被替代决定不能混入现行目标，不能为了补齐模板自己新增方案。
