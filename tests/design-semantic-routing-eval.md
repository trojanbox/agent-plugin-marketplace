# Design Runtime Semantic Routing Eval — 2026-09-07

本次新增 `design` Category 后，对新增的 14 条稳定语义回归样例做边界审阅。评估依据为 Runtime Catalog 的 frontmatter 描述、Skill 正文中的 ownership/composition 规则，以及 `semantic-routing-eval.md` 的主 Skill/组合/冲突标准。

| ID | 预期 | 结果 | 说明 |
|---|---|---|---|
| D001-D004 | visual-artifact-design | PASS | 高保真 UI、deck、prototype、wireframe 都以视觉交付为主 |
| D005 | visual-artifact-design | PASS | 消费已有 Design System，不进入 authoring |
| D006-D008 | design-system-authoring | PASS | Figma/GitHub/从零 DS 都产出可复用系统资产 |
| D009 | Data 主路由 | PASS | CSV 数据理解 + 趋势图由 Data 保留主语义 |
| D010 | Research 主路由 | PASS | 纯时效调研无视觉交付 |
| D011 | Writing 主路由 | PASS | 纯文本清晰度编辑无设计目标 |
| D012 | Design + Deep Research | PASS_COMPOSITION | 最终可验收物是投资人 deck，外部事实为子任务 |
| D013 | Design + Knowledge Synthesis | PASS_COMPOSITION | 已有材料先综合，最终可验收物是高管 deck |
| D014 | 两个 Design 主 Skill | PASS_CONFLICT | Design System 与独立 Dashboard 原型可分别验收，应拆任务 |

结论：新增设计路由没有接管 Data/Research/Writing 的既有主语义；Design System Authoring 与普通视觉设计的消费/创建边界明确。此文件记录当前规则的一致性评估，不声称替代真实模型线上路由指标。
