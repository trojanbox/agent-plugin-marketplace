# 【创作·讨论】决策循环

正式多轮讨论、需要跨会话恢复、或当前问题涉及多个 Owner / 多个依赖决策时读取。

## 1. Current Creative State

先建立可验证当前状态：

- 用户当前明确要求；
- Storybook 当前权威文件；
- 相关 Manuscript，以及存在时仍有效的近期 Planning；
- 当前仍有效的历史决定；
- 当前问题的具体文本证据。

区分状态：`fact / decision / inference / candidate / deferred / non-goal / creative_open / superseded / conflict`。

## 2. Q-xxx 决策树

每个问题写清：

- 当前问题；
- 为什么会阻塞当前 Scope；
- 依赖哪些已确认决定；
- 哪些后续节点会受影响；
- 用户是否需要参与。

优先顺序：冲突 > 因果断链 > 人物/关系关键缺口 > 信息/POV/Style 高影响边界 > 局部呈现。

## 3. D-xxx 决定

建议字段：

```text
D-xxx
状态：confirmed / deferred / creative_open / superseded
用户选择：
理由：
主 Owner：
传播影响：
边界 / 非目标：
仍未决：
来源：
depends_on：
supersedes：
```

不要把 AI 推荐写成用户确认。

## 4. Owner 路由

- World：世界自身怎样运行；
- Characters：这个人是谁、通常怎样想/反应/说话；
- Story：这些人经历什么、为什么从开始走到结束；
- Style：这本书怎样被写出来；
- Manuscript：正式成文；
- Planning / Outline：可选的近期章节投影，不拥有长期 Canon。

问题可以传播到多个 Owner，但只能有一个主要 Owner；其它 Owner 只记录传播影响。

## 5. 收口 Gate

结束一轮前检查：

- Scope / 非目标清楚；
- 高影响决策树已覆盖；
- 当前 Scope 没有未处理 structural unknown；
- 待决项均为 deferred / creative_open / blocked；
- Current Creative State 与 Target Creative Direction 清楚；
- 主 Owner 与传播范围清楚；
- 需要持久化时已经知道后续写回位置。

状态：

- `discussion_in_progress`
- `ready_for_creative_conclusion`
- `discussion_complete`：当前聊天目的已达到且不需要持久化结论
- `blocked`
