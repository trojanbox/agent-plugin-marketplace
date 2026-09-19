---
name: fiction-story-development
description: "用于已有完整高层故事后的人物、关系、场景与信息深化：把 Story Movements 转成读者可经历的场景组和锚点场景，完善人物深度、关系轨迹、支线、生活世界、信息安排与表达合同。适合‘主线结尾都定了但人物太工具人/帮我把关系做实/哪些场景应该完整写/已有故事骨架继续往下细化/继续【创作】Issue 的深化阶段’。高层故事仍缺起点/终点/关键轨迹时用 fiction-story-architecture；当前要正式正文、续写或场景级重写用 fiction-writing。"
visibility: workflow
phase: development
optional_uses: "github/github-issue-manager"
---

# Fiction Story Development / 中篇小说故事深化

## 唯一目标

把已经成立的高层架构转化成**读者能够具体经历的人物、关系、场景、信息和生活世界**，做到足够可写，但不提前把正文写完。

## 总原则：最小充分深化

只深化到“足以让这一部分进入正文而不失真”。人物已经鲜明时不为了填字段继续挖；场景已经足够支撑关系变化时不为了数量加戏；信息策略已经清楚时不建立复杂矩阵。

持续问：**继续深化这一项，会不会改变正文质量或避免真实问题？**如果不会，停。

## 主流程

1. **确认输入成熟度**：先读取当前故事架构稿。若仍不知道这是什么故事、Story Movements 断裂或终点/作品身份需要重做，回到 `writing/fiction-story-architecture`。
2. **深化人物与关系**：从第一层骨架人格继续，找可观察的驱动力、行为惯性、内部张力、不同关系中的不同面貌，以及真正影响现在的过去。
3. **把 Movement 降到场景组**：问“读者凭什么相信这次变化真的发生了”，识别必须完整戏剧化的锚点场景、关系场景、后果/消化场景、生活场景和可概述过程。
4. **安排信息与世界**：确定谁知道什么、哪些信息何时出现、人物真正会接触哪些制度/生活/时代细节；不写世界百科，不靠作者作弊维持悬念。
5. **评估支线与回响**：支线必须真实影响人物、关系、主线可选空间、主题问题或世界可信度；区分 Setup、Echo、Motif 与单纯 Life Detail，不强制所有细节回收。
6. **形成 Work Voice Contract**：结合第一层身份、Reader Experience、人物与信息策略，形成单部作品的表达合同；需要区分可选的 Author Aesthetic Profile 与当前作品自己的 Work Voice，不能把某一题材或某一本书的表层写法升级成通用作者规则。中篇级、多章节作品进入正式成文前默认读取 `../../shared/fiction/references/voice-contract.md`，按最小充分原则确认 Narrative Lens、人物呈现方式、信息揭示顺序、情绪机制、语言合同、Signature Tendencies 与 Anti-Voice。
7. **停止在场景设计层**：当关键 Movement 已有足够场景支撑，剩余未知主要是动作、对白、正式段落、局部节奏与写作发现时，整理包含 Work Voice Contract 的 Story Development Plan 并移交 `writing/fiction-writing`。

## 每次都要守住的边界

- 不强制完整人物卡、人物弧、场景类型配额、支线数量、Scene List 或 Chapter Map。
- 安静场景可以承担消化、陪伴、恢复、生活和关系重校，不要求每场都冲突升级。
- POV 人物明明知道且自然会想到的信息不能只为骗读者而扣住；人物隐瞒必须有动机。
- 如果第二层发现必须改变 Story Movement、核心人物、作品身份、时间范围、终点等高层设计，先回 Architecture 重审，不能在场景层静默改合同。
- Author Aesthetic Profile 只能作为兼容偏好输入；与当前作品身份、POV、Genre、人物或 Reader Experience 冲突时，当前作品优先。

## 按需读取

- 人物与关系需要进一步深化时读取 `references/character-relationships.md`。
- 场景、信息、支线、生活世界和章节选择需要细化时读取 `references/scenes-information-world.md`。
- 形成、重审或冻结作品表达合同时读取 [Author Aesthetic Profile 与 Work Voice Contract](../../shared/fiction/references/voice-contract.md)；多章节作品进入 Writing 前默认触发，简单短篇可轻量处理。
- 当前作品需要类型知识时读取 [Genre 索引](../../shared/fiction/genres/index.md)，只加载当前作品真正需要的类型 reference。
- 用户要求 GitHub 持久化时读取 [创作 Issue 工作流](../../shared/fiction/references/creative-issue-workflow.md)。

## Skill Composition / 能力组合

用户明确要求更新【创作】Issue 时组合 `github/github-issue-manager`；本 Skill 决定创作内容，Issue 能力只负责真实持久化。用户明确 chat-only 时不调用远端。

## 停止边界

- 高层架构需要重新决定 → 回 Architecture。
- 已经开始写完整对白、正式叙述或句子级润色 → 停止设计并进入 Writing。
- 用户当前只要求已有文本去 AI 味/清晰改写 → 不抢编辑类 Skill。
