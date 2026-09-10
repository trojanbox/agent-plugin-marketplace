# Research Document Routing Semantic Eval — 2026-09-10

本轮针对真实漏路由“上一轮已经完成源码调研，当前要求创建调研文档到 Issue”做最小修复。根因归类为 `TRIGGER_GAP`：`development` 顶层 Plugin description 对“调研文档 / 【调研】Issue / 调研留档”的第一层召回不够显式；`github-research-document-generator` 已有 `documented_research`，本轮进一步收紧它与 `github-issue-manager` 的持久化边界。

| ID | Bucket | Prompt / Context | Expected | Current decision | Result |
|---|---|---|---|---|---|
| RDR-01 | positive | 完整调研一下 VCP 的 OIDC 实现，然后创建一个【调研】Issue。 | `development/github-research-document-generator` | 源码系统调研是主任务，Issue 是 `documented_research` 持久化。 | PASS |
| RDR-02 | positive | 把刚才的源码分析整理成调研文档并记录到 Issue。 | `development/github-research-document-generator` | “调研文档 + Issue”由调研 Skill 持有。 | PASS |
| RDR-03 | multi-turn | 上下文：上一轮已经完成 VCP OIDC 源码调研。当前：创建一份调研文档到 Issue 吧。 | `development/github-research-document-generator` | 当前仍要求生成调研文档并持久化，进入 `documented_research`。 | PASS |
| RDR-04 | regression | 创建一份调研记录，把刚才的源码分析留档。 | `development/github-research-document-generator` | 与基准 B002 一致。 | PASS |
| RDR-05 | regression | 完整调研发布链路，并把调研结果记录成【调研】Issue。 | `development/github-research-document-generator` | 与基准 T033 一致。 | PASS |
| RDR-06 | negative | 根因报告已经完整了，直接把它创建成 GitHub 缺陷 Issue。 | `development/github-issue-manager` + triage Gate | 调查已完成，当前只剩 Issue 写操作。 | PASS_SEQUENCE |
| RDR-07 | negative | 这份实施计划正文已经完成，不要再规划，只把它作为一个新 Issue 写到仓库。 | `development/github-issue-manager` + triage Gate | 已完成正文的纯写入继续由通用 Manager 主导。 | PASS_SEQUENCE |
| RDR-08 | negative | 创建一个【讨论】Issue，咱们围绕这个架构冲突正式讨论。 | `development/github-discussion-facilitator` | 正式讨论继续由 facilitator 主导。 | PASS |
| RDR-09 | negative | 研究最近 30 天 Reddit 和 Hacker News 对这个 AI 编码工具的真实评价。 | `research/community-research` | 外部社区研究继续进入 `research`。 | PASS |
| RDR-10 | negative | 全面研究 Agent Skills 生态、主要实现、标准和争议，要求多来源可追溯。 | `research/deep-research` | 外部生态研究继续由 Deep Research 主导。 | PASS |
| RDR-11 | negative | 这个接口到底返回什么？请求头、鉴权、schema 和 OpenAPI 是否一致？ | `development/api-contract-audit` | 单点 API 合同审计仍由专用 Skill 主导。 | PASS |
| RDR-12 | composition | 全面调研发布链路并创建【调研】Issue；过程中如果确认独立生产 Bug 就顺手查重留痕。 | `development/github-research-document-generator` + incidental bug capture | 调研持有主路由，Bug 只作为条件旁路。 | PASS_COMPOSITION |
| RDR-13 | conflict | 同时做一份独立源码调研报告，并把另一份已经完成的无关正文创建成普通 Issue。 | 两个独立主交付物，识别冲突 | 两份交付物可独立验收，不强行合并。 | PASS_CONFLICT |
| RDR-14 | neighbor-boundary | 上一轮调研正文已经完整定稿。当前：正文不要再改，只把这份现成内容作为普通新 Issue 写入仓库。 | `development/github-issue-manager` + triage Gate | 当前目标已收缩为纯生命周期写入，Manager 接管。 | PASS_SEQUENCE |

## 结论

- “创建一份调研文档到 Issue”现在在第一层 `development` Plugin description 中有直接召回信号。
- `github-research-document-generator` 明确把【调研】Issue、源码调研 GitHub 留档归入 `documented_research`，Issue 写入不切换给 `github-issue-manager`。
- 已完成正文后的纯普通 Issue 写入仍由 `github-issue-manager` 主导；外部 Research、Bug、Discussion、API Audit 的近邻边界保持不变。
- 本表是当前规则在这些样本上的语义回归证据，不表示总体路由准确率。
