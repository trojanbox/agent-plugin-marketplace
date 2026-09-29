---
name: fiction-revision-validation
description: "修订验收。用于确认一轮小说修改是否真的解决原问题，同时检查 Preserve Set、Character Voice、Style、Canon、相邻章节和历史已修问题有没有回归。适合‘这轮改完了你验收一下/改完以后更好了还是更差了/修好了吗有没有修坏别的/检查有没有回归/局部重写后再确认一遍’。有 Git / 版本历史时优先对照真实 diff 与修改前后正文，不只按 Issue 目标或修改说明判成功；它只验收本轮修改，不替代全书终审。"
visibility: workflow
phase: verification
---

# 修订验收

## 唯一问题

**这次修改到底修好了没有，同时有没有把已经成立的东西修坏？**

先读取 `../../shared/fiction/references/review-contract.md`。

## 启动输入

尽量获得：本轮为什么改、原问题及证据、修改范围、Preserve Set、修改前/后内容、必要相邻章节和相关 Owner 合同。

### Diff / Baseline First

如果项目存在 Git、版本历史、Patch 或其它可验证修改记录：

1. 优先取得真实 diff；
2. 读取修改前的实际正文与当前正文；
3. 再用 Issue / 讨论 / 施工目标解释“为什么改”，不能反过来把计划当成“已经改好”的证据；
4. 当前 Canon 与最新正式 Manuscript 仍是现状事实源，旧稿只用于比较修订效果。

缺少“修改前”或无法取得真实 diff 时，必须说明回归判断受限，不能凭修改说明伪造前后对比。

## 验收顺序

```text
原问题 → 是否解决
Preserve Set → 是否保持
新问题 → 是否引入
Character → 是否漂移
Style → 是否漂移
Canon → 是否冲突
相邻章节 → 是否断裂
历史已修问题 → 是否复发
```

局部章节实质重写默认检查前一章→当前章→后一章。复杂 Revision 方法读取 `../../shared/fiction/references/revision-methods.md`。

## 输出

明确给出：通过 / 有条件通过 / 未通过；每个未通过项提供证据、Owner、严重度和下一步。比较“更好 / 更差”时，先按本轮目标逐项对比，再说明付出的代价与新增风险，不能只给总体印象。

## 边界

只回答本轮修订是否合格，不重新做一次完整小说审查；全书交付状态由 `writing/fiction-final-review` 判断。
