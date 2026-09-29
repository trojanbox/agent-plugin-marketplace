---
name: fiction-final-review
description: "全书终审。用于整本小说从头到尾连续阅读后的最终综合审查，把人物、连续性、表达、可读性、节奏和当前修订回归结果合并为版本绑定的 Publication Readiness 判断。适合‘整本从头到尾审一遍/出版终校/这本书达到发布标准了吗/来一轮终校/以前已经终审过但后来又重写了，原结论还算吗’。发布前文本校对按需加载专项终校 reference；它是组合型总审查，不重新发明另一套人物或文风规则。"
visibility: workflow
phase: verification
---

# 全书终审

## 唯一目标

完成整本连续阅读，按专项审查维度汇总跨维度问题，并把 Publication Readiness **绑定到这一次实际审过的 Manuscript 版本**，避免旧终审结论在后续实质改稿后被误继承。

先读取 `../../shared/fiction/references/review-contract.md`；有 Storybook 时读取 Book README、World / Characters / Story / Style、当前完整 Manuscript、长期 Revisions 结果与 Preserve Set。

用户明确说“出版终校 / 发布前最后一遍 / 最终校对 / 来一轮终校”，或任务包含标点、空格、章标题、编号、固定结尾等成书层检查时，再读取 `../../shared/fiction/references/publication-proofread.md`。

## 组合视角

依次覆盖：

1. **人物**：人物逻辑、Voice、关系温差、知识边界；
2. **连续性**：Canon、时间、状态、信息与章节连接；
3. **表达**：Work Voice、POV、AI 腔、对话与段落模式；
4. **可读性**：普通读者认知负担；
5. **节奏**：重复机制、Reader Pull、情绪曲线、情感投资；
6. **修订回归**：重要 Preserve Set 与历史已修问题。

需要细化某一维时使用对应专项 Review 的合同与 shared references；本 Skill 不维护第二套标准。

## Version Binding Gate

开始判断发布状态前，先记录当前审查对象的可验证身份：

- 仓库 / 分支 / commit（可取得时优先）；
- Manuscript 章节范围或文件集合；
- 当前关键 Revision 基线。

`Publication Readiness Reviewed` 只对这组版本身份成立。后续改动按影响范围决定旧结论是否失效：

- 纯格式、确定性文本清洁：通常只需受影响文件回归，不强制整本重读；
- 局部实质改写：至少重读受影响章、相邻章及相关人物 / 信息弧线；
- 第三幕重写、结构重排、高影响人物 / Story / Style 改动：旧 Publication Readiness 失效，重新整本连续阅读。

不能因为“以前终审过”或 Revision 文件还在，就把旧结论自动继承给新正文。

## 执行方式

1. 从头到尾连续阅读当前版本，先记录问题，不在第一页陷入句子润色；
2. 按根因合并重复症状，识别跨维度问题；
3. 先列 P0/P1，再列 P2；
4. 同时记录已经成立、不建议继续修改的 Preserve Set；
5. 只有完整连续阅读完成后才判断 Publication Readiness；
6. 如果是终校执行任务，先完成内容诊断，再只修证据明确的成书层问题；创作性改写仍遵守 Review 边界。

## Protect / No Change Gate

当 P0/P1 已清空，剩余项主要属于“另一种写法也可以”的 P2 偏好，或继续改会伤害已成立的人物声音、生活感、节奏与 Preserve Set 时：

> **明确标记 `Protect / No Change`，停止主动润色。**

任何继续修改都必须能指出一个具体缺陷及其证据；“还能更漂亮 / 更高级 / 更工整”本身不是改稿理由。

## 完成状态

- `Draft Complete`：正文写完；
- `Revision Complete`：当前明确修订范围完成；
- `Continuous Read Complete`：已整本连续审查；
- `Publication Readiness Reviewed`：当前**版本绑定**的全书人物、连续性、节奏、语言/表达与格式等终校已完成并给出结论。

正文写完、局部修完或旧版本曾经终审过，都不能直接等同当前版本“可以出版”。

## 边界

全书终审默认输出诊断和优先级，不静默大改全书。发现高影响创作问题时回【创作·讨论】；用户明确要求“终审并修复 / 来一轮终校并落稿”时，先完成诊断，再只对证据明确的问题进入对应修订。没有具体缺陷时保持现稿。
