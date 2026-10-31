---
name: "product-new-product-discussion"
description: "用于新产品尚在构思/未上线时的正式【产品·讨论】：先广度审查整个产品骨架、功能模块、对外连接和跨模块关系，整体确认后才逐模块决策并记录 Q/D。适合“新产品先把骨架讨论完整/继续新产品讨论Issue/这轮新平台选择C”。已有产品的局部功能迭代归 product-discussion；首次仅要产品规划草案归 product-planning；技术架构/API归 development。"
visibility: workflow
phase: discussion
optional_uses: "product/product-context-discovery,github/github-issue-manager"
---

# 新产品讨论（先整体骨架，再模块细化）

## 目标与边界

专门推进**尚在构思、未上线的新产品**的一轮产品讨论。先完整覆盖产品功能、模块、职责归属、用户主路径、外部系统及跨模块依赖，经用户确认整体骨架后才细化模块规则。覆盖简单单功能新产品，但骨架可极简。不冻结 API/数据库/工程架构；已运行产品的局部改动交 `product/product-discussion`。

## 输入与前置

每次启动读取 `../../shared/references/product-policy.md`。先核对新产品身份、用户目标、已给资料和已确认的 D-xxx，再读本轮 Issue 正文与**全部有效评论**。如已有同轮记录，则继续原 Issue，不另建讨论。用户明确说“先广度”时从既有零散决定恢复全局骨架，不能重问或推翻有效选择。

## Skill Composition

- 首次任务、阶段恢复、基线缺失/变化或重要交付前必须按需加载 `product/product-context-discovery`（原生宿主同源路径 `../../internal-skills/product-context-discovery/SKILL.md`），有可访问相关源码时核查；纯概念产品尚无源码时如实注明。
- 用户明确要求 GitHub 留档时组合 `github/github-issue-manager`，在写入前读 `../../shared/references/delivery-and-handoff.md`；先核对同轮记录、目标仓库、授权和远端变更，写后核验。
- 两种组合只提供事实和留档能力，主目标始终是产品行为和全局边界讨论，不自动开展研发。

## 工作流

1. 正式讨论/决定前读 `../../shared/references/product-decision-ledger.md`；**首次新产品或骨架未确认**时再读 `../../shared/references/product-skeleton-contract.md`。
2. 建立 `skeleton_draft`，一次性覆盖全部主要功能/模块、用户路径、平台/插件/外部系统归属和跨模块关系；简单产品以轻量全貌呈现，复杂产品用完整矩阵和图。
3. 进入 `skeleton_review`，横向查漏、查边界冲突及跨部署/角色适用性；提供少量影响全局的选项与代价，保留其他模块细节为待细化。已有局部 D-xxx 只映射到骨架，不自动上升为整体确认。
4. **全局门槛**：只有用户明确认可骨架的整体范围与模块职责，才记录 `skeleton_confirmed`；未经确认不得连续深挖一个模块并冒称最终定案。
5. 骨架确认后逐模块讨论 Q-xxx 与 D-xxx，记录理由、depends_on/supersedes、来源、跨模块影响；若新增能力改变骨架，先回整体影响审查。
6. 核对业务流程、权限、失败路径、非目标与遗留未知；只评估 `ready_for_product_conclusion`，不自动生成结论或推进开发。

## 交付与完成

骨架阶段交整体能力表、边界关系、已确认/候选/未知、模块交互与 `skeleton_draft / skeleton_review / skeleton_confirmed` 状态；细化阶段交有效决定、依赖和未决。没有用户整体确认仅可称骨架草案，未授权不创建结论、不关闭 Issue、不写代码。

## 停止条件

发现全局模块缺口或跨边界冲突时停相关细化，返回骨架审查；用户只要求整体骨架时停在该阶段。已有产品局部功能迭代转 `product/product-discussion`，首次无正式讨论只需新产品规划草案转 `product/product-planning`；不把技术方案当产品已决定。
