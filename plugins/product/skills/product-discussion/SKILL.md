---
name: "product-discussion"
description: "用于讨论新/老产品的用户行为、场景、需求范围和体验取舍，并记录编号决定与依赖。适合“这个功能该怎么给用户用/创建产品讨论/这些选项我选 A”。技术架构/API/开发讨论归 development；产品结论创建须另有明确授权，已完成正文的纯 Issue 写入归 github。"
visibility: "workflow"
phase: "discussion"
optional_uses: "product/product-context-discovery,github/github-issue-manager"
---

# 产品讨论

## 目标与边界

把未定案的产品问题推进为可追溯决定，维护事实、目标、差距和依赖。主目标是产品行为与范围；开发技术方案及明确指定【开发·讨论】交 Development。

## 输入与前置

每次启动读取 `../../shared/references/product-policy.md`。确定当前产品、用户目标、资料可访问范围与本次主交付物，继承有效决定；不要求用户重复已提供的信息。

先重读同轮讨论与全部有效评论、当前用户补充、事实来源。已有同轮未结束记录继续使用，不能重建重复讨论。正式留档须有当前产品的载体配置和授权。

## Skill Composition

- 首次任务、产品切换、事实基线缺失/变化、恢复长任务或重要交付前需要复核时，必须组合 `product/product-context-discovery`；源码存在且可访问时必须核查相关实现。已核验材料只在产品/版本/范围匹配后复用。
- Runtime 通过已发现的逻辑 ID 加载内部能力；原生宿主直接读取同一实现 `../../internal-skills/product-context-discovery/SKILL.md`，不要注册成第七个公开 Skill，也不要要求宿主自动解释组合元数据。
- 用户明确要求 GitHub 留档时组合 `github/github-issue-manager`，持久化前读取 `../../shared/references/delivery-and-handoff.md`；未安装/无写权限时准确交付 Markdown 和阻塞原因，不假装写入。

需要研发可行性调查时由内部事实调查按真实条件取得源码依据；产品讨论不生成另一份开发讨论或开发结论作为隐式副作用。

## 工作流

1. 正式讨论/记录决定前读取 `references/decision-ledger.md`；建立或续用同轮记录，无法写入时先明确本地/会话状态。
2. 用事实表达当前能力、已确认目标和差距，建立 Q-xxx 依赖与当前可决策问题。
3. 提供具体选项、代价、推荐及来源；默认先高影响项，用户要一次性提问时集中列出并说明条件依赖。
4. 用户回答后逐条记录 D-xxx、理由/边界、depends_on/supersedes，核对批量答案是否冲突并刷新状态。
5. 关键节点处理完后复核目标、图文、非目标、异常边界与决定覆盖；只评估结论就绪，不自动生成结论。

## 交付与完成

交付当前有效决策、未决/阻塞、证据、依赖与讨论状态。`ready_for_product_conclusion` 仅代表可整理正式产品结论，未经授权不创建、不关闭讨论或启动开发。

## 停止条件

会改变产品语义的未知先停相应分支；未实现且未授权的新功能不继续展开设计。用户明确跳过独立结论转开发时读取交接规则并保留原始决定与授权范围。
