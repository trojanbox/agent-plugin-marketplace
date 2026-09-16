# Slow-burn Horror Fiction 语义路由回归

2026-09-16；实施基线为本轮实际获取的 `main`：`461c0dcfb2b401dffaa20c5e31dad7ce102ac5ab`。

新增前，`writing` 的 5 个 Public Skills 覆盖清晰编辑、去 AI 味、决策沟通、科普和实操指南，没有负责人物人生、异常结构、意义升级与结尾回响的创作流程。最近邻 Clear Writing / Humanizer 的主要目标是表达编辑，不能通过补触发词承接这一独立目标。因此在现有 Plugin 内新增 `writing/slow-burn-horror-fiction`，不新增 Plugin 或其它小说能力。

先在现有 `semantic-routing-regression.csv` 中写入 SBH001–SBH020 的输入和期望，再按当前 Runtime 的 `list writing`、`skill writing/slow-burn-horror-fiction`、邻接 Skill 正文、`AI_USAGE.md` 与 Composition 规则逐条判定。另复用 7 条历史样本。本轮是当前模型的一次语义一致性审阅，不是自动分类器测试、独立模型运行或小说质量/线上准确率统计；CSV 仍只保存输入和期望。

下表 Skill 名称均属于 `writing/`。`无强制 Skill` 表示直接处理普通创作，当前 Catalog 未实现通用小说 Skill，不为本轮扩展能力。

| ID / bucket | Prompt | Expected | Current decision | Result | 判定依据 |
|---|---|---|---|---|---|
| P049 / regression | 把这份说明写得更清楚、简洁一点，信息不要丢。 | clear-writing | clear-writing | PASS | 说明文本清晰度为主，无恐怖创作目标。 |
| P050 / regression | 帮我润色这段报告，让结构更容易扫读，删掉空话。 | clear-writing | clear-writing | PASS | 报告结构与精简属于编辑。 |
| P053 / regression | 这段文字太像 ChatGPT 了，帮我去 AI 味，事实和观点别改。 | humanizer | humanizer | PASS | 仅处理表达模式，保留事实观点。 |
| P054 / regression | Humanize 这篇文章，让语气更自然，但保留作者原来的声音。 | humanizer | humanizer | PASS | 已有文本的作者声音是主要约束。 |
| P055 / regression | 给非技术读者解释 Transformer 为什么能处理上下文，从直观现象讲到最小模型。 | popular-science-explainer | popular-science-explainer | PASS | 解释真实机制，不虚构异常。 |
| P056 / regression | 写一篇量子隧穿的科普文章，让普通人能理解机制和现实约束。 | popular-science-explainer | popular-science-explainer | PASS | 科普目标清楚，知识主题不触发恐怖创作。 |
| T022 / regression | 这篇科普稿内容已经没问题，只帮我精简 20%，不要重做解释结构。 | clear-writing | clear-writing | PASS | 当前仅编辑，不因已有文体重新启动创作。 |
| SBH001 / positive | 写一个读完以后越想越可怕的恐怖故事 | slow-burn-horror-fiction；正文 | slow-burn-horror-fiction；直接正文 | PASS | description 覆盖后劲表达，输出合同不默认附提纲。 |
| SBH002 / positive | 写一篇慢燃、后劲大的恐怖小说，不要只靠 jump scare | slow-burn-horror-fiction | slow-burn-horror-fiction | PASS | 稳定日常、意义升级与具体显现共同承接目标。 |
| SBH003 / positive | 帮我把这个故事改得更细思极恐，让恐怖进入日常生活 | slow-burn-horror-fiction；结构性重写 | slow-burn-horror-fiction；保留用户限定 | PASS | 需要改恐怖结构与现实接口，非一般措辞编辑；缺原文时适用输入边界。 |
| SBH004 / positive | 写一个存在具体怪物显现、但最终真相无法完全解释的故事 | slow-burn-horror-fiction | slow-burn-horror-fiction | PASS | description 直接覆盖，四层结构区分显现和终极本体。 |
| SBH005 / positive | 先构思一个有后劲的民俗恐怖短篇，只要人物和异常升级，不要正文 | slow-burn-horror-fiction；构思 | slow-burn-horror-fiction；按所要范围构思 | PASS | 构思模式不提前写正文，规则关联人物与经验。 |
| SBH006 / positive | 写一个宇宙尺度的恐怖故事，异常甚至不知道人类存在，读完以后还会害怕 | slow-burn-horror-fiction | slow-burn-horror-fiction | PASS | 手册第 6 节允许无恶意的尺度差，不强制复仇动机。 |
| SBH007 / negative | 帮我把这封邮件写清楚 | clear-writing | clear-writing | PASS | 普通邮件清晰改写由邻接 Skill 承接。 |
| SBH008 / negative | 把这篇文章去掉 AI 味 | humanizer | humanizer | PASS | 没有新创作或结构改造目标。 |
| SBH009 / negative | 写一个普通爱情故事 | 无强制 Skill | 无强制 Skill | PASS | 普通小说不进入恐怖 Skill，也不据此新建通用小说能力。 |
| SBH010 / negative | 解释一下量子纠缠 | popular-science-explainer | popular-science-explainer | PASS | 真实知识解释，不因认知反直觉而变成恐怖叙事。 |
| SBH011 / negative | 把这篇已经完成的恐怖小说去 AI 味，情节、段落和结尾不要重做 | humanizer | humanizer | PASS | 题材不覆盖明确的纯编辑目标；新 Skill 与 Humanizer 边界一致。 |
| SBH012 / composition | 把这个故事改得更有后劲，再去掉 AI 腔，保留那些故意不解释的线索 | slow-burn-horror-fiction + humanizer | slow-burn-horror-fiction 主导，humanizer 后处理 | PASS_COMPOSITION | optional_uses 的条件成立；表达编辑保留未知、必要复现与结尾。 |
| SBH013 / negative | 把这篇恐怖小说里绕口的句子写清楚，只改措辞，不改恐怖结构 | clear-writing | clear-writing | PASS | phase 为 editing；用户已排除结构性重写。 |
| SBH014 / conflict | 独立写一篇后劲大的恐怖小说，另外给我一篇完整的量子纠缠科普文章 | 两个独立主交付物 | slow-burn-horror-fiction 与 popular-science-explainer 各有独立主目标 | PASS_CONFLICT | 不把完整科普稿伪装为恐怖小说的辅助步骤，按 Runtime 主目标规则处理。 |
| SBH015 / multi-turn | 上下文：刚才已确认慢燃恐怖短篇的人物、异常链和结尾回响。当前：继续，直接写正文 | slow-burn-horror-fiction；继承构思 | slow-burn-horror-fiction；正文 | PASS | 继承已确认阶段和保留项，无须重新构思或盘问。 |
| SBH016 / multi-turn | 上下文：恐怖小说已经完成。当前：这轮只去 AI 味，别再增强恐怖或改结尾 | humanizer | humanizer | PASS | 当前目标切换为纯编辑，不沿用上一轮创作主路由。 |
| SBH017 / gate | 上下文：没有提供任何故事原文。当前：把刚才那篇重写得更有后劲，人物和结尾必须保留 | slow-burn-horror-fiction；先取得原文 | slow-burn-horror-fiction；索取缺失原文后重写 | PASS | 唯一主目标明确；输入不足不构成邻居冲突，也不允许编造原文。 |
| SBH018 / adversarial | 写一个关于空椅子和旧照片的普通家庭故事，温馨一点，不要恐怖 | 无强制 Skill | 无强制 Skill | PASS | 现实接口的词面相似不能越过用户明确题材约束。 |
| SBH019 / positive | 写个慢慢让人不敢相信自己记忆的心理恐怖故事，别用全是幻觉收场 | slow-burn-horror-fiction | slow-burn-horror-fiction | PASS | 认知失效与客观残余规则承接，不能用幻觉注销异常。 |
| SBH020 / adversarial | 写一个让我明天刷牙时还会想起来的恐怖短篇，直接给成品，不要提纲和创作解说 | slow-burn-horror-fiction；正文 | slow-burn-horror-fiction；自然段正文 | PASS | 自然表达命中现实接口；内部闭环不会变成默认输出。 |

本轮判定为 25 项 PASS、1 项 PASS_COMPOSITION、1 项 PASS_CONFLICT，未发现所选样本的剩余 ISSUE。不从这些样本推导跨模型触发稳定率或作品必然产生的读者体验。
