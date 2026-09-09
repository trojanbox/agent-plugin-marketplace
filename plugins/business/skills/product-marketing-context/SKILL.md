---
name: product-marketing-context
description: "用于创建、审阅或更新可长期复用的产品营销上下文，覆盖产品、目标客户、ICP/Persona、痛点、竞争格局、差异化、异议、切换动力、客户原话、品牌语气、证据与业务目标。适合用户说‘产品上下文/营销上下文/ICP/定位/目标客户/别让我每次重复介绍产品’时使用。若只是一次性市场研究或营销执行，不使用本 Skill。"
visibility: workflow
phase: context
optional_uses: "research/deep-research,research/knowledge-synthesis"
---

# Product Marketing Context

## 目标

建立/维护长期复用的 `.agents/product-marketing.md`，让后续明确支持它的业务 Skill 复用同一组产品、客户、定位和证据事实。

## Skill Composition / 能力组合

- 缺外部事实且用户允许补研究 → `research/deep-research`；
- 已有多份材料需要归并 → `research/knowledge-synthesis`。

本 Skill 保留 Context 的字段语义、证据状态和版本控制。

## 核心规则

- Source First：事实来自用户材料、当前工作区或可验证来源；
- Fact / Inference / Unknown 分开；客户原话只保存真实原话；
- 长期 Context 需要可更新、可追溯，不能把一次性推测固化成事实；
- 用户业务工作区与 Runtime 目录分开，不把 Runtime 自身目录默认当产品项目目录。

## 工作流

1. **Resolve Target**：确认创建、审阅还是更新，并找到当前真实 Context 文件（若存在）。
2. **Evidence Inventory**：盘点用户材料/工作区/允许的外部来源。
3. **Capture**：创建或大幅更新时读取 `references/evidence-and-capture-guide.md`；结构模板见 `references/context-template.md`。
4. **Validate**：检查缺失、冲突、陈旧、推断和证据状态；只询问会实质改变 Context 的关键缺口。
5. **Save & Version**：写入前读取 `references/validation-and-versioning.md`，保留 changelog 与 Evidence Status。
6. **来源维护（条件）**：需要核对本 Skill 的来源、许可或适配差异时读取 `references/upstream.md`。
6. **Handoff**：说明哪些字段已确认、哪些仍是推断/未知，以及后续哪些 Skill 可以复用。

## 完成条件

没有把推断写成事实，没有编造客户引语/指标/竞争信息；真实写文件后再声称 Context 已更新。
