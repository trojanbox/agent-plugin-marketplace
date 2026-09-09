---
name: executive-communication
description: "用于面向 CEO、管理层、董事会或关键决策者的高风险沟通：项目/经营汇报、决策请求、取舍、坏消息、升级说明、Board/Executive Review。强调受众、结论优先、决策价值和明确 ask。若同一请求还明确要求去 AI 味/写得更自然，本 Skill 保留主路由并组合 humanizer；只有单纯处理已有文本的 AI 痕迹时才由 humanizer 主导。"
visibility: workflow
phase: communication
optional_uses: "writing/humanizer"
---

# Executive Communication

## 目标

把复杂信息压缩成领导者能够快速判断、追问和做决定的沟通。

方法参考 RefoundAI / Lenny Skills 的 `executive-communication`，并从产品管理语境泛化到企业运营、研发、财务、风险、项目和跨部门沟通。

## Skill Composition / 能力组合

- 用户既要求“给 CEO/董事会写决策沟通”，又明确要求“去 AI 味 / humanize / 写得自然一点”时：本 Skill 保留主路由，先保证结论、风险、取舍和 ask 正确，再组合 `writing/humanizer` 做风格清理。
- `humanizer` 不能删除关键事实、风险、caveat、决策请求或为了“像人”弱化坏消息。
- 如果用户只提供一段现有文本，主要目标只是去 AI 痕迹，没有高层决策结构任务，直接使用 `writing/humanizer`。

## 工作流

### 1. Audience & Decision

先确定：

- 谁是主要受众？
- 他们最关心的目标、风险和指标是什么？
- 这次沟通需要他们**知道、决定、批准、选择、升级还是介入**什么？

如果没有明确 ask，先帮助用户把 ask 写出来。

### 2. Start From Shared Ground

从受众已经知道且无争议的最后一个节点开始，不重复整个项目历史。

典型顺序：

```text
结论 / Ask
→ 为什么现在需要决定
→ 2–4 个关键事实
→ 取舍 / 风险
→ 推荐动作
→ 所需决定或支持
```

对于需要叙事的复杂情况，可用 SCR / SCQA / Pyramid Principle，但框架服务于信息，不强迫所有消息长成同一种模板。

### 3. Lead With the Answer

避免“电影式揭晓”。领导者可能只看到前 30 秒或第一页。

第一屏应能回答：

- 发生了什么？
- 影响是什么？
- 你建议什么？
- 需要我做什么？

### 4. Frame Trade-offs by Goals

把取舍写成组织目标和机会成本：

- “选择 A 会推迟 B，因此影响目标 X”；
- 少用“我们人不够，所以都做不了”作为唯一论据。

如果两件事不能同时完成，明确 above-the-line / below-the-line，而不是含糊承诺全部完成。

### 5. Bad News Early

坏消息、重大风险和 missed commitment 要尽早直接说：

1. 已确认事实；
2. 业务/用户/时间影响；
3. 当前处置；
4. 还不知道什么；
5. 推荐下一步；
6. 需要领导者什么决定或支持。

不要把坏消息藏在附件末尾，也不要用乐观修辞冲淡风险。

### 6. Own Reception

如果受众理解和原意不同，先检查表达、结构和上下文是否清楚，再归因给受众。

去掉没有必要的弱化词：`just / maybe / sorry to bother / I think perhaps`。保留真正表达不确定性的限定词。

## 输出形态

根据任务选择：

- **Executive Summary**：一页/一屏结论、证据、风险、ask；
- **Decision Memo**：推荐项、备选项、trade-offs、需要决定；
- **Leadership Update**：状态、变化、风险、下一步、需要帮助；
- **Bad-news Update**：事实、影响、恢复方案、时间线、升级点；
- **Board-ready Narrative**：结论和指标在前，细节作为支持。

## Final Gate

发送前检查：

- 第一段是否已经有结论或 ask？
- 是否只保留支持决策所需的背景？
- 取舍是否用组织目标表达？
- 坏消息是否足够早？
- 已知事实、推断、风险和请求是否分开？
- 是否新增了来源没有支持的事实？

若核心任务只是普通语言润色，路由到 `clear-writing`。
