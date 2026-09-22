---
name: fiction-revision-validation
description: "修订验收。用于确认一轮小说修改是否真的解决原问题，同时检查 Preserve Set、Character Voice、Style、Canon、相邻章节和历史已修问题有没有回归。适合‘这轮改完了你验收一下/修好了吗有没有修坏别的/检查有没有回归/局部重写后再确认一遍’。它只验收本轮修改，不替代全书终审。"
visibility: workflow
phase: verification
---

# 修订验收

## 唯一问题

**这次修改到底修好了没有，同时有没有把已经成立的东西修坏？**

先读取 `../../shared/fiction/references/review-contract.md`。

## 启动输入

尽量获得：本轮为什么改、原问题及证据、修改范围、Preserve Set、修改前/后内容、必要相邻章节和相关 Owner 合同。缺少“修改前”时必须说明回归判断受限，不能伪造对比。

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

明确给出：通过 / 有条件通过 / 未通过；每个未通过项提供证据、Owner、严重度和下一步。不要因为改动很多就判“已完成”。

## 边界

只回答本轮修订是否合格，不重新做一次完整小说审查；全书交付状态由 `writing/fiction-final-review` 判断。
