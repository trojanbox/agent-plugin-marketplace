---
name: product-context-discovery
description: "产品主 Skill 内部复用的事实与上下文调查：新老产品、源码必查、按影响面分级、来源/版本复核、项目隔离与证据缺口；不承担独立产品调研报告主路由，不自动持久化。"
visibility: internal
phase: context
optional_uses: "research/deep-research,research/knowledge-synthesis,development/github-research-document-generator"
---

# 产品事实调查（内部）

## 目标与输入

接受主 Skill 的当前产品、任务、范围、有效决定和已有来源，返回可追溯事实基线。**首次执行、产品切换、证据缺失或关键事实变化时必须调查**；重用既有基线须重新读取权威来源并复核相关版本，不能依赖早期会话始终完整。

执行前读取 `../../shared/references/product-policy.md`；建立/复核基线时读取 `../../shared/references/context-contract.md`。主 Skill 已加载的相同内容不重复加载。

## Skill Composition

- 多来源外部证据是当前产品判断必需且宿主允许检索时，组合 `research/deep-research`；单一事实查证用现有工具即可，不启动全面研究。仅处理已给材料的任务不扩展检索。
- 多份已有资料存在重复、矛盾或版本差异时，组合 `research/knowledge-synthesis`，保持 source-bounded。
- 当前实现需跨模块追踪才能支撑产品结论时，组合 `development/github-research-document-generator` 的只读、`analysis_only` 调查，返回源码证据。用户的主目标若本来就是完整技术实现报告，直接交回该 Skill 主导。
- 依赖缺失时指出缺少的能力和受影响判断，不假装已调用、不安装额外工具、不扩大写权限。

## 工作流

1. 核对当前产品身份/范围、授权来源和新/老模式，按影响面选择最小充分调查。
2. 有可访问相关源码必须读项目规范及真实业务链；没有或不可访问时分别记录原因和结论限制。
3. 建立来源与版本账本，分开事实、用户决定、推断和假设，核对文档/源码/运行证据冲突。
4. 检查相关证据变化，按受影响范围增量补查；跨产品禁止复用事实。关键未知只阻塞其依赖分支。
5. 按 context-contract 返回事实卡、覆盖、限制与 sufficient/partial/blocked 状态。

## 完成与停止

完成代表足以支撑所声明范围的产品判断，不证明系统已实现或真实验收通过。主目标、产品归属或关键证据冲突未清楚时停止受影响结论；不自动创建 Issue、报告、知识库或改动代码。
