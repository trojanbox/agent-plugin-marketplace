---
name: anki-deck-builder
description: "把用户提供的 Markdown/纯文本或当前对话中已讨论的知识制作成可导入 Anki 的 .apkg 卡包与 cards.json。用户说“把刚才聊的知识做成卡片/把笔记做成 Anki 卡包”时使用；须先展示全部候选卡供用户审核，明确确认后才打包。互动问答教学归 learning-coach；不连接 Anki、不同步、不提供复习调度。"
visibility: workflow
phase: creation
optional_uses: "research/deep-research"
---

# Anki Deck Builder / 审核制卡与独立卡包

## 唯一目标和边界

从**真实可访问**的 Markdown/纯文本资料，或最近一个独立知识话题的当前会话内容，提炼有价值的知识，经过用户逐批审核并明确确认后，独立生成可导入 Anki 的 **.apkg + cards.json**。

- 用户主动要求制卡即可启动；充分讨论完知识话题时，可以**最多主动建议一次**，拒绝后不重复劝说，也不擅自开始制卡。正常追问时不要打断。
- “陪我练题、根据我的回答教我”属于 `education/learning-coach`；“把刚才学习的知识做成卡包”由本 Skill 负责。教师课案与家庭教育建议不被本 Skill 接管。
- 本 Skill 不实现 EPUB/PDF 原生解析、AnkiConnect、MCP/服务器、同步、复习算法、后台监听、OCR、音频合成和图片遮挡。如果其他工具已把 PDF/EPUB 转成文本，可以将**真实提取的文本**作为输入；不能冒充已读取原文件。
- 不假设可访问整个历史对话：只取当前可见的最近独立主题；遇上下文缺失则标明范围，必要时索取被遗漏的相关材料。
- 不自动保存私人聊天、儿童信息或学习历史，不夸大事实核查结果；真实工具和宿主规则优先。

## 工作流

1. **确定输入与主题**：阅读用户提供的 Markdown/纯文本，或识别当前可访问对话中的最近一个独立知识主题。用户指定范围或牌组名称时优先遵守；默认单个主题一副独立牌组，细分用标签，不擅自创建层级牌组。
2. **形成候选卡片**：阅读 `references/card-quality.md`，提取核心概念、因果、重要对比和可迁移应用。删除重复、低价值或来源不足的知识。Basic 是默认卡型；只有适合精确回忆时用 Cloze，真正双向对应时才用 Reversed。卡片正面要独立、单一回忆点，简短准确；补充说明和来源只在背面。
3. **针对性证据核查**：默认依据资料和会话，不把其中的主张自动当成外部验证的事实。发现关键争议、时效性或疑似错误时，在具备相应工具且确有必要时可加载 `research/deep-research`，核查并区分**原资料主张、核查结果、推测**；无法确认的重要知识不得作为确定性卡片。核查不可用时标注不确定性并暂停该卡制包。
4. **先审后出**：逐张展示候选卡的固定编号（如 C001）、卡型、正面、背面、补充说明、真实来源、必要的证据状态与标签；卡片多时**按章节/主题分批完整展示**，不能只展示摘要或抽样。按用户意见增删改、保持编号不重排、复检并重新展示修改。**所有批次审核完成且用户明确确认最终内容之前，绝不构建 APKG。** 实际操作细则按需读取 `references/review-and-export.md`。
5. **转换为确定性数据**：用 `schemas/cards.schema.json` 的结构创建 `cards.json`，必须使用稳定 `deck_id` 和每条笔记独立 `id`。一条 JSON 卡片是一个 Anki 笔记：Reversed 会生成两张复习卡；Cloze 按独立 cN 编号生成复习卡。不要把“笔记数”冒充“复习卡数”。
6. **生成与验证**：仅在用户明确确认后，使用 `scripts/build_deck.py` 输出 APKG，继而使用 `scripts/validate_deck.py` 独立校验数据库内容、笔记 GUID 和卡片数量。**不注入任何自定义 CSS 或行内样式，不规定字体、字号、颜色、背景、行距、对齐方式；让 Anki 客户端自身控制日间/夜间主题。**真实通过才交付两个文件。失败时明确失败点，不声称成功或吞错重试。
7. **后续修订**：必须读取原始 `cards.json`，保持 `deck_id`、已有笔记 `id` 与卡型不变；新知识分配新 ID，旧 ID 不复用。使用 `--previous` 对照旧 JSON。**重新导入 APKG 不会自动删除 Anki 中原有的旧卡**，换卡型也可能无法在导入时按预期更新；任何身份变化必须明确告知。

## 执行命令（实际生成时使用）

从 Skill 根目录运行，Python 3.10+：

```bash
python3 -m pip install -r scripts/requirements.txt
python3 scripts/build_deck.py /path/to/cards.json --output /path/to/deck.apkg
python3 scripts/validate_deck.py /path/to/deck.apkg --source /path/to/cards.json
```

更新已有卡包时加 `--previous /path/to/old-cards.json`；如需覆盖已存在的输出文件，构建脚本要求显式提供 `--force`。依赖仅用于打包，**不需要启动 Anki 桌面版**。

`cards.json` 建议字段：`deck_id`（长期稳定 ASCII ID）、`deck_name`（展示名称）、`cards[]`；每条含 `id/type/front/back/source`，可含 `extra/tags/evidence`。Cloze 在 `front` 中写 `{{c1::内容}}`，不同编号形成独立复习卡；`back` 用于解释。来源至少包含 `kind`（material/conversation）和 `title`，有实际章节/标题才写 `locator`；重要疑点的 `evidence.status=uncertain` 必须在构建前排除或查明，打包器会拒绝。

## Skill Composition / 条件研究与停止边界

- `optional_uses: research/deep-research` 只在制卡候选包含重要、时效性或疑似错误的事实且现有材料不足时加载。Research 提供证据，Anki Builder 保留知识筛选、用户审核及 APKG 交付所有权。
- 普通资料提炼与对话总结无需调用 Research；遇到无法真实检索的来源时明示限制。若用户要求继续教学练习，应切换到 `education/learning-coach`，不把交付卡包当成掌握知识的证明。

## 完成/停止条件

- 最终交付 **APKG 文件 + 对应 JSON**，并告知牌组名称、笔记数、实际复习卡数、跳过和仍存疑的内容。
- 资料不可读取、对话历史缺失时不编造来源；AI 无法确认事实时不把疑点编成确定性知识；用户未最终确认时保持草稿状态；本地缺少打包依赖或测试失败时报告真实阻碍。
- 不承诺导入后自动同步、自动删除、保留所有复习进度或解决既有卡冲突。Anki 更新效果受已有笔记、导入设置和笔记类型等条件约束。
