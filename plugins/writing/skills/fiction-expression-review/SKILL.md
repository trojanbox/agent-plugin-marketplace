---
name: fiction-expression-review
description: "小说表达审查。检查 Work Voice、POV、叙事距离、角色/旁白 AI 腔、机械对白与风格漂移。适合‘文风有没有漂/越来越像 AI/这几章还像这本书吗’，默认仅诊断。已有小说只要求修遣词、句际衔接和细腻感时转 fiction-prose-editing；用户明确要求审查并修复纯文笔时，可先诊断再条件组合。"
visibility: workflow
phase: verification
optional_uses: "writing/fiction-prose-editing"
---

# 表达审查

## 唯一问题

**这本书现在还像这本书吗？**

先读取 `../../shared/fiction/references/review-contract.md`；有 Storybook 时读取 `style/` 当前合同、必要 Character Voice 与连续正文。项目声明 Voice Baseline 时，必须同时读取其指向的已确认正式 Manuscript；抽象 Style 用于判断边界，正式样本用于判断实现层是否漂移。

## Skill Composition｜纯文笔问题交接

- 用户只要审查时，**不加载编辑 Skill**；先区分 Voice Drift 与单纯汉语语感问题。
- 用户明确要求“审查并修复”且缺陷限于遣词、叙述衔接或细腻感时：先完成本 Skill 诊断与 Protect Set，再加载 writing/fiction-prose-editing 定向修改。高影响 Story / Character 缺陷回 Owner。
- 用户仅要求直接纯文笔润色时，writing/fiction-prose-editing 独立主导，本 Skill 不争主路由。

## 检查

- Work Voice Flattening；
- POV / 叙事距离漂移；
- AI / 客服式精准完整表达；
- 产品说明、后台状态、规格文档语言进入叙述；
- 多轮对话一问一答、机械对称；
- 段落与句式过度均匀；
- 旁白频繁总结“真正的问题 / 终于明白”；
- 已成立的幽默、观察方式、生活感和温度是否消失；
- 与项目 Voice Baseline 对读时，场景运动、对白摩擦、叙述呼吸和情绪 / 幽默机制是否仍像同一本书；
- 用户只要求加强某个表达维度时，是否出现局部反馈覆盖整体 Work Voice 的过度补偿；
- 为了文学感而碎行、金句化、过度修辞；
- 素材库 / 候选句是否覆盖人物自己的声音。

## 作者代言与有效表达保护

正式诊断时先找出当前段落已经成立的 1～2 处人物表达或叙事动作，标为 **Protect**，再判断可能的缺陷：

- 一句对白究竟是人物此刻有理由想说，还是为了替作者精准概括本场主题？人物可以偶尔说得准确，但不能连续把伦理命题当成互相问答的议程。
- 情绪已经由动作、关系和选择被读者理解以后，旁白或角色是否再次解释同一层意思？只对真实重复提出修改。
- 某句更漂亮、更整齐或更克制的替代说法，会不会反而抹掉人物原有的粗糙、虚荣、误解或语气强度？

每个需要修改的结论都应有原文证据与具体阅读代价；不要把“减少作者存在感”当作所有漂亮句子的删除令，不把正常高压爆发审成平静短答。已有明确保护价值的文字，不因审查目标而被顺带重写。

## State-conditioned Voice Gate

不要用“句子长度、话多不多、笑话密度”直接判文风漂移。角色在高压、悲伤、受伤、初见、熟悉、冲突、临终等不同状态下，本来就可能说得更短、更慢、更少幽默。

优先比较**声音生成机制**是否还在：

- 角色为什么开口：虚荣、热心、防御、求生、回避、关系权限等是否仍来自同一人物；
- 作品仍然看什么、先给什么信息、怎样让情绪长出来；
- 在可比较的压力与关系条件下，是否仍接近 Voice Baseline；
- 状态变化结束后，原有表达倾向是否能自然回来，而不是永久被磨成统一客服腔。

如果只是状态合理改变了表层长度 / 幽默强度，判为**人物状态变化**，不要为了“恢复 Voice”把高压场景改回早期轻松说法。真正 Drift 是底层观察、信息顺序、人物欲望和说话机制一起换了。

详细 Work Voice Gate 读取 `../../shared/fiction/references/voice-contract.md`；长区间 Voice Flattening 读取 `revision-methods.md`。

## 边界

可以读取 Character Voice 作为约束，但不重新定义人物 Voice。具体读者认知负担由 `writing/fiction-readability-review` 判断。
