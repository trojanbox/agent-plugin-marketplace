# 【创作·章纲】Issue 与 Outline 同步合同

## 权威模型

```text
【创作·章纲】Issue
= 协作 / 讨论 / 当前工作视图 / 决策历史

Storybook outline/
= 当前确认章纲的长期 Canonical Owner
```

Issue 与 `outline/` 不允许各自独立演化成两套 Canon。

## Issue 正文

保持轻量，维护：当前来源、本版目标、工作体量、继承合同、Story Movement / 阶段索引、真实章节索引、跨章硬约束、验收、非目标、替代关系。

索引建议同时指向：

```text
第5章 → current comment link → outline/005.md → sync_status: synced
```

## 章纲评论

长篇细化后优先一章一个稳定评论。评论是当前工作视图；同一章后续调整原地编辑，不制造 v1/v2/v3 评论链。

新增评论仅用于：新章节、新 Movement/组、拆章产生的新章节、值得追溯的高影响结构决定。

合并章节时保留一个当前评论；其它评论标记 merged / superseded 并从正文 current index 移除。

## pending_sync

用户已经确认、但尚未写回 `outline/` 时：

- Issue 索引标记 `pending_sync`；
- 下游不能把它当长期权威；
- 不得宣布该章节 Ready for Writing。

同步成功后：更新 `outline/` 文件 → 更新 Issue index 为 `synced` → 回读并检查一致性。

## Ready for Writing 最低条件

- 章节职责清楚；
- 人物当前目标清楚；
- 进入/离开状态清楚；
- 场景链有因果；
- 人物 / 读者信息边界明确；
- 重大刺激下人物第一反应成立；
- 关键人物的当前关系阶段、默认社交姿态与互动边界足以约束对白和行为；
- 上一章遗留的关系 / 情绪 / 身体边界在本章有明确 Carry-over（适用时）；
- 章尾自然进入下一步；
- 特殊章节的 Reading Effect / 写作重点已明确（适用时）；
- 当前确认版本已同步到 Canonical `outline/`。

## 每轮写后检查

- Issue current index 是否唯一；
- comment 与 `outline/` 是否一致；
- split / merge 的旧入口是否失效；
- 前一章 → 当前章 → 后一章是否连续；
- 信息是否提前 / 重复；
- Character Voice / Knowledge Boundary 是否越界；
- 熟悉度、称呼、玩笑、打断、触碰、替答等互动边界是否发生无铺垫跳级；
- 全局硬约束是否仍同步。
