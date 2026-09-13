---
name: community-research
description: "用于研究真实社区在讨论什么、实际用户如何评价和使用，以及有哪些高频赞扬/抱怨/争议、新趋势、长期经验与最佳实践。时间窗口按意图选择：近期舆情/趋势优先近期窗口，长期最佳实践/成熟经验允许扩展历史窗口并提高新资料权重；用户指定窗口始终优先。重点覆盖 Reddit、Hacker News、GitHub、YouTube 与当前环境可可靠访问的社交/论坛来源。若用户主要需要官方事实、论文、行业全景或跨类型证据综合，使用 deep-research。"
visibility: workflow
phase: research
---

# Community Research

## 目标

回答“**真实用户、开发者、从业者或社区成员在说什么、怎么用、哪些经验反复成立**”，以社区原帖和讨论为主要证据，输出重复模式、分歧、弱信号和仍无法确认的部分。

时间窗口按研究意图选择；用户指定时间范围时以用户为准。未指定时，近期舆情/趋势与长期最佳实践/成熟经验采用不同窗口策略，执行前读取 `references/window-strategy.md`。主要需要官方事实/论文/行业全景时使用 `deep-research`。

## 核心原则

- 原始社区帖子优先于二手聚合；
- 时间范围、对象身份和来源可达性先确认；
- 互动量只能作为信号强度之一，不能替代内容证据；
- 区分“重复出现”“明显分歧”“弱信号”“没有稳定信号”；
- 社区观点不能自动升级为事实。

## 工作流

1. **Intent & Window**：明确研究问题与模式；用户未指定时间窗时读取 `references/window-strategy.md`，按近期信号或长期实践选择窗口。
2. **Resolve Target**：对象存在歧义时读取 `references/target-and-source-strategy.md` 做实体解析。
3. **Plan Sources**：同一 reference 中选择社区原帖来源与必要的官方事实补充来源。
4. **Collect Evidence**：优先收集目标窗口内、与问题直接相关的原帖/讨论；长期实践模式可保留少量窗口外奠基性材料作为背景，但不得与窗口内证据混算。
5. **Filter & Cluster**：读取 `references/analysis-and-modes.md` 去重、过滤无关内容并按主题聚类。
6. **Cross-check**：同一判断尽量寻找独立来源；识别共识、极化和单点噪声。
7. **Mode-specific Analysis**：Comparison、Discovery、人物/项目动态按 `references/analysis-and-modes.md` 执行。
8. **Exit Gate**：证据已覆盖主要主题或继续搜索边际收益很低时停止；来源不可达时明确降级。
9. **Synthesize**：最终输出前读取 `references/output-and-failures.md`，保留证据强度和来源局限。
10. **来源维护（条件）**：需要核对方法来源、适配差异或许可时读取 `references/upstream.md`。

## 真实性边界

不要把旧帖子写成近期趋势，也不要因为追求“新”而丢掉长期实践中仍有解释力的历史证据；不把一个高赞帖子写成社区共识，不猜测无法访问的私密/登录内容，也不为了“凑多来源”加入弱相关材料。
