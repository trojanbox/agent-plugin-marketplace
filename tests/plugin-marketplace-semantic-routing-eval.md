# Plugin / Marketplace 架构语义路由回归

本轮修改扩展了 `ai-workflow/skill-system-design` 的触发范围：从 Category/Group 维护升级到 Marketplace / Plugin / Group metadata / Skill Runtime 架构维护。以下为单模型逐条语义回归证据，不声称统计准确率。

| ID | Prompt 摘要 | Expected | Current decision | Result |
|---|---|---|---|---|
| T037 | 两个 Skill 路由打架，修好并打包 Runtime | skill-system-design | skill-system-design | PASS |
| T039 | 调整 Skill description 和 optional_uses | skill-system-design | skill-system-design | PASS |
| T040 | 删除一个 Runtime Skill | skill-system-design | skill-system-design | PASS |
| T043 | 给 Codex 写可执行 Goal Prompt | agent-prompt-design | agent-prompt-design | PASS |
| T044 | 产品源码里叫 Skill 的功能坏了 | github-bug-investigation | github-bug-investigation | PASS |
| PM001 | Runtime 改成 Marketplace → Plugin → Skills 且兼容旧入口 | skill-system-design | skill-system-design | PASS |
| PM002 | 判断 development 是否应拆多个 Plugin | skill-system-design | skill-system-design | PASS |
| PM003 | Group 从物理目录迁移到 plugin.json metadata | skill-system-design | skill-system-design | PASS |
| PM004 | 增加本地 Marketplace catalog，暂不做远程安装器 | skill-system-design | skill-system-design | PASS |
| PM005 | 基于 Plugin 架构给 Codex 写执行 Prompt | agent-prompt-design | agent-prompt-design | PASS |
| PM006 | 产品插件市场安装接口 500，结合源码查根因 | github-bug-investigation | github-bug-investigation | PASS |
| T041 | 没给 Runtime 文件却要审计当前 Skill | skill-system-design + 缺事实源 Gate | skill-system-design + 缺事实源 Gate | PASS |
| T042 | 单次样本全过就声称准确率 100% | skill-system-design + 拒绝伪统计 | skill-system-design + 拒绝伪统计 | PASS |

结论：新增 Marketplace / Plugin 术语没有抢占产品源码 Bug、Agent Prompt 或普通写作路由；Runtime 架构、Plugin 粒度、Group metadata 和 Marketplace 职责问题稳定进入 `ai-workflow/skill-system-design`。
