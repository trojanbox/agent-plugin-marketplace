---
name: fiction-continuity-review
description: "连续性审查。用于检查小说前后事实、状态和信息是否还能同时成立：World/Story/Character Canon、时间年龄地点物件身体状态、人物知道/不知道什么、关系阶段、相邻章节重复事件与章际衔接。适合‘前后设定有没有打架/这章改完和上一章接得上吗/人物是不是提前知道了/第二三章是不是重复’。本轮修改是否修好且无回归用 fiction-revision-validation。"
visibility: workflow
phase: verification
---

# 连续性审查

## 唯一问题

**前后事实、状态和信息还能同时成立吗？**

先读取 `../../shared/fiction/references/review-contract.md`。有 Storybook 时读取 World / Characters / Story / Outline 与审查范围正文。

## 检查

- World / Story / Character Canon 冲突；
- 时间、年龄、地点、物件、身体状态；
- 人物已知 / 未知 / 误解的信息；
- 读者已经知道什么；
- 关系阶段和称呼；
- 已发生事件是否在后章重新发生；
- 同一信息是否重复解释；
- 伏笔 / reveal 的状态；
- 章末到下一章开头是否重演、跳变或失忆。

局部重写默认至少检查：

```text
前一章 → 当前章 → 后一章
```

需要长篇边界与重复方法时读取 `../../shared/fiction/references/revision-methods.md`。

## 边界

尽量保持事实型；“我更喜欢另一种写法”不属于连续性缺陷。本轮修订的回归判定由 `writing/fiction-revision-validation` 主导。
