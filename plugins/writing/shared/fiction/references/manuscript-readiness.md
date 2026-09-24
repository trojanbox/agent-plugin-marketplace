# Manuscript Readiness Gate / 正文可写性合同

用于 `fiction-manuscript-readiness` 的独立正文前置检查，也供 `fiction-outline` 判断自己产出的章节是否达到 Ready for Writing。

## 1. 判定原则

`Ready for Writing` 的含义是：**正式成文剩下的主要工作是表达与场景实现，不再需要临场补高影响 Canon、剧情、人物关系或信息释放决定。**

不要把“材料很多”当作 Ready，也不要因为某些表达细节未定就判 Not Ready。

### Blocker

正文作者如果必须自行决定下列任一项，通常属于阻塞：

- 当前章为什么发生、主要因果怎么走；
- 关键人物此刻真正想要什么、会怎样第一反应；
- 人物当前有多熟，能否这样开玩笑、打断、触碰、替答、揭短或问私人问题；
- 谁已经知道什么、当前允许揭露什么；
- 某个高影响 World / Character / Story / Style 事实；
- 上一章留下的关系、情绪、身体、物件或行动状态怎样进入本章；
- 当前章结束后最重要的状态变化与下一章连接；
- 当前项目声明必须同步的 Canon / Outline 仍处于 `pending_sync` 或冲突状态。

### Non-blocker

通常可以留到正式表达阶段：

- 具体句子怎么写；
- 场景内普通动作与环境细节如何铺陈；
- 不改变关系权限和信息边界的自然对白措辞；
- 项目 Style 已允许范围内的段落、节奏和语言实现；
- 不影响关键因果的微小生活细节。

## 2. 最小检查面

### Authority / Recovery

- 当前 Book / 作品明确；
- 当前任务使用的是现行权威材料，不依赖旧稿、旧 Issue 或聊天记忆猜当前状态；
- 项目要求的 Knowledge / Mistakes / ADR / Directory Contract 已按自己的规则恢复。

### Design Stability

- 当前章不依赖仍未确认的高影响 World / Characters / Story / Style 选择；
- 活动 Issue 中没有会改变本章关键因果、人物底色、关系阶段、信息释放或表达合同的阻塞项。

### Character Execution

关键人物至少能回答：

- 当前目标与注意力；
- 压力 / 身体 /现实限制；
- 默认社交姿态；
- 当前关系阶段与互动边界；
- 已知 / 未知、权限与能力边界；
- 上一章 Carry-over；
- 本章离场变化。

稳定底色应来自 Characters；跨章关系阶段来自 Story；当章执行态来自 Outline。不要让正文作者用人物标签自行猜关系尺度。

### Story / Information

- 当前章的章节职责和状态变化清楚；
- 场景因果足以连续展开；
- 重要信息释放顺序、禁止提前揭露内容和关键第一反应明确；
- 不存在会迫使正文作者现场重写 Story Movement 的缺口。

### Style Source

- 当前作品的表达约束来源明确：Book Style、用户明确合同或项目声明的其它 Owner；
- Readiness 只检查“有没有明确来源、是否存在未决高影响冲突”，不评价长短句、段落形态、幽默、修辞等审美选择；
- 不创建通用正文风格来填补缺失的 Book Style。

### Outline / Continuity

当前章至少明确：

- 进入状态；
- 主要场景 / 因果链；
- 人物关键反应和关系权限；
- 信息开放 / 禁止；
- 离开状态；
- 章尾连接。

续写时还要能读取上一章正文结尾；必要时读取相邻章 Outline，防止重复事件、状态跳变或提前消费后续关系。

### Sync / Operational State

- 项目要求写回 Canon 的已确认决定已经同步；
- `pending_sync`、明显 Owner 冲突或关键来源不可访问时，不把状态声明成 Ready。

## 3. Writing Simulation Test

把当前权威输入交给一个没有参与讨论的 Agent，问：

> 它是否还必须替作者决定关键剧情、人物反应、关系阶段、互动权限、信息释放或其它高影响事实，才能写完整章？

- **是** → `Not Ready`；指出最小阻塞 Owner。
- **否** → 可以 `Ready`；剩余事项主要属于正式表达。

## 4. 缺口归属

- World / Characters / Story / Style 高影响决定缺失 → 建议 `fiction-discussion`；
- 章节职责、场景链、当章执行态、关系权限、Carry-over 或章际连接不足 → 建议 `fiction-outline`；
- 只是已有正文质量问题 → 不回头假装 Readiness 缺失，使用对应 Review / Revision Skill。

Readiness Gate 自己不修改 Canon，也不代替这些 Skill 完成修复。
