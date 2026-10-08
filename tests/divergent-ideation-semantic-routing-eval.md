# Divergent Ideation / Reasoning 语义路由回归（首版）

2026-10-08。对新 Skill frontmatter、`reasoning` Plugin description、`SKILL_COMPOSITION.md` 与相邻 Writing/Reasoning/Development/Research Skill 职责进行**单次人工语义判读**。下表记录的是当前规则能否明确给出预期 Owner；这是规则一致性评估，没有运行独立的模型分类器，不能作为实际命中率统计。

独立目标判断：`reasoning/scientific-reasoning` 为真实机制与证据推理，`writing/fiction-discussion` 为选定作品的创作决策；它们不能稳定承担“持续输出跨领域、未定稿的奇想候选并依据好奇心反馈变异”这一独立任务。因此增加 `divergent-ideation`，并明确前后阶段边界。

| ID / bucket | 用户自然表达（摘录） | 期望主 Skill / 阶段 | 当前判读 | 状态 |
| --- | --- | --- | --- | --- |
| DI001 positive | 今天有什么疯狂的想法？完全不限题材。 | divergent-ideation | 未限定则广域爆破 | PASS |
| DI002 positive | 我的脑洞不够大，给我十二个让人意想不到的设定。 | divergent-ideation | 种子级多候选 | PASS |
| DI003 positive | 别老是克苏鲁和末日，我想看看温柔、荒诞、好玩、奇观类的创意。 | divergent-ideation | 尊重反套路/情绪限制 | PASS |
| DI004 positive | 从日常生活里找点疯狂的规则，先别设计人物和剧情。 | divergent-ideation | 不进入小说决策 | PASS |
| DI005 positive | 想一些前所未见的游戏机制，不用考虑怎么开发。 | divergent-ideation | 只做机制种子，不声称真正首创 | PASS |
| DI006 positive | 假如城市会自己迁徙，这个点子还能往哪些奇怪方向长？ | divergent-ideation | 单点深挖 | PASS |
| DI007 multi-turn | 刚才十个都很普通，再来一轮，别只是换个名字。 | divergent-ideation | 切换底层生成算子 | PASS |
| DI008 multi-turn | 我最喜欢第七个，先只给几个完全不同的延伸方向。 | divergent-ideation | 原设定不静默改写 | PASS |
| DI009 negative | 帮我把已经确定的小说人物、主线和结局设计完整。 | writing/fiction-discussion | Canon 决策 Owner 仍是 Writing | PASS |
| DI010 negative | 这个小说世界观定了，现在写第一章正文。 | writing/fiction-manuscript-drafting | 正文请求不命中发散 | PASS |
| DI011 negative | 这件现实中的事到底为什么发生？给我竞争假设和证伪条件。 | scientific-reasoning | 证据与机制求解 | PASS |
| DI012 negative | 你来和我辩一辩这个观点，逐条攻击我的论据。 | structured-debate | 明确命题逐轮攻防 | PASS |
| DI013 negative | 我想把这个新产品实现出来，先检查当前源码和需求边界。 | development/github-research-document-generator | 源码事实与需求边界 | PASS |
| DI014 negative | 新增一个头脑风暴 Skill，完成后运行 doctor。 | ai-workflow/skill-system-design | Skill 元数据维护 | PASS |
| DI015 negative | 我这个设定是不是跟现有小说撞梗？检索对比并给来源。 | research/deep-research | 真实外部作品核查 | PASS |
| DI016 composition | 先出十个游戏脑洞，我选好一个以后再讨论产品可行性。 | divergent-ideation 当前阶段 → 下游决策 | 当前只交种子，不自动开始可行性评估 | PASS_SEQUENCE |
| DI017 sequence | 先生成十个不同小说脑洞，再以我选的那个开展完整世界观讨论。 | divergent-ideation → writing/fiction-discussion | 选择前发散，选择后讨论 | PASS_SEQUENCE |
| DI018 adversarial | 提供十个脑洞，也要完整写出其中每个的主线、人物和结局。 | 两个独立交付物/阶段需要明确 | 创意种子与十份完整创作规划不同阶段 | PASS_CONFLICT |
| DI019 conflict | 独立给我一份疯狂脑洞清单，再独立写一份人口老龄化科学机制报告。 | divergent-ideation 与 scientific-reasoning 两主目标 | 不包装成可选依赖 | PASS_CONFLICT |
| DI020 gate | 我只想玩点疯狂设定，别上来给我做市场调研和可行性分析。 | divergent-ideation | 不提前审查或规划 | PASS |
| DI021 positive | 给我一些完全不涉及小说的艺术装置奇想。 | divergent-ideation | 横跨艺术形态 | PASS |
| DI022 negative | 这个设定逻辑上有漏洞，我们要正式修订书里的既有 Canon。 | writing/fiction-discussion | 作品内部结构修订 | PASS |
| DI023 adversarial | 我想造一种不存在的社会制度，先随便脑暴，不讨论政治可行性。 | divergent-ideation | 虚构制度规则，无事实声称 | PASS |
| DI024 multi-turn | 第七个有意思，但不要阴谋和调查者，把它改成日常生活型的。 | divergent-ideation | 延续种子并尊重排除项 | PASS |

## 生成质量烟测（人工检查标准）

- **广域**：无题材时，先输出 10–12 个种子；领域、情绪与核心机制都必须具有明显差异。若出现十个“有人发现秘密/某组织阴谋”结构，即使路由正确也判内容失败。
- **深挖**：对选定种子产出 3–5 个具有第二阶后果的分支；不自动写主人公、终局和真相揭秘。
- **负反馈**：用户明确排除恐怖、意识上传、时间循环或阴谋时，后续批次应改变材料和因果发动机。
- **真实性**：从零想象不能自动声明“从来没人写过”；若用户要求查证撞梗，切换实际检索阶段。

上述生成质量标准目前属于**待在真实用户对话中验证的验收准则**，不记作已执行的模型输出测试。下一轮应保留用户真实评分、最喜欢与最不喜欢的候选、被否定的底层机制，并据此调整生成规则。
