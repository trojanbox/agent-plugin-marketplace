# 【创作·章纲】Issue 与 Planning 持久化合同

## 权威模型

```text
World / Characters / Story / Style
= 长期 Canon Owner

outline/ 或等价 Planning Layer
= 可选的近期写作计划 / 结构工作视图

【创作·章纲】Issue
= 需要时的协作、讨论与决策历史
```

Planning 不能成为第二套 Canon。长期事实如果只存在于章纲 / Issue，必须回写真正 Owner；旧计划与当前 Canon 冲突时，以 Canon Owner 为准。

## 推荐持久化方式

持续写作、每次只推进少量章节时，优先维护：

```text
outline/current.md
```

只保存接下来 1～3 章或当前真实需要的近端范围。已消费的计划可以由 Git 历史追溯；完整逐章大纲只有用户明确需要时才维护。

项目已经存在历史详细章纲时，可以保留为 `legacy / superseded planning reference`，不要求删除，也不能继续作为 Manuscript 的逐项执行清单。

## Issue

Routine Rolling Plan 不强制建 Issue。以下情况才使用【创作·章纲】Issue：

- 用户明确要求长期记录 / GitHub 协作；
- 章节拆合会明显影响 Story Movement 或大量后续文件；
- 多人 / 多 Agent 需要共享当前规划决策历史；
- 项目合同明确要求。

Issue 正文保持轻量：范围、目标、已确认结构决定、Preserve Set、替代关系和当前持久化入口。

## pending_sync

只有当**项目或用户明确要求某个 Planning 产物必须先持久化**时，才使用 `pending_sync`：

- 已确认但尚未写回当前 Planning 文件 → `pending_sync`；
- 不能声称“计划已经同步”；
- 但 `pending_sync` **不是通用 Manuscript Readiness Blocker**。正文是否可写仍由高影响 Canon / Story / Character / Style / relationship / information 边界决定。

## Rolling Plan 最低质量

- 当前 Chapter Engine 清楚；
- Hard Anchors 只保留高影响节点；
- 关系 / 信息边界足以避免真实越界；
- Exit Change 或近端方向清楚；
- `creative_open` 明确保留给正文；
- 不用固定场景数、固定章节数或知识点配额组织正文。

## 每轮写后检查

- 长期事实是否误放进 Planning 而没有 Owner；
- 当前计划是否仍与 Story / Characters / Style 一致；
- 上一章正式成文后，原计划是否已经失效或需要缩短 / 改写；
- 是否出现“场景 A 证明主题 A、场景 B 展示设定 B”的逐项施工倾向；
- 旧计划是否被清楚标记为 superseded / legacy，而没有和 `current.md` 并列争权威。
