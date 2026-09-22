---
name: fiction-discussion
description: "【创作·讨论】小说创作的宽入口。用于从新点子、角色、场景、主题、结局、已有 Storybook、章纲、正文、半成品或阅读反馈出发，围绕 World / Characters / Story / Style / Outline 的高影响创作问题做多轮决策讨论。适合‘咱们聊聊这个故事/这个人物不对/这段为什么不好看/重新讨论结局/把这轮创作讨论记录下来’。不要求先有 Book 或 Issue；需要形成独立可执行冻结结果时进入 fiction-conclusion，需要把成熟故事落实成真实章节时进入 fiction-outline，纯质量检查进入对应 fiction-*-review。"
visibility: workflow
phase: discussion
optional_uses: "github/github-issue-manager"
---

# 【创作·讨论】

## 唯一目标

把当前创作问题推进成**可追溯的创作决定**：解决会阻塞当前范围的结构性未知，同时显式保留有价值的 `creative_open`，不把讨论扩张成全书百科或固定问卷。

## 主流程

1. **恢复当前事实**：如果已有 Book，先读取项目 `AGENTS.md`、Book README、相关 Directory Contract、当前 Owner 权威文件、直接相关 Outline / Manuscript 与活动 Issue；全新构思可以从用户当前材料直接开始。
2. **建立 Current Creative State**：区分当前作品事实、用户已确认决定、AI 推断、候选、deferred、非目标、creative_open 与 superseded；AI 推荐不能冒充事实。
3. **确定 Scope 与主 Owner**：用户无需先分类；Skill 内部判断 World / Characters / Story / Style / Outline 的主 Owner 与传播影响，一条长期事实只指定一个主要 Owner。
4. **建立 Q-xxx 决策树**：按依赖关系找最高杠杆问题；一次主要推进一个会真实改变后续的决策，已经能从材料确认的事实不反问用户。
5. **记录 D-xxx**：用户确认后记录选择、理由、主 Owner、传播影响、边界/非目标、creative_open、未决项、来源、depends_on / supersedes。
6. **重算待决项**：剪枝已失效分支；如果继续细化不会改善正文或避免真实错误，停止扩张。
7. **收口检查**：当前 Scope 的结构性未知已清除或明确 blocked；剩余项只能是 deferred / creative_open；需要冻结成独立执行合同时进入 `writing/fiction-conclusion`。

## Creative YAGNI Gate

每增加一个决定前检查：当前 Scope 真需要吗？不决定会阻塞下游吗？现有权威已经足够吗？继续细化能改善真实创作结果吗？如果答案都是否，停止。

不因为讨论世界观就自动新增组织/技术/历史；不因为讨论人物就强制补完整人物卡；不因为讨论故事就直接规划全部章节；不因为扩写就自动新增反派和支线。

## 结构性未知 vs 创造性未知

- **结构性未知**：不解决会导致 Canon 冲突、人物逻辑失真、Story 因果断裂、信息释放错误或大规模返工，必须解决。
- **创造性未知**：台词、小动作、低影响生活细节、局部节奏等可安全留给后续 Outline / Manuscript，标记 `creative_open`。

## 按需读取

- 需要正式 Q/D 循环、状态字段与收口规则时读取 `references/decision-loop.md`。
- 需要高层故事架构方法时读取 `../../shared/fiction/references/architecture-map.md` 与 `story-movements.md`。
- 需要人物/关系深化时读取 `../../shared/fiction/references/character-relationships.md`。
- 需要场景、信息、支线或生活世界方法时读取 `../../shared/fiction/references/scenes-information-world.md`。
- 需要作品级表达合同时读取 `../../shared/fiction/references/voice-contract.md`。
- 用户明确要求创建/续用创作 Issue 时读取 `../../shared/fiction/references/creative-issue-workflow.md`。
- 当前作品需要类型知识时读取 `../../shared/fiction/genres/index.md`，只加载实际相关类型 reference。

## Issue 与 Composition

聊天构思不强制建 Issue。用户明确“记录一下 / 创建讨论 / 后面继续”，或跨会话长期协作需要持久化时，组合 `github/github-issue-manager`，使用 `【创作·讨论】【书名】<主题>`；同一轮未结束时续用原 Issue。

## 停止边界

- 当前需要的是已经确认讨论的独立权威结论 → 转 `writing/fiction-conclusion`。
- 当前故事已成熟到逐章设计 → 转 `writing/fiction-outline`。
- 当前只是人物/连续性/表达/可读性/节奏等质量检查 → 转对应 Review Skill。
- 不在讨论阶段直接写正式 Manuscript，除非用户明确切换任务。
