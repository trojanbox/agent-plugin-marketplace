---
name: "product-research"
description: "用于围绕一个新/老产品的用户问题、需求、现状能力与机会形成独立产品调研。适合“用户卡在哪里/现有功能是否解决了需求/梳理产品机会”。有相关源码必须核查；完整技术调用链归 development，纯外部资料检索归 research，纯竞争战略归 business，已有产品未定方案归 product-discussion，新产品尚在构思的正式讨论归 product-new-product-discussion。"
visibility: "workflow"
phase: "research"
optional_uses: "product/product-context-discovery,github/github-issue-manager,business/competitive-analysis"
---

# 产品调研

## 目标与边界

用事实解释产品问题、能力缺口和机会，形成独立调研结论。调查可包含源码和用户资料，最终回答产品问题；不把分析建议写成已确认需求。

## 输入与前置

每次启动读取 `../../shared/references/product-policy.md`。确定当前产品、用户目标、资料可访问范围与本次主交付物，继承有效决定；不要求用户重复已提供的信息。

接收待回答的问题、产品与版本、可用源码/文档、反馈、数据、截图及日志。只问某接口/字段的事实时按 Development 单点审计处理，不膨胀成完整产品报告。

## Skill Composition

- 首次任务、产品切换、事实基线缺失/变化、恢复长任务或重要交付前需要复核时，必须组合 `product/product-context-discovery`；源码存在且可访问时必须核查相关实现。已核验材料只在产品/版本/范围匹配后复用。
- Runtime 通过已发现的逻辑 ID 加载内部能力；原生宿主直接读取同一实现 `../../internal-skills/product-context-discovery/SKILL.md`，不要注册成第七个公开 Skill，也不要要求宿主自动解释组合元数据。
- 用户明确要求 GitHub 留档时组合 `github/github-issue-manager`，持久化前读取 `../../shared/references/delivery-and-handoff.md`；未安装/无写权限时准确交付 Markdown 和阻塞原因，不假装写入。

- 竞争格局是本次产品问题的必要维度时组合 `business/competitive-analysis`。只搜公开资料、综合已有文本或专门竞争研究时由对应专业 Skill 主导。

## 工作流

1. 定义研究问题、用户群/场景、范围、时间与非目标，加载或核验事实基线。
2. 正式调研时读取 `references/research-contract.md`，沿用户任务链整理反馈、使用障碍和现有能力。
3. 建立问题—证据—现状—缺口映射，保留矛盾、样本偏差和不能推出的结论。
4. 提出有证据的机会与风险，建议和已确认需求分开；需要决策则列入讨论，不代替用户选择。
5. 检查每个原始问题均有答案或明确未知，报告覆盖与未覆盖范围。

## 交付与完成

默认对话内 Markdown；用户要报告/留档才按其授权生成载体。关键事实和表格逐项有来源，能力分为已实现、部分实现、未验证或缺失；未运行测试不能当运行证据。

## 停止条件

缺少必要资料时交付证据能支持的部分与验证缺口。仅凭源码不能判断真实用户满意度；仅凭访谈不能断言实现。发现独立 Bug 时记录证据与类别，按授权转研发调查，不自动修复。
