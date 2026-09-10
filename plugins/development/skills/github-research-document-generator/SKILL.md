---
name: github-research-document-generator
description: "用于对当前软件项目、模块、服务、Agent、Workflow、API 或完整调用链做系统性源码调研，建立可复用的当前实现事实基线。即使用户没有明确说“调研文档/报告”，只要请求表现为完整梳理、盘点现状、分析实现到什么程度、说明系统怎么工作、梳理现有能力与缺口，并且需要跨多个源码证据形成系统认知，也应优先列为主 Skill 候选；单点事实、独立缺陷、未定方案讨论和已经明确的开发计划/测试方案请求进入对应 Skill。默认可直接在当前对话交付完整调研结论；用户明确要求创建/生成调研文档、调研报告、【调研】Issue、把刚才的源码分析/调研留档到 GitHub，或其它 Markdown/Wiki/GitHub 留痕时，仍由本 Skill 主导并进入文档持久化模式，Issue 写入只是调研工作流的持久化步骤。"
phase: research
optional_uses: "development/github-incidental-bug-capture"
---

# 源码调研与调研文档生成器

## 目标与边界

基于**用户提供的当前源码、日志、测试、截图和说明**建立可追溯的当前实现事实基线，回答“现在怎么工作、做到什么程度、能力/缺口在哪里”。

共享研发证据、范围、决策与 GitHub 真实性规则见 `../../shared/github-core/references/collaboration-policy.md`；GitHub 不可写时见 `../../shared/github-core/references/handoff-protocol.md`。

高信号：完整梳理、跨模块调用链、实现程度、现状盘点、能力与缺口。单点 API 合同转 `api-contract-audit`；独立故障转 `github-bug-investigation`；未定方案转讨论；已经明确要计划/测试方案时进入对应下游 Skill。

## Skill Composition / 旁路缺陷捕获

调研主流程始终由本 Skill 持有。读取证据时如果确认一个**独立生产 Bug**，组合 `development/github-incidental-bug-capture` 完成查重/留痕后继续调研；疑似 mismatch、未实现需求、合同未决、文档漂移、测试/Harness 问题按真实类别记录，不自动报 Bug。

## 交付模式

- `analysis_only`（默认）：在当前对话完整交付结论，不因为“调研”两个字自动创建文件或 Issue。
- `documented_research`：用户明确要求报告、Markdown、Wiki、调查记录、【调研】Issue，或“把刚才的源码分析/调研留档到 GitHub”时启用持久化；这些表达仍由本 Skill 主导，Issue 创建/更新属于持久化步骤，不切换到 `github-issue-manager`。

## 核心流程

1. **冻结问题与范围**：列出要回答的问题、非目标和当前源码/附件基线；项目规则要求时先读 `AGENTS.md`。
2. **建立证据基线**：源码优先；历史 Issue/文档只补上下文。需要跨模块证据时读取 `references/evidence-and-research-method.md`。
3. **沿真实链路调查**：入口 → 编排/服务 → 数据/状态 → 外部依赖 → 输出/失败路径 → 测试；只追与问题有关的传播链。
4. **区分事实与推断**：每个关键事实可定位；推断显式标注，缺证据写“待验证”。引用规则按需读取 `references/citation-style.md`。
5. **组织结论**：先回答用户问题，再解释关键链路、边界和缺口。复杂长文或需要图示时读取 `references/document-structure-and-diagrams.md`。
6. **旁路问题处理**：所有发现都进入调研结论；只有满足生产 Bug 证据门时组合旁路 Bug Capture。
7. **持久化（条件）**：只有 `documented_research` 才读取 `references/research-document-template.md` 与 `references/persistence-and-audit.md`，生成/发布调研记录并做完整性审计。

## 完成条件

- 用户提出的每个调研问题都有结论或明确“当前证据不足”；
- 关键调用链、状态、边界和缺口都有可定位依据；
- 当前实现、目标需求、推断、待验证项分开；
- 未运行的测试/环境验证没有写成已验证；
- 持久化模式下，文件/Issue 的真实写入结果经过工具确认。
