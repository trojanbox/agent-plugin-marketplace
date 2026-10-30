# Bug 根因质量门禁 · 语义路由与行为边界回归（2026-10-30）

## 范围及评估方式

- 变更类型：`WORKFLOW_GAP`，原 `development/github-bug-investigation` 的 root-cause quality 缺口；保留 Stable Skill ID、`phase: investigation`、`optional_uses` 与默认 `analysis_only` / 正式 `.md` / Issue / Patch Fast Lane 的授权边界。
- 来源：当前已安装 Skill 与新增 `references/root-cause-quality-gates.md`；复用 `references/semantic-routing-regression.csv` 内 B017、T031、T073、T074、MDIR001、MDIR005、MDIR010，新增 RCQ001–RCQ012。
- 方法：基于当前 Skill 触发词、相邻 Skill 边界和阶段 Gate **逐条人工规则判读**。本表不是真实宿主模型路由运行，也不证明未来调查一定执行对抗审查，更不能据此计算模型命中率。

| ID | 类别 | 简述 | 期望主 Skill 或 Gate | 当前规则判读 | 结果 |
| --- | --- | --- | --- | --- | --- |
| RCQ001 | positive | 插入页面缺规格；区分代码缺陷与事故归因 | bug-investigation | 代码级可单独确认，个案归因需当次证据 | PASS |
| RCQ002 | positive | AI 生成缺数据；要求查最终提示词和产物 | bug-investigation | 根据真实输入/Prompt 装配/模型输出/确定性加工分层 | PASS |
| RCQ003 | positive | 两个候选根因；要求最小证伪步骤 | bug-investigation | 根据竞争假设找证伪观察，不凭空发散 | PASS |
| RCQ004 | positive | 共享函数修复副作用、消费者与失败路径 | bug-investigation | 按传播范围审查反例，必要时修正方案及理由 | PASS |
| RCQ005 | multi-turn | 上轮仅有函数级复现；用户要求确认线上事故 | bug-investigation，不能冒充 confirmed 事故归因 | 代码级 confirmed 与事故级 unknown/hypothesis 分开 | PASS |
| RCQ006 | negative | 全面盘点资源库模块与调用链并写调研文档 | research-document-generator | 源码系统调研，未指定独立故障 | PASS |
| RCQ007 | negative | 已定缺陷需要技术测试方案与 Harness | technical-test-plan-generator | 测试设计交由技术测试 Skill | PASS |
| RCQ008 | gate | 没有真实证据却要创建【缺陷】Issue | bug-investigation，INSUFFICIENT_EVIDENCE | 分类必须确认后才能进入生产缺陷写入门 | PASS |
| RCQ009 | adversarial | 只靠 Prompt 模板断言模型造成某次删数据 | bug-investigation，拒绝虚假归因 | 模板不等于最终模型调用输入，缺证据只写 hypothesis | PASS |
| RCQ010 | composition | 调查 + 正式 .md + 缺陷 Issue | bug-investigation + 条件 github manager | 调查主导，文件/Issue 各自经过明确授权门 | PASS_COMPOSITION |
| RCQ011 | conflict | 独立 Bug 调查与无关的新产品需求调研 | bug-investigation 和 product-research | 两个独立目标，不偷换主技能 | PASS_CONFLICT |
| RCQ012 | gate | 局部小 Bug 无 E2E 环境；只要求根因与验收边界 | bug-investigation，按风险裁剪 | 不强制启动用户未授权的 E2E | PASS |
| B017 | regression | 插入区块报错，结合截图与源码查原因 | bug-investigation 默认对话 | 无正式报告/Issue 请求，不产生额外文件 | PASS |
| T031 | regression | 调查偶发 Bug 并显式创建缺陷 Issue | bug-investigation + github manager | 显式授权，必须按根因证据查重 | PASS_COMPOSITION |
| T073 | regression | 根因 confirmed、S/Fast Lane 已通过，当前要 .patch | source-patch-implementation | 已完成 Gate，进入下游实现 | PASS_SEQUENCE |
| T074 | regression | 仅竞争假设未定，但用户要直接 .patch | bug-investigation | hypothesis 无法绕过 Patch Fast Lane | PASS |
| MDIR001 | regression | 源码 Bug 调查并生成 .md 报告 | bug-investigation formal_markdown_report | 文件输出模式保持不变，追加事实分级 | PASS |
| MDIR005 | regression | 盘点当前实现并写调研报告 | research-document-generator | 研发调研的报告仍由调研 Skill 负责 | PASS |
| MDIR010 | regression | 独立缺陷调查报告和无关产品需求报告 | 两个主目标并列 | 不强制混为一项工作 | PASS_CONFLICT |

## 结论与限定

- 身份/路由不变，仅在**复杂 Bug 调查**按需加载根因参考；日常小问题保持原流程。
- 新 Gate 限定证据强度和方案质量，不自动授权修改产品代码、运行 E2E、建立 Issue 或创建正式结论。
- 结构与合同自动化测试只能证明**当前文件包含所要求的规则并可被 Runtime 发现**；真实模型对事故级归因和反例审查的遵守情况，需要后续具体任务的产物级审查。本轮未运行多模型/多次独立语义打分。
