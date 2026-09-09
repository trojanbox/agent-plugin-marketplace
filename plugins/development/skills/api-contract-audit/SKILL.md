---
name: api-contract-audit
description: "用于基于用户提供的当前源码核对一个或一组 API / RPC / endpoint 的真实合同，并在服务端实现、调用方、类型/schema、测试与 OpenAPI/接口文档之间做一致性审计。适合‘这个接口返回什么/请求头和其他内部接口是否一致/鉴权怎么做/字段从哪来/源码与接口文档是否一致/给我可导入 Apifox 的 OpenAPI’。默认只做当前合同事实读取与审计，不设计新合同、不修改源码，也不把单接口问题扩张成完整系统调研。"
phase: verification
optional_uses: "development/github-incidental-bug-capture"
---

# API Contract Audit / API 契约审计

## 唯一目标

从**当前源码**还原 API/RPC 的真实合同，并对账服务端、调用方、schema/type、测试与接口文档，明确一致、缺失、漂移或待验证项。

完整系统调研转源码调研；目标合同设计/冻结转讨论或结论；已知故障根因转缺陷调查。

## Skill Composition / 旁路缺陷捕获

审计过程中确认独立生产 Bug时，组合 `development/github-incidental-bug-capture` 留痕后继续审计。合同 mismatch 先分类，不能自动等同生产 Bug。

## 证据原则

1. 用户提供的**当前源码**优先；历史 OpenAPI、Issue、接口平台和测试记录仅作为对账材料。
2. 不假设单一文件永远权威：入口、鉴权、schema、序列化、调用方和测试都可能共同定义合同。
3. 事实、推断、历史描述、目标需求分开；没有真实运行就不声称运行时行为已验证。

## 审计流程

1. **锁定范围**：接口/方法、调用方、用户要核对的合同维度。
2. **定位真实入口**：找到 route/controller/RPC handler 及其服务调用、类型/序列化与测试。
3. **逐项还原合同**：读取 `references/contract-audit-checklist.md`，核对鉴权/Header、Path/Query/Body、Response、Error、Side Effect、幂等及多调用方。
4. **做一致性矩阵**：实现 ↔ 调用方 ↔ schema/type ↔ tests ↔ OpenAPI/docs，按事实分类 mismatch。
5. **输出**：简单事实查询直接回答；正式审计或 OpenAPI/Apifox 交付时读取 `references/openapi-output-and-evidence.md`。
6. **转阶段**：目标合同未决 → 讨论；需要冻结目标 → 结论；已确认 Bug → 旁路记录或专门 Bug 调查；后续改动/测试 → 对应计划 Skill。

## 完成条件

- 每个用户关心的合同维度都有源码依据或明确未知；
- 调用方与服务端差异被显式分类；
- OpenAPI 仅描述当前可证实合同，不把目标设计冒充现状；
- 审计没有扩张成无关的全系统调研。
