---
name: github-spec
description: "用于冻结已经完成讨论或已经明确确认的目标合同，创建独立【结论】Issue。用户明确要求结论/规格、讨论收口需要冻结权威合同，或下游实施计划/技术测试方案/业务测试方案执行 Spec Gate 后进入 ready_for_spec 时使用。用户已经明确点名下游交付物时，主路由先进入对应下游 Skill，由它执行 Spec Gate；不能因为高传播且缺结论就同时把本 Skill 列为主候选。局部低传播修改可记录 spec_not_required 后跳过。"
phase: specification
optional_uses: "development/github-incidental-bug-capture"
---

# GitHub 结论

## 唯一目标

把已经确认的目标行为冻结成一个**权威、可追溯、可被实施计划和测试方案直接引用的【结论】**。结论继承已确认决定，不重新开启已结束讨论。

共享研发规则见 `../../shared/github-core/references/collaboration-policy.md`。

## Skill Composition / 旁路缺陷捕获

整理结论时若证据中确认独立生产 Bug，组合 `development/github-incidental-bug-capture` 查重留痕；缺口、未决合同、测试问题不能伪装成 Bug。

## Spec Gate

- `required`：API/数据/事件/状态生命周期/模块职责/安全/失败恢复/并发/幂等/跨服务职责等高传播合同变化，需要当前有效【结论】。
- `not_required`：局部低传播、已有合同内直接修正，可记录理由后跳过。
- `undetermined`：关键事实或决定仍缺失，返回调研/讨论。

用户明确点名【实施计划】、【业务测试方案】或【技术测试方案】时，由对应下游 Skill 先承接并执行 Gate；进入 `ready_for_spec` 后再转本 Skill。用户直接要求“结论/规格/冻结合同”时，本 Skill 主导。

## 核心流程

1. **读取完整来源**：当前讨论、用户确认、源码证据、相关历史记录；建立当前有效来源集。
2. **覆盖核对**：生成正文前读取 `references/source-and-integrity.md`，确保所有已确认决定和关键合同无损继承，过期来源不继续当权威。
3. **冻结目标合同**：清楚写目标行为、数据/API/状态、失败/恢复、安全、兼容与边界；未确认内容保持未决，不自行补齐。
4. **旁路缺陷**：发现独立生产 Bug 时使用旁路捕获，不把缺陷修复细节混进结论合同。
5. **写入与交接**：需要 GitHub 生命周期、Issue 结构、查重或下游衔接时读取 `references/delivery-and-issue.md`。
6. **写后审计**：做来源→结论、结论→来源、图文、跨 Issue 一致性检查；关键项缺失时不得宣布完成。

## 完成状态

只有真实写入成功且完整性检查通过时，才能说【结论】已创建/更新。结论完成只代表目标合同被冻结，不代表实施或测试已经完成。
