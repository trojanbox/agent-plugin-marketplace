---
name: fiction-manuscript-drafting
description: "正式小说正文起草。用于用户明确要求‘开始第一章/继续下一章/按当前章纲写这一章/重写这一章正文’时，以当前 Book / Storybook / 用户材料为权威输入直接生成正式 Manuscript。主流程先执行 Manuscript Readiness Gate；Ready 后恢复当前 Style、已确认 Voice Baseline、相关 Characters / Story / Outline 与上一章正式正文，再成文并做轻量 Character / Continuity / Voice Postflight。高影响决定未收口时停止并返回责任 Owner；不发明通用小说文风，也不把‘更幽默/更紧张/对白更多’等局部反馈扩大成整部作品的 Voice 重置。只想判断‘现在能不能写’时使用 fiction-manuscript-readiness；已有正文只想审文风漂移时使用 fiction-expression-review。"
visibility: workflow
phase: generation
uses: "writing/fiction-manuscript-readiness"
---

# Fiction Manuscript Drafting / 正式正文起草

## 唯一目标

把已经达到 Manuscript Ready 的当前章节写成**服从这一本书自身 Canon 与 Work Voice 的正式正文**，并保证新会话、跨章续写和用户局部反馈不会把已经成立的作品声音重置掉。

本 Skill 拥有“直接开始 / 继续 / 重写正式正文”的主路由。`fiction-manuscript-readiness` 提供前置 Gate；Ready 以后仍由本 Skill 持有最终正文任务语义。

## 触发与邻接边界

以下任务由本 Skill 主导：

- “开始第一章正文。”
- “第一章写完了，继续第二章。”
- “按当前章纲把这一章写出来。”
- “这章重新写，保留现有 Canon / 人物 / 风格。”
- “新开会话了，接着上一章往下写。”

邻接边界：

- 用户只问“现在能不能写 / 还缺什么” → `writing/fiction-manuscript-readiness`；
- 当前章 Outline、关系阶段、信息边界或高影响设计仍缺失 → Readiness 判 `Not Ready` 后停止，并建议 `fiction-outline` / `fiction-discussion` 或对应 Owner；
- 用户已有正文，只要判断 Work Voice 是否漂移 → `writing/fiction-expression-review`；
- 用户只要把现成文本做一般清晰化或去 AI 味编辑，且不承担小说 Canon / 连续性续写 → 对应 general-writing Skill。

## Authority Recovery

1. 先遵循当前项目 / Storybook 自己的 Agent 规则、Book README、Knowledge / Mistakes 与 Directory Contract；
2. 执行 `writing/fiction-manuscript-readiness`；只有 `Ready` 才继续正式成文；
3. 读取当前章 Outline、相关 Characters、Story、Style、必要 World、相邻章 Outline；
4. 续写时读取上一章正式 Manuscript。项目声明 Voice Baseline 时同时读取其指向的**已确认正式正文**；
5. 聊天候选稿、用户否决稿、过期历史正文不能替代当前正式 Manuscript，也不能自动升级成 Voice Baseline。

项目没有 Voice Baseline 时，不擅自创建一套通用 Voice。第一章尚无正式正文可校准时，直接服从当前 Book Style / Characters / Story / Outline。

## Drafting Workflow

### 1. 收缩为本场最小激活集

完成权威恢复后，只把当前场景真正需要持续激活的内容带入成文：

- 章节职责与当前场景行动；
- 人物此刻目标、身体 / 压力 / 现实限制；
- 当前关系阶段与互动权限；
- 当前信息开放 / 禁止边界；
- 上一章必须承接的状态；
- 当前作品 Style 的硬边界；
- 已确认 Voice Baseline 中与本章最相关的少量实现特征。

完整合同继续可查，避免逐条“证明”合同已经执行。

### 2. 有既有正文时先做 Voice Calibration

当任务属于续章、新会话恢复、整章重写，或用户要求增强某个表达维度时，读取 `../../shared/fiction/references/manuscript-drafting.md` 的 Voice Calibration / Feedback Delta 部分。

核心要求：

- 抽象 Style 负责边界，已确认正式正文负责实现级校准；
- 只提取观察方式、场景呼吸、对白摩擦、人物欲望、幽默 / 情绪机制等可复用特征；
- 不复制原句、固定句式、口头禅或表面节奏；
- 用户说“更幽默 / 更紧张 / 更伤感 / 对白多一点”时，在既有 Work Voice 内做增量调整，除非用户明确要求重设 Style。

### 3. 从正在发生的事情成文

- 先让人物继续做眼前的事，再让对白、心理、环境和信息从行动里长出来；
- 允许人物漏接、说多、失败、找补、沉默或换话题，只要符合当前关系和现实条件；
- 不为了满足 Character / Style 标签专门制造示范句；
- 技术 / 世界信息写到足以支撑当前行动和读者理解即可；
- 局部创造性细节可以现场生成，但不能改变高影响 Canon、关系权限和信息释放。

### 4. Postflight 后再交付

完整章节或实质重写完成后，读取 `../../shared/fiction/references/manuscript-drafting.md` 的 Postflight 部分，至少检查：

- Character：人物目标、默认社交姿态、压力路径有没有漂；
- Continuity：身体、物件、位置、关系余波、已知信息有没有跳变；
- Information：有没有作者知情泄漏或提前消费后续真相；
- Voice：和当前 Voice Baseline 对读后，是否仍像同一本书；
- Feedback Delta：本轮“加强某维度”的要求有没有覆盖整体 Work Voice；
- Overexecution：正文有没有变成合同展开、说明文、喜剧小品或其它单一技巧展示。

发现命中时继续修订，不能把已知回归直接交给用户。

## 输出合同

- 默认交付当前请求范围内的完整正式正文；
- 项目要求正文写入特定文件时，遵循项目自己的写入 / Patch / Git 规则；
- `Ready` 只代表可以成文，完成 Draft 后仍不等于 Revision Complete 或 Publication Ready；
- 如果 Readiness 在本轮发现阻塞，输出最小阻塞项和责任 Owner，停止正文生成。

## 停止边界

- 需要临场决定高影响 World / Character / Story / Style → 停止成文并回对应 Owner / `fiction-discussion`；
- 当前章执行态、关系权限、信息边界、Carry-over 不足 → 停止并回 `fiction-outline`；
- 用户主要目标已经切换成“审为什么不像这本书” → `fiction-expression-review`；
- 不因为正文更好写就静默改 Canon，也不因为某本书的成功样章就生成跨作品通用文风。
