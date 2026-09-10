# Backend Scaffold Routing Eval

本 Eval 依据 `ai-workflow/skill-system-design` 的 Semantic Routing Eval 协议执行。

## New Skill Gate

- **最近邻**：`development/github-development-plan-generator`、`github-research-document-generator`、`github-bug-investigation`、`github-discussion-facilitator`、`api-contract-audit`、`source-patch-implementation`。
- **现有能力缺口**：这些 Skill 分别负责规划、研究、调查、讨论、审计或 S 级 Patch；没有一个负责“长期按冻结的后端脚手架合同创建/迁移/重构/规范整改代码”。
- **独立重复目标**：创建新 Nest API、把现有后端迁到基线、增加业务 Feature 时遵守统一后端合同、全局规范整改/审查，都是可重复的 implementation 目标。
- **清晰互斥**：用户问“为什么坏/怎么实现到现在/方案怎么定/给计划/只审合同”时，由邻居 Skill 主导；用户说“按脚手架规范实现/迁移/整改”时命中 web-app-scaffolding/node-nestjs-backend-scaffold。
- **停止边界**：未决架构、Bug 根因、未实现平台能力、前端任务不由本 Skill 发散。

## 当前语义判定

| Case | Result | Note |
| --- | --- | --- |
| B001-B012 | PASS | 自然语言均明确是后端脚手架 implementation/refactor/review-to-fix |
| N001 | PASS | Bug 根因主目标，归 bug-investigation |
| N002 | PASS | 当前实现系统调研，归 research-document-generator |
| N003 | PASS | 未决架构讨论，归 discussion-facilitator |
| N004 | PASS | 开发计划主目标，归 plan-generator |
| N005 | PASS | 冻结结论，归 github-spec |
| N006 | PASS | 只读当前 API 合同审计，归 api-contract-audit |
| N007 | PASS_SEQUENCE | Patch 请求先走既有 Patch Fast Lane Gate，不由本 Skill 抢路由 |
| N008 | PASS | 前端任务不命中 web-app-scaffolding/node-nestjs-backend-scaffold |
| N009 | PASS | Java/Spring 明确排除 Node/Nest Skill |
| N010 | PASS | Python/FastAPI 明确排除 Node/Nest Skill |
| N011 | PASS | Go 明确排除 Node/Nest Skill |
| A001 | PASS_SEQUENCE | 先调查根因，确认后再实施规范整改 |
| A002 | PASS_SEQUENCE | 未决 Redis 架构先讨论；本 Skill 不预实现 |
| A003 | PASS_SEQUENCE | 先建立当前合同事实；若用户明确还要整改，后续进入 web-app-scaffolding/node-nestjs-backend-scaffold |
| A004 | PASS_COMPOSITION | 完整 React+Nest 全栈由 web-app-scaffolding/react-nestjs-fullstack-scaffold 主导并 uses 两侧 Skill |
| A005 | PASS | Existing project rules override defaults；不静默迁移 |
| A006 | PASS | 用户明确要求技术栈迁移，web-app-scaffolding/node-nestjs-backend-scaffold 正向命中 |
| A007 | PASS | Stop Gate 生效，不假设 BullMQ/Redis/Worker/Outbox 已属于基线 |
| A008 | PASS | 阻止预防性 Redis/CQRS/EventBus 复杂度 |

## 结论

当前用例没有发现 `TRIGGER_GAP / FALSE_POSITIVE / NEIGHBOR_CONFLICT`。需要持续关注的邻接边界是：

1. **API audit vs web-app-scaffolding/node-nestjs-backend-scaffold**：只读“现在是什么”归 audit；明确“按统一规范整改”归 web-app-scaffolding/node-nestjs-backend-scaffold；两者同时要求时按事实审计→整改顺序。
2. **Bug investigation vs web-app-scaffolding/node-nestjs-backend-scaffold**：未知根因先调查；根因/目标已明确后的架构性整改才进入本 Skill。
3. **Planning vs web-app-scaffolding/node-nestjs-backend-scaffold**：用户要计划时不实施；用户明确要按已确认合同直接实现/重构时才使用本 Skill。
4. **Frontend vs backend**：全栈请求不让单一 Skill 冒充全部所有权。

5. **Future backend stacks**：Java/Spring、Python/FastAPI、Go 等必须有自己的 stack-specific Skill；Node/Nest Skill 不通过“后端通用”措辞抢路由。
