# GitHub Remote Write Recovery Semantic Routing Eval

本轮验证 `github-remote-write-recovery` Gate 只改变 GitHub 远端写失败后的恢复/降级行为，不改变主 Skill 所有权。

| ID | Bucket | Prompt / Context | Expected | Current decision | Result |
|---|---|---|---|---|---|
| GWR-01 | positive | 创建一个【讨论】Issue，咱们围绕插件架构正式讨论。 | `development/github-discussion-facilitator` | 讨论仍由 facilitator 主导，远端写入只是持久化步骤。 | PASS |
| GWR-02 | positive | 根因报告已经完整，直接创建 GitHub 缺陷 Issue。 | `development/github-issue-manager` + triage Gate | Manager 主导创建，Triage 保持写前 Gate。 | PASS_SEQUENCE |
| GWR-03 | negative | 只查一下有没有重复 Issue，先不要创建。 | `development/github-issue-triage` | 只读查重仍由 Triage 主导。 | PASS |
| GWR-04 | negative | 把现有 github-handoff 包同步到 GitHub。 | `development/github-issue-handoff-sync` | 已有交接同步仍由 Handoff Sync 主导。 | PASS |
| GWR-05 | gate | 创建讨论时 `gh: not found`，但 `~/.local/bin/gh` 存在。 | facilitator + recovery Gate；不得 handoff | 先恢复 CLI 绝对路径，再继续原讨论写入。 | PASS_SEQUENCE |
| GWR-06 | gate | Triage 已完成，长 `gh issue create` 被执行宿主拒绝。 | manager + recovery Gate；使用 `--body-file` | 主路由不变，先降复杂度重试。 | PASS_SEQUENCE |
| GWR-07 | gate | `gh auth status` 明确未登录且当前无法安全修复。 | 原主 Skill → recovery failed → handoff（若用户允许） | 只有确认认证能力不足后进入 handoff。 | PASS_SEQUENCE |
| GWR-08 | gate | GitHub 返回 403，账号无目标仓库写权限。 | 原主 Skill → recovery failed → handoff（若用户允许） | 明确远端拒绝后允许降级。 | PASS_SEQUENCE |
| GWR-09 | adversarial | 写入失败了，别生成 handoff，再试一下。 | 原主 Skill + recovery Gate；禁止 handoff | 用户禁止 handoff 时只恢复/重试或报告阻塞。 | PASS |
| GWR-10 | adversarial | `gh` 不在 PATH，直接给我生成 handoff。 | 用户明确要求 handoff，可进入 handoff | 用户显式选择降级产物，允许按请求执行。 | PASS |
| GWR-11 | composition | 调查这个 Bug，确认后创建 Issue；写入时发现 `gh` 路径问题。 | bug investigation 主导 + Issue side effect + recovery Gate | 领域调查不被 Manager/Recovery 抢主路由。 | PASS_COMPOSITION |
| GWR-12 | multi-turn | 上轮 Triage 已判定新建；现在创建，若复杂命令失败先修复命令形态。 | manager；复用 Triage + recovery Gate | 不重复查重，不因执行层错误切换主 Skill。 | PASS_SEQUENCE |
| GWR-13 | conflict | 同时做一份独立架构调研报告，并把另一份已完成正文创建成无关 Issue。 | 两个独立主交付物，识别冲突 | Recovery Gate 不合并独立主任务。 | PASS_CONFLICT |
| GWR-14 | regression | 给现有 #123 追加新证据。 | `development/github-issue-manager`，不重复 Triage | 现有 Issue 更新规则不变。 | PASS |

## 结论

- Recovery Gate 只接管远端写失败后的诊断与有限恢复，不改变 Discussion / Bug / Triage / Issue Manager / Handoff Sync 的主路由所有权。
- PATH 缺失、Shell/宿主命令形态失败与真实 GitHub 权限失败已经分层。
- handoff 仍保留为能力降级路径，但触发条件收紧到“恢复 Gate 已确认当前会话确实不可写”，并服从用户显式禁止 handoff 的要求。
