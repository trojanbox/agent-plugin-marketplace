# Writing v4.0 公开 Skill 精简与迁移

Writing Public Skills 由 **18 → 10**：`fiction` 由 13 → 7，`general-writing` 由 5 → 3。此迁移保留专业方法、正式正文与审查证据规则；用户的 Storybook / Manuscript / 已建立的创作结论**不迁移、不重写**。由于当前 Runtime 不提供旧 Skill ID 的自动别名解析，旧公开入口须按表更新；老对话中已冻结的历史记录继续作为历史依据，不能冒充新代码中的现行路由。

## 旧 Skill → 新公开入口

| 原 ID（前缀 `writing/`） | 新 Skill | 入口模式 / 资料 |
| --- | --- | --- |
| `fiction-character-review` | `fiction-review` | Character，`shared/fiction/references/review-character-mode.md` |
| `fiction-continuity-review` | `fiction-review` | Continuity，`review-continuity-mode.md` |
| `fiction-expression-review` | `fiction-review` | Expression，`review-expression-mode.md` |
| `fiction-readability-review` | `fiction-review` | Readability，`review-readability-mode.md` |
| `fiction-pacing-review` | `fiction-review` | Pacing，`review-pacing-mode.md` |
| `fiction-final-review` | `fiction-review` | Full-book、版本绑定、按需出版终校，`review-full-book-mode.md` |
| `fiction-manuscript-readiness` | `fiction-manuscript-drafting` | READINESS_ONLY 模式：只给 Ready/Not Ready，不写正文；DRAFT 模式依然先 Gate |
| `humanizer` | `clear-writing` | Humanizer 模式，保留完整反误判与作者声音策略 |
| `popular-science-explainer` | `explanatory-writing` | Science Explanation 模式及原科普方法 references |
| `practical-usage-guide` | `explanatory-writing` | Practical Guide 模式及原实操路径方法 |

其余 8 个旧公开入口保留原稳定 ID：`fiction-discussion`、`fiction-conclusion`、`fiction-outline`、`fiction-manuscript-drafting`、`fiction-prose-editing`、`fiction-revision-validation`、`clear-writing`、`executive-communication`。新增的 2 个公开 ID 是 `fiction-review` 与 `explanatory-writing`。

## 一句话触发示例

- “检查小七是不是越来越像客服了” → `fiction-review` Character。
- “第 4 章还不知道真相，第 5 章却直接使用了” → `fiction-review` Continuity。
- “整本连续审一遍，判断可以出版了吗” → `fiction-review` Full-book：必须整本读并绑定实际版本。
- “这本书现在能开始第一章了吗，只检查不写” → `fiction-manuscript-drafting` READINESS_ONLY。
- “继续写下一章” → `fiction-manuscript-drafting` DRAFT，先 Gate，正式整章完成后按条件做 prose pass。
- “把这份报告去 AI 味，保留原来的语气” → `clear-writing` Humanizer。
- “用通俗的方式解释量子纠缠” → `explanatory-writing` Science Explanation。
- “写一份新人照着就能用的操作指南” → `explanatory-writing` Practical Guide。

## 保全边界

- 审查默认只诊断、以真实 Manuscript/Canon 证据与 P0/P1/P2 为准；高影响设计回 `fiction-discussion`，语言修复需明确授权；全书 Publication Readiness 绑定实际完整阅读的版本。
- 修订是否修好、A/B 与 Preserve Set 仍归 `fiction-revision-validation`，不会由泛审查隐式取代。
- `Manuscript Ready` 仅检查高影响 Canon / Character / Story / Style / Information；独立章纲缺失不会单独阻塞。READINESS_ONLY 绝不写入正文；Style 由当前作品拥有。
- `fiction-prose-editing` 继续独立管理文学语言质地与 Protect / No Change；不以通用 Humanizer 模式替代小说精修。
- 结论冻结仍由 `fiction-conclusion` 独立执行 Coverage、Standalone Reader 与来源双向审计，不在整理结论阶段新增创作决定。
- Explanatory Writing 的科学事实必须有依据，实操指南只描述已存在且可核对的操作；两个模式的方法分别按需加载，不提前加载全量参考文件。

## 迁移验收

- Runtime 只发现 10 个 Writing 公共 Skill；旧 ID 不在 Catalog，且两个新 Skill 可直接加载；`uses` / `optional_uses` 不指向已删除目标。
- 语义回归样例的 **expected owner** 迁移到新入口和正确模式，用户原始表达保留；历史人工 Eval 文档标记为旧版本快照。
- 原主 Skill 独有规则已归位到新主文件、专项 references 或 `shared/fiction`；共享 Canon 与 Storybook 位置不变。
- 生成/校验宿主 manifests、Runtime doctor 和仓库测试必须真实通过；路由样例的人工判读不能充当独立模型真实命中率。
