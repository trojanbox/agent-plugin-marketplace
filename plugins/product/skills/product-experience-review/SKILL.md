---
name: "product-experience-review"
description: "用于审查现有产品界面或流程的体验问题、操作效率、一致性和可访问性，基于页面/截图/源码证据诊断并给改进方向。适合“操作很麻烦/看看这条流程哪里别扭”。创建高保真 UI/原型归 design；按冻结需求判定交付是否合格归 product-acceptance；缺陷根因归 development。"
visibility: "workflow"
phase: "verification"
optional_uses: "product/product-context-discovery,github/github-issue-manager,design/visual-artifact-design"
---

# 产品体验审查

## 目标与边界

发现有证据的体验问题，说明用户影响、场景和改进方向。与产品验收区分：审查无需先有冻结需求，不能把审美偏好宣称为需求不符合。

## 输入与前置

每次启动读取 `../../shared/references/product-policy.md`。确定当前产品、用户目标、资料可访问范围与本次主交付物，继承有效决定；不要求用户重复已提供的信息。

确定要审查的产品、页面/流程、角色、设备与可访问材料。浏览器可用时先记录实际界面和关键状态；只有截图时明确只覆盖静态状态，不虚构点击、响应或完整流程。

## Skill Composition

- 首次任务、产品切换、事实基线缺失/变化、恢复长任务或重要交付前需要复核时，必须组合 `product/product-context-discovery`；源码存在且可访问时必须核查相关实现。已核验材料只在产品/版本/范围匹配后复用。
- Runtime 通过已发现的逻辑 ID 加载内部能力；原生宿主直接读取同一实现 `../../internal-skills/product-context-discovery/SKILL.md`，不要注册成第七个公开 Skill，也不要要求宿主自动解释组合元数据。
- 用户明确要求 GitHub 留档时组合 `github/github-issue-manager`，持久化前读取 `../../shared/references/delivery-and-handoff.md`；未安装/无写权限时准确交付 Markdown 和阻塞原因，不假装写入。

- 用户明确需要辅助解释某项审查发现的视觉示意时可组合 `design/visual-artifact-design`，标为建议示意，不冒充当前界面；完整新稿/可点击原型是独立主目标，按用户指定顺序交给 Design。

## 工作流

1. 选择真实用户任务，取得当前页面/截图与相关源码基线，明确可观察范围。
2. 开始逐项体验检查时读取 `references/review-contract.md`；沿入口、动作、反馈、错误和退出检查。
3. 对范围内全部独立发现去重编号，绑定证据、具体状态、用户影响和严重程度依据。
4. 区分已观察问题、源码风险、假设与个人偏好；提出保留现有能力的最小改进方向，未确认方案留给产品讨论。
5. 检查跨流程一致性与非目标影响，交付发现和覆盖缺口，不自动改页面或触发产品验收。

## 交付与完成

默认交付 Markdown 审查报告及可定位证据。报告包括优先级依据、复现/观察条件、受影响用户任务与建议验证；无证据的主观“精致感”不单独当缺陷。

## 停止条件

没有实际界面/截图只能做源码或资料层风险审查，不能称真实体验检查完成。遇到外部系统/生产数据的写入动作先核授权；高风险操作不以体验验证为由擅自执行。
