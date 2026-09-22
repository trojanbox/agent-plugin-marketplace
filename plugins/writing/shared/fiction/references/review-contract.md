# Fiction Review Contract / 小说质量审查公共合同

所有专项 Review 与全书终审在需要正式诊断时读取。

## 1. 默认工作流

```text
读取当前 Book / 用户材料
→ 读取对应 Directory Contract
→ 明确 Review Scope
→ 基于正文证据诊断
→ 定位问题 Owner
→ 判断严重度与影响范围
→ 给出修订方向 / 验收结果
```

如果存在 Storybook，Book 当前权威文件优先于历史 Issue、旧稿和聊天摘要。

## 2. 默认只审查

Review Skill 默认不静默修改 World / Characters / Story / Style / Outline / Manuscript。用户明确要求“审查并修复”时，先完成诊断再进入实际修改。

高影响创作问题不能由 Review Skill 自行重新设计，路由回 `writing/fiction-discussion`。

用户未要求持久化时不创建 Issue；需要跨会话保留时优先写入 Storybook `revisions/` 或按实际目的进入创作讨论流程，不让 Review Skill 自建强制 Issue 生命周期。

## 3. Evidence First

问题必须能落到至少一类证据：

- 当前作品合同；
- 正文具体段落 / 章节；
- 前后状态冲突；
- 连续阅读中可复现的阅读负担 / 重复机制；
- 本轮修订目标 / Preserve Set。

“不符合审查者个人偏好”不是缺陷。

## 4. 严重度

- **P0**：Canon、人物根本逻辑、关键因果等会使作品失真或互相矛盾；
- **P1**：明显影响阅读体验、长期一致性或关键阅读效果，建议修复；
- **P2**：优化项，不修也可以成立。

不做伪精确分数。

## 5. 统一问题格式

```text
问题：
证据：
为什么是问题：
影响范围：
严重度：P0 / P1 / P2
责任 Owner：
修订方向：
是否需要回【创作·讨论】：是 / 否
```

## 6. Owner 定位

- World：客观规则 / 历史 / 制度 / 机制；
- Characters：稳定人物逻辑、Voice、认知边界；
- Story：主线、关系跨阶段变化、信息释放；
- Style：Work Voice、POV、表达边界；
- Outline：章级场景、状态与衔接；
- Manuscript：正式成文；
- Revisions：只保存 QA / 修订结果，不成为第二 Canon。

## 7. 长任务恢复

长区间或全书审查在阶段切换、长时间连续执行、重要写操作、恢复中断和最终交付前，重新读取当前 Skill、Book README、相关 Directory Contract、权威文件与已确认约束。任何不确定都回权威来源，不凭记忆补全。
