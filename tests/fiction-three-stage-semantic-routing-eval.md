# 通用小说三层 Skill：人工语义路由 Eval

日期：2026-09-18。基于已确认的三层 Current Spec 先冻结 FIC001–FIC045 预期，再逐条对照新的 Skill description、phase、邻居边界与 composition。本文是一次当前规则的人工语义一致性证据，不是自动分类器准确率或未来模型稳定率。

## 路由边界

| 路由 | 主目标 | 最近邻边界 |
|---|---|---|
| `writing/fiction-story-architecture` | 高层作品身份、人物关系、Story Movements、终点与全局架构 | 高层故事已成立且主要补人物/场景/信息 → Development |
| `writing/fiction-story-development` | 人物、关系、场景组、信息、支线、世界与表达合同 | 当前主要交付是正式 prose → Writing |
| `writing/fiction-writing` | 正式小说正文、续写、场景级重写、已授权结构重写 | 只改清晰措辞 → clear-writing；只去 AI 味 → humanizer |

## FIC001–FIC045

| ID | Prompt 摘要 | 当前选择 | 结果 |
|---|---|---|---|
| FIC001 | 我想写一个县城重逢的爱情中篇，先陪我把故事从头搭起来 | writing/fiction-story-architecture；从创作种子搭高层故事架构 | PASS |
| FIC002 | 我只知道最后女儿会签字停止父亲治疗，前面都没想好 | writing/fiction-story-architecture；从终点反推完整轨迹 | PASS |
| FIC003 | 一个老太太每天给死去二十年的丈夫做饭，我还不知道它最后是温情还是恐怖，先聊故事 | writing/fiction-story-architecture；允许 Genre 在第一层过程中逐渐确定 | PASS |
| FIC004 | 主线开头结尾都定了，但人物太工具人，帮我把人物和关系做扎实 | writing/fiction-story-development；高层故事已成立，深化人物关系 | PASS |
| FIC005 | 故事已经从头到尾讲得清楚了，帮我规划哪些场景必须完整写出来 | writing/fiction-story-development；Movement 展开为场景组和锚点场景 | PASS |
| FIC006 | 这是完整大纲和人物设定，直接开始写第一章，不要重新问我 | writing/fiction-writing；继承现有创作合同直接成文 | PASS |
| FIC007 | 给我直接写一篇成年人重逢的现实主义爱情中篇，温暖一点，别悬疑，人物细节你自己定 | writing/fiction-writing；授权范围内内部完成轻量 Architecture/Development 后成文 | PASS |
| FIC008 | 写个1500字左右短篇，题材我已经说清楚了，直接给成品 | writing/fiction-writing；短篇轻量直写，不强制完整前两层 | PASS |
| FIC009 | 继续上次【创作】Issue，故事骨架已经定了，这次把人物和场景往下做 | writing/fiction-story-development + github/github-issue-manager；读取当前共识后续接深化 | PASS |
| FIC010 | 继续这个小说，方向都定了，接着写下一章 | writing/fiction-writing；继承既有合同继续成文 | PASS |
| FIC011 | 上下文：刚才只确定了一个养老院场景和主角职业。当前：继续把这本中篇的故事架起来 | writing/fiction-story-architecture；高层轨迹仍未成立 | PASS |
| FIC012 | 上下文：起点终点和关键状态变化都已经定了。当前：继续完善这个故事 | writing/fiction-story-development；按材料成熟度判断“完善故事”阶段 | PASS |
| FIC013 | 上下文：人物、关系、场景组和表达合同已经确定。当前：现在开始写 | writing/fiction-writing；按阶段顺序进入成文，不重问 | PASS |
| FIC014 | 先陪我讨论这个故事，即使今天聊完整了也不要写正文 | writing/fiction-story-architecture 或 development 依材料成熟度；尊重仅讨论边界，不自动成文 | PASS |
| FIC015 | 故事方向已经确定，但我还没让你开始写，先把当前共识给我看 | writing/fiction-story-architecture/development 当前阶段；不把准备充分当正文授权 | PASS |
| FIC016 | 帮我完善这个故事 | 按当前材料成熟度：高层故事缺失→writing/fiction-story-architecture；高层已成立→writing/fiction-story-development | PASS |
| FIC017 | 我想写个家庭故事，但先别逼我定到底是温情、悬疑还是恐怖 | writing/fiction-story-architecture；Genre 可渐进收敛，不第一轮强贴标签 | PASS |
| FIC018 | 写爱情故事，别恐怖，最后给我一点惊喜 | writing/fiction-writing 或前置阶段按成熟度；“惊喜”不得覆盖明确爱情 Genre/禁区 | PASS |
| FIC019 | 给我一个十万字目标，不够就多加几条支线 | writing/fiction-story-architecture；体量用于架构匹配，不为数字灌水 | PASS |
| FIC020 | 每个人都按 Want Need Ghost Lie 给我填完整，越全越好 | writing/fiction-story-development；人物深度按需，不把固定人物卡当必填合同 | PASS |
| FIC021 | 先聊清楚这个小说并记录到 GitHub，骨架定了以后再继续深化 | writing/fiction-story-architecture → writing/fiction-story-development + github/github-issue-manager；同一【创作】Issue 持久化 | PASS |
| FIC022 | 先把人物场景深化好，然后写全文，写完再去 AI 味 | writing/fiction-story-development → writing/fiction-writing + writing/humanizer；按依赖阶段推进 | PASS |
| FIC023 | 这是完整大纲，直接写成心理恐怖小说，写完再去 AI 味 | writing/fiction-writing + writing/humanizer；按需加载 psychological-horror genre knowledge | PASS |
| FIC024 | 我们慢慢聊这个故事并持续记录，但只在聊天里，不要建 Issue | writing/fiction-story-architecture/development；尊重 chat-only，不组合 github | PASS |
| FIC025 | 把当前创作共识写回【创作】Issue，但这轮先别写正文 | 当前 fiction-story-architecture/development 主导 + github/github-issue-manager；Issue 是持久化步骤 | PASS |
| FIC026 | 帮我把这封邮件写清楚 | writing/clear-writing；小说三层不抢普通清晰编辑 | PASS |
| FIC027 | 把这篇已经定稿的小说去掉 AI 味，人物结构结尾都别动 | writing/humanizer；纯表达后处理不进入 fiction-writing | PASS |
| FIC028 | 只把这段小说里绕口的句子改清楚，剧情别动 | writing/clear-writing；纯措辞编辑 | PASS |
| FIC029 | 解释一下量子纠缠 | writing/popular-science-explainer；不进入小说流程 | PASS |
| FIC030 | 讨论一下小说发布系统的权限架构并记录到 Issue | development/github-discussion-facilitator；软件架构讨论不因“小说”误路由 | PASS |
| FIC031 | 小说已经写完，标题正文都不用改，只帮我存成 GitHub Issue | github/github-issue-manager；当前唯一交付是 Issue 生命周期操作 | PASS |
| FIC032 | 给我十个爱情故事点子，一次性列出来就行，不要和我讨论 | writing/fiction-story-architecture；一次性高层构思可轻量完成，不强制多轮 | PASS |
| FIC033 | 写一段产品发布会开场白 | 不强制小说 Skills；按实际写作/沟通目标路由 | PASS |
| FIC034 | 独立写一篇小说成品，另外给我一篇完整量子纠缠科普文章 | 两个独立主交付物：writing/fiction-writing 与 writing/popular-science-explainer；识别冲突 | PASS |
| FIC035 | 帮我设计这本小说的完整故事，另外独立和我辩论“AI会不会取代作家” | 两个独立主交付物：writing/fiction-story-architecture 与 reasoning/structured-debate；确认当前主目标 | PASS |
| FIC036 | 上下文：原来定的是现实爱情。当前：我改主意了，整体改成心理恐怖 | writing/fiction-story-architecture；作品身份高影响变化，重审高层结构 | PASS |
| FIC037 | 上下文：正在讨论故事骨架。当前：这个方向先停，这轮只给另一篇成稿去 AI 味 | writing/humanizer；当前明确编辑目标覆盖历史创作主路由 | PASS |
| FIC038 | 上下文：故事架构和深化都完成。当前：我自己改了一个大结局，帮我按新结局重写 | writing/fiction-story-architecture/development 先校验受影响设计 → writing/fiction-writing；高影响变更顺序执行 | PASS |
| FIC039 | 上下文：这篇成稿中段很散。当前：人物和结尾保留，我们先讨论怎么重构 | writing/fiction-story-architecture/development；先重新设计结构，不直接改 prose | PASS |
| FIC040 | 上下文：这篇成稿中段很散。当前：人物和结尾保留，结构你自己定，直接给新版别再问 | writing/fiction-story-architecture/development → writing/fiction-writing；用户已委托结构决策，不额外确认 | PASS |
| FIC041 | 这是爱情+科幻，爱情是主线，科幻只提供环境压力，主线已定，帮我深化两个人的关系 | writing/fiction-story-development；保持类型主次，按需加载类型知识 | PASS |
| FIC042 | 我想写心理恐怖，但不要慢燃，也可以第一章就出事，先把高层故事聊出来 | writing/fiction-story-architecture；按需加载 psychological-horror knowledge，不套 slow-burn | PASS |
| FIC043 | 故事和人物都定了，帮我把心理恐怖的场景和信息安排做实，但别开始写 | writing/fiction-story-development；按需加载 psychological-horror knowledge，停在场景/信息设计 | PASS |
| FIC044 | 按已经确定的心理恐怖大纲直接写，结局可以解释完整，不要擅自留神秘尾巴 | writing/fiction-writing；Genre knowledge 服从作品合同，不强制未知本体/开放结局 | PASS |
| FIC045 | 这是普通家庭小说，里面有人精神状态很复杂，但不要恐怖 | 按成熟度进入通用小说三层；不得仅因心理复杂加载心理恐怖为作品方向 | PASS |

## 结论

- “完善故事”由材料成熟度判 Architecture / Development，不靠关键词抢路由。
- “直接写、剩下你定”由 Writing 主导，并在用户授权范围内内部完成轻量前置规划。
- 结构性重写若改变高层合同，能力顺序为 Architecture/Development → Writing；是否再次询问用户由真实授权决定。
- Genre knowledge 作为 shared 按需加载，不创建一批与三层主流程争路由的 Public Skill。
- chat-only、纯措辞编辑、纯去 AI 味、纯 Issue 持久化均保留明确邻居边界。
- 当前 45 条样本未发现语义所有权冲突；实现后仍需结合 Runtime `doctor`、自动测试和生成 manifest 重新验证。
