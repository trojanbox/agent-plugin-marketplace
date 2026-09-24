# 小说创作 Issue 工作流

只有用户明确要求 GitHub 持久化、已有创作 Issue 需要续接，或当前项目约定用 Issue 跨会话保存时读取。用户明确 chat-only 时不使用。

## 三类正式流程 Issue

```text
【创作·讨论】【书名】<主题>
【创作·结论】【书名】<主题>
【创作·章纲】【书名】<版本 / 范围>
```

- 【创作·讨论】：保存本轮问题、Q/D 决策、理由、边界、creative_open、deferred 与历史演进；新点子阶段不强制创建。
- 【创作·结论】：把一轮已结束讨论冻结成独立可执行结论；同一轮只维护一份。
- 【创作·章纲】：可选章节规划协作面；用于 Rolling Plan、复杂章节拆合或用户明确要求的详细章纲。确认后的长期事实回写真正 Canon Owner；`outline/` 只保存当前 Planning，不成为第二套 Canon。

同一轮尚未结束时续用原 Issue，不因新场景或改名重复创建。

## Storybook 权威

Issue 保存“为什么这样决定、当前正在讨论什么、历史怎样变化”。当前生效作品事实最终写回 Book 对应 Owner；Issue 不能成为第二套 Canon。

高影响决定在 Issue 中确认后，如果尚未同步 Owner，应明确 `pending_sync`；完成写回后再把状态改为 synced。

## Review 持久化

人物审查、连续性审查、表达审查、可读性审查、节奏审查、修订验收、全书终审默认不强制建 Issue。确需跨会话长期保存时：

- 高影响创作问题进入【创作·讨论】；
- 长期 QA / Continuous Read / Publication Review 结果可写入 Storybook `revisions/`；
- 不为每次小审查制造 Issue。

## 真实性与失败

- 只有真实 GitHub 写操作成功后才能声称已创建/更新；
- 远端暂时不可写时继续可独立完成的分析，并明确“尚未同步”；
- 不建立 story.json、event journal 等影子状态机；
- 跨会话没有 Issue / Book 可恢复时，诚实说明缺少持久上下文，不伪造历史决定。
