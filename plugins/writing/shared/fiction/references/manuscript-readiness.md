# Manuscript Readiness Gate / 正文可写性合同

用于 `fiction-manuscript-readiness` 的独立正文前置检查，也供 `fiction-outline` 检查近期 Planning 是否存在真正阻塞。

## 1. 判定原则

`Ready for Writing` 的含义是：**高影响 Canon、Story 因果、人物/关系/信息边界已经稳定；剩余未知主要属于可以安全留给正文的创造性实现。**

不要把“材料很多”当作 Ready，也不要把“没有完整逐章章纲”当作 Not Ready。

### Blocker

正文作者如果必须自行决定下列任一项，通常属于阻塞：

- 会改变主线或当前 Story Movement 的高影响因果；
- 会改变人物长期底色或重要关系阶段的决定；
- 当前人物关系权限存在真实冲突，导致同一互动可能一版像陌生人、一版像认识十年；
- 谁已经知道什么、当前允许揭露什么存在高影响歧义；
- 某个 World / Character / Story / Style 高影响事实仍未确认；
- 上一章已经发生的重大关系 / 情绪 / 身体 / 行动状态与当前目标无法同时成立；
- 当前项目声明必须同步的**长期 Canon Owner**仍处于冲突或 `pending_sync`。

关键第一反应只有在它会改变人物弧线、关系、责任归属或信息释放时才是 Blocker。普通人的具体动作、第一句话和局部情绪表达默认属于成文空间。

### Non-blocker / Creative Open

通常可以留到正式表达阶段：

- 具体句子怎么写；
- 普通动作、环境、道具和生活摩擦；
- 不改变关系权限 / reveal 的自然对白措辞；
- 多个低影响场景先后怎样组合；
- 具体笑点、尴尬、小失败、停顿和无结果交流；
- 项目 Style 已允许范围内的段落、节奏和语言实现；
- **没有单独的 Outline / Scene List / 逐章章纲文件**。

## 2. 最小检查面

### Authority / Recovery

- 当前 Book / 作品明确；
- 当前任务使用的是现行权威材料，不依赖旧稿、旧 Issue 或聊天记忆猜当前状态；
- 项目要求的 Knowledge / Mistakes / ADR / Directory Contract 已按自己的规则恢复。

### Design Stability

- 当前正文范围不依赖仍未确认的高影响 World / Characters / Story / Style 选择；
- 活动 Issue 中没有会改变当前主因果、人物底色、关系阶段、信息释放或表达合同的阻塞项。

### Character / Relationship

至少能从 Characters + Story + 已有 Manuscript 回答：

- 当前目标与现实压力；
- 默认社交姿态；
- 当前关系阶段与关键互动边界；
- 已知 / 未知、权限与能力边界；
- 上一章重要 Carry-over。

当前章的普通动作和对白不要求预先实例化。Planning 存在时可以记录近端提醒；Planning 不存在时，正文作者可以在这些边界内自然实现。

### Story / Information

- 当前人物接下来为什么继续行动是可理解的；
- 高影响信息释放顺序和禁止提前揭露内容明确；
- 不存在会迫使正文作者现场重写 Story Movement 的缺口。

不要求提前列完整场景链或锁定每个章节的全部 Exit State。持续创作中，可以根据正式成文后的真实状态滚动规划下一批章节。

### Style Source

- 当前作品的表达约束来源明确：Book Style、用户明确合同或项目声明的其它 Owner；
- Readiness 只检查“有没有明确来源、是否存在未决高影响冲突”，不评价长短句、段落形态、幽默、修辞等审美选择；
- 不创建通用正文风格来填补缺失的 Book Style。

### Planning / Continuity

- 有 Rolling Plan / Outline 时：确认它仍与当前 Canon 和上一章正式正文一致，并识别其中的 Hard Anchors / Creative Open；
- 没有 Planning 时：只要 Story、Characters、Style、上一章状态足以约束高影响方向，可以 Ready；
- 续写时优先读取上一章正式正文；必要时读取长线 Story / 后续硬锚点，防止重复事件、状态跳变或提前消费后续关系。

### Sync / Operational State

- 项目要求写回 Canon 的已确认长期决定已经同步；
- `pending_sync` 的 Rolling Plan 只有在项目明确要求“先持久化计划再交接”时才阻塞规划交付，**不自动阻塞正文**；
- 明显 Owner 冲突或关键权威来源不可访问时，不把状态声明成 Ready。

## 3. Writing Simulation Test

把当前权威输入交给一个没有参与讨论的正文作者，问：

> 它是否还必须替作者决定会改变 Story、长期人物逻辑、关系阶段或重要信息释放的高影响事实，才能继续写？

- **是** → `Not Ready`；指出最小阻塞 Owner。
- **否** → 可以 `Ready`；普通场景实现继续留给 Manuscript。

再做反向检查：

> 如果唯一缺失的是完整逐章章纲，它是否仍能在现有 Canon 与上一章约束内写出自然下一章？

如果答案是“能”，不能因为没有 Outline 判 `Not Ready`。

## 4. 缺口归属

- World / Characters / Story / Style 高影响决定缺失 → 建议 `fiction-discussion`；
- 用户明确想先规划章节、拆合结构或复杂近端路线 → `fiction-outline`；
- 只是没有详细章纲 / Scene List → 不是缺口；
- 只是已有正文质量问题 → 使用对应 Review / Revision Skill。

Readiness Gate 自己不修改 Canon，也不代替这些 Skill 完成修复。
