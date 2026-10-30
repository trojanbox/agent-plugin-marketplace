# Bug Investigation · 正式 Markdown 报告路由语义回归（2026-10-30）

## 变更与方法

- 修改类型：`WORKFLOW_GAP + DELIVERY_GAP + TRIGGER_GAP`。既有 `development/github-bug-investigation` 的调查目标不变，新增用户明确要求的 `formal_markdown_report`，主内容按需加载 `references/markdown-investigation-report.md`。
- 执行方式：按已发布的 Skill descriptions、Gate 和相邻 Skill 边界**逐条做语义一致性判读**；重新引用全局基准 B017、B018、B002、T031、T033、T073，并将 MDIR001–010 写回稳定基准。这里的 `PASS` 只表示本次规则判读一致，**未开展真实独立模型多轮路由调用，不代表模型在线命中率**。
- 记号：`B` = `development/github-bug-investigation`，`R` = `development/github-research-document-generator`，`G` = `github/github-issue-manager`。

| ID | Bucket | 用户真实表达与上下文 | Expected | Current decision（依据当前规则） | Result |
| --- | --- | --- | --- | --- | --- |
| BI-01 | positive | 这个资源库详情页插入后规格没了，结合源码查清楚后生成一份 .md 问题报告。 | B · formal | 缺陷原因调查 + 明确文件交付；加载 report reference | PASS |
| BI-02 | positive | 帮我定位这个线上 500 的根因，给一份可下载的 Markdown 调查报告。 | B · formal | 独立生产 Bug 调查由 B 主导，文件需真实验证 | PASS |
| BI-03 | multi-turn | 上一轮已经确认两处数据丢失根因。现在把它们整理为可转发的详细 .md 问题报告。 | B · formal | 复用仍有效证据，不机械重跑；两个根因独立说明 | PASS |
| BI-04 | regression / B017 | 我点击添加区块后报错了，结合截图和源码查一下什么原因。 | B · analysis_only | 无报告请求，默认只在对话分析 | PASS |
| BI-05 | regression / B018 | 网站发布弹窗报错，这里有日志，帮我找根因。 | B · analysis_only | 不自动创建 Markdown/Issue | PASS |
| BI-06 | regression / B002 | 创建一份调研记录，把刚才的源码分析留档。 | R · documented_research | 源码调研文档继续由 R 主导 | PASS |
| BI-07 | negative / T033 | 完整调研发布链路，并把结果记录成【开发·调研】Issue。 | R + Issue persistence | 跨模块现状调研主流程归 R | PASS_COMPOSITION |
| BI-08 | negative | 帮我盘点页面资源库已实现的全部功能并写 Markdown 调研报告。 | R · documented_research | 不涉及独立故障；保留研发调研边界 | PASS |
| BI-09 | negative | Bug 根因报告已经完整了，只需把正文写入 GitHub 缺陷 Issue。 | G · Issue write | 纯生命周期写入归 G，按查重 Gate | PASS_SEQUENCE |
| BI-10 | negative | 把我现成的 .md 调查报告润色成人话，不用分析代码。 | writing/clear-writing | 单纯编辑文案不重新进入缺陷调查 | PASS |
| BI-11 | composition / T031 | 调查这个偶发 Bug，生成 .md 报告，并创建缺陷 Issue。 | B + G（条件） | Bug 调查与报告由 B 主导，Issue 需单独授权和查重 | PASS_COMPOSITION |
| BI-12 | gate | 根因还不清楚，但我要求直接给 .patch，报告就不用写了。 | B · hypothesis | 保持 Patch Fast Lane Gate，不因文件格式跳阶段 | PASS |
| BI-13 | multi-turn / T073 | 上一轮根因 confirmed 且 S 级 Patch Gate 已通过。现在直接 patch。 | development/source-patch-implementation | Patch 任务进入下游，不自动写报告 | PASS_SEQUENCE |
| BI-14 | conflict | 同时要一份独立问题调查报告和另一份无关的产品用户需求调研报告。 | B + product/product-research 两个独立主任务 | 不静默将两个不同目标硬并入 B | PASS_CONFLICT |
| BI-15 | negative | 帮我设计多场景 Gherkin 技术测试方案，覆盖这个 Bug 的故障注入。 | development/github-technical-test-plan-generator | 专项测试设计归 testing Skill | PASS |
| BI-16 | adversarial | 我只说了线上报错，没有给源码或日志；照样写一份确认根因的 .md。 | B · formal / insufficient evidence | 可以生成调查中报告；根因不能伪称 confirmed | PASS |
| BI-17 | adversarial | 把这份缺陷报告存成 .md 并给下载链接；当前环境完全不支持文件写入。 | B · formal / fallback | 如实说明工具限制并提供完整可复制正文，不捏造下载链接 | PASS |
| BI-18 | regression / T074 | 上一轮只有竞争性根因假设，当前不用查了，直接 patch。 | B · hypothesis Gate | 未确认根因仍留在缺陷调查阶段 | PASS |

## 审查结论

1. **保留主目标**：Bug 根因调查继续为 B，快速问答 `analysis_only` 不制造文件或 Issue。
2. **新增交付模式**：正式 Markdown 由显式请求触发；前一轮调查完成后的 `.md` 导出继续由 B 承接。
3. **邻居边界**：系统实现盘点 R、纯 Issue 写入 G、润色 writing、测试方案 Testing、Patch Implementation 各自保留职责。
4. **真实性 Gate**：文件存在/非空/可读和外部可下载链接需实际验证；只有假设则给进行中报告。
5. **后续验证**：此处是单轮规则语义判读；真实宿主触发一致性和完整报告质量仍需要在使用中观察，不能从本表推断实际模型稳定率。
