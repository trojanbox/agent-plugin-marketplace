# Structured Debate / GitHub Extraction 语义回归

2026-09-16；基线 `c5043a5`。当前模型在加载本轮 Skill、Plugin description 和 Composition 规则后逐条人工判定 33 个样本（19 个历史样本、14 个新样本）。这是单次规则语义一致性检查，不是 Runtime 自动分类器测试、独立模型评估或准确率统计。自动测试另验证 discovery、引用、安装隔离和 CLI 行为。

变更前缺口：明确攻防目标没有独立 Skill（TRIGGER_GAP）；通用 GitHub 持久化位于 Development 且读取研发公共 Gate（COMPOSITION_GAP）。变更后，辩论与机制分析、研发决策和纯 Issue 写入各有明确所有权。

| ID / bucket | Prompt | Expected | Current decision | Result | 依据 |
|---|---|---|---|---|---|
| P019 / breadth-positive | 现在模型已经有 GitHub Issues 权限了，把 github-handoff 目录里的离线交接同步上去。 | github/github-issue-handoff-sync | github/github-issue-handoff-sync | PASS | 既有包的批次同步为主目标。 |
| P020 / breadth-positive | 校验这批 handoff 文件，重新查重后按依赖顺序幂等同步到 GitHub。 | github/github-issue-handoff-sync | github/github-issue-handoff-sync + github/github-issue-triage | PASS_COMPOSITION | 同步保留主目标，查重是条目 Gate。 |
| P021 / breadth-positive | 给目标仓库现有的 Issue #123 追加这段评论并添加已有的 bug 标签。 | github/github-issue-manager | github/github-issue-manager | PASS | 现有对象的评论和已有标签直接核对后写入。 |
| P022 / breadth-positive | 把 Issue #88 按已经确认的关闭理由关闭，执行后核对真实状态。 | github/github-issue-manager | github/github-issue-manager | PASS | 已确认关闭理由，无须再做全仓查重。 |
| P023 / breadth-positive | 先查一下目标仓库有没有同根因 Issue，开放和已关闭的都要看。 | github/github-issue-triage | github/github-issue-triage | PASS | 仅搜索开放与关闭候选。 |
| P024 / breadth-positive | 这个问题和历史 Issue 很像，帮我判断是补充、重开还是应该新建。 | github/github-issue-triage | github/github-issue-triage | PASS | 比较与建议，不执行生命周期写入。 |
| T025 / targeted-issue | 根因报告已经完整了，直接把它创建成 GitHub 缺陷 Issue。 | github-issue-manager 为主 → triage Gate → 创建 | github/github-issue-manager → github/github-issue-triage Gate → 创建 | PASS_SEQUENCE | 内容已完成，只剩执行写入。 |
| T026 / targeted-issue | 先查一下这个问题有没有重复 Issue，告诉我应该复用、重开还是新建，先不要写。 | github-issue-triage | github/github-issue-triage | PASS | 明确先不要写。 |
| T027 / targeted-issue | 查重，如果没有重复就直接创建；如果是复发就重开原 Issue。 | github-issue-manager 为主 → github-issue-triage Gate → 写操作 | github/github-issue-manager + github/github-issue-triage | PASS_COMPOSITION | 已有条件写入授权，Triage 不成为第二主目标。 |
| T028 / targeted-issue | 先查重，把候选和判断给我，我看完再决定要不要创建。 | github-issue-triage | github/github-issue-triage | PASS | 保留用户后续写入决定。 |
| T029 / targeted-issue | 给现有 #123 追加这段新证据。 | github-issue-manager；已知现有 Issue，不重复 triage | github/github-issue-manager | PASS | 现有 Issue 追加证据，无重复查重。 |
| T030 / targeted-issue | 把 #123 关闭，关闭理由就用我给的这段。 | github-issue-manager；已知现有 Issue，不重复 triage | github/github-issue-manager | PASS | 读取对象后按给定理由关闭。 |
| T035 / targeted-issue | 这份实施计划正文已经完成，不要再规划，只把它作为一个新 Issue 写到仓库。 | github-issue-manager 为主 → triage Gate → 创建 | github/github-issue-manager → triage Gate | PASS_SEQUENCE | 不重新规划已完成内容。 |
| T036 / targeted-issue | 把这个 github-handoff 包按 manifest 同步到目标仓库。 | github/github-issue-handoff-sync | github/github-issue-handoff-sync | PASS | manifest 批次同步归属未变。 |
| T055 / multi-turn | 上下文：刚才 Triage 结论是“新建”。当前：现在创建这个 Issue。 | github/github-issue-manager；复用已有 triage 结论，不重复全仓查重 | github/github-issue-manager | PASS | 复用有效的上轮查重结论。 |
| T056 / multi-turn | 上下文：刚才 Triage 结论是复用 #123。当前：把这批新证据补到 #123。 | github/github-issue-manager；更新已知现有 Issue | github/github-issue-manager | PASS | 上轮已确定复用对象，补充证据。 |
| T057 / multi-turn | 上下文：刚才只完成查重，我还没授权写入。当前：先别创建，把候选差异再解释清楚。 | github/github-issue-triage 继续主导 | github/github-issue-triage | PASS | 继承只读约束，不越权写入。 |
| T075 / multi-turn | 上下文：刚才 S 级 Patch 已经交付。当前：把这个问题创建成 Bug Issue 吧。 | github/github-issue-manager；必要时先执行 github-issue-triage Gate | github/github-issue-manager → triage Gate | PASS_SEQUENCE | Patch 已结束，当前是 Issue 留档。 |
| T078 / multi-turn | 上下文：Triage 已完成且 GitHub 读取正常；长 gh issue create 命令被执行宿主拒绝。当前：再试一次创建。 | github/github-issue-manager；使用绝对 gh 路径并拆分正文文件与远端写入，恢复 Gate 失败后才允许 handoff | github/github-issue-manager | PASS | 先修复命令形态并有限恢复，不立即生成 handoff。 |
| DB001 / positive | 这个观点我已经想得差不多了，你站在反方和我辩一辩 | reasoning/structured-debate | reasoning/structured-debate | PASS | 明确站反方攻防；无命题正文时先取得观点。 |
| DB002 / positive | 不要顺着我说，逐条攻击我的核心论点，看看最后还能剩什么 | reasoning/structured-debate | reasoning/structured-debate | PASS | 单点攻击与账本，而非解释现象。 |
| DB003 / positive | 我们一轮一轮辩，输了的观点要明确修改，不能偷偷换说法 | reasoning/structured-debate | reasoning/structured-debate | PASS | 命题冻结、实际回应后显式修订。 |
| DB004 / positive | 帮我把这个观点做一次 adversarial debate | reasoning/structured-debate | reasoning/structured-debate | PASS | 明确 adversarial debate 目标。 |
| DB005 / negative | 这个现象可能有哪些原因？ | reasoning/scientific-reasoning | reasoning/scientific-reasoning | PASS | 开放性解释和竞争假设，不预设辩论立场。 |
| DB006 / negative | 我们讨论一下这个系统到底用 Kafka 还是 RabbitMQ，然后记录到 Issue | development/github-discussion-facilitator + github/github-issue-manager | development/github-discussion-facilitator + github/github-issue-manager | PASS_COMPOSITION | 实际研发选型决策为主，Issue 仅持久化。 |
| DB007 / negative | 帮我创建一个 Bug Issue，正文就是我提供的完整报告 | github/github-issue-manager + github/github-issue-triage Gate | github/github-issue-manager + github/github-issue-triage | PASS_COMPOSITION | 完整报告已提供，不重启 Bug 调查。 |
| DB008 / composition | 站反方辩我的观点，并把每轮保存到 GitHub | reasoning/structured-debate + github/github-issue-manager；标题必须以【辩论】开头 | reasoning/structured-debate + github/github-issue-manager | PASS_COMPOSITION | 攻防为主，同轮续写；标题必须【辩论】。 |
| DB009 / multi-turn | 上轮 C-001 已经缩小了范围，保留原话，我们继续攻击它 | reasoning/structured-debate；保留 Original 和版本历史 | reasoning/structured-debate | PASS | 继承 C-001 当前版本并保留 Original。 |
| DB010 / adversarial | 用两年前的模型实验说明现在 AI 肯定做不了架构设计，和我辩 | reasoning/structured-debate；证据时效 Gate，不把历史实验当当前边界 | reasoning/structured-debate | PASS | 历史结果不能代表当前边界；需核验版本日期，缺证据保持 unresolved。 |
| DB011 / positive | 给志愿者招募事项查重，判断复用还是新建，先不写 | github/github-issue-triage；按交付范围判断，不要求源码根因 | github/github-issue-triage | PASS | 通用事项按交付与轮次查重，无源码前置条件。 |
| DB012 / negative | 辩论已经定稿，别继续辩了，只把这份正文保存成 Issue | github/github-issue-manager；【辩论】标题与原始命题保真 | github/github-issue-manager | PASS | 不继续攻防，保真写入且保留【辩论】标题。 |
| DB013 / conflict | 请独立写一篇科学机制分析报告，另外主持我这个价值观点的辩论 | 两个独立主交付物：reasoning/scientific-reasoning 与 reasoning/structured-debate，确认当前主目标 | scientific-reasoning 与 structured-debate：确认当前主目标 | PASS_CONFLICT | 两个明确独立主交付物，不能以辅助组合掩盖。 |
| DB014 / gate | AI 能完成这份 Jira，所以需求分析已经不需要了；来反驳我 | reasoning/structured-debate；检查 artifact 来源与隐含上游劳动 | reasoning/structured-debate | PASS | 先做 Hidden Assumption 攻击，追查 Jira 中预置的上游劳动。 |

本轮所选样本未发现剩余 ISSUE。证据时效与 artifact 来源案例只验证 Skill 的处理规则，本次没有执行真实领域研究或向 GitHub 创建测试 Issue。
