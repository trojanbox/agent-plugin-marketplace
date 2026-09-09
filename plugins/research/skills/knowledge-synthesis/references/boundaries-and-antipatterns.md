# Knowledge Synthesis 边界与反模式

与 Deep/Community Research 或 Product Context 边界不清，或最终质量检查时读取。

# 与其他 Skill 的边界

## Deep Research

用户需要继续寻找外部权威来源、数据、论文、报告或多类型证据时使用 `research/deep-research`。

## Community Research

核心问题是“最近社区怎么评价 / 实际用户怎么用 / 最近讨论什么”时使用 `research/community-research`。

## Product Marketing Context

用户要把已经确认的产品、ICP、定位和营销事实长期固化时使用 `business/product-marketing-context`。

当前 Runtime 没有自动 Skill dependency。Knowledge Synthesis 可以消费这些 Skill 已经产生的材料，但不要假装系统会自动串联。

---

# Anti-Patterns

避免：

- 按来源逐个复述而不综合；
- 把转载次数当成多重独立证明；
- 只保留最新材料，抹掉重要历史演进；
- 遇到冲突就挑一个来源静默覆盖；
- 把计划、讨论稿、草案写成已完成事实；
- 对 source-bounded 任务偷偷联网或用常识补空白；
- 为了简洁删掉会改变用户判断的 caveat；
- 给所有 Claim 机械套统一的来源权威等级；
- 给主观置信度制造毫无依据的精确百分比；
- 只列一堆 Sources，却无法知道每个核心结论由什么支持。

---

## 上游来源

本 Skill 参考并改造自 Anthropic `knowledge-work-plugins` 中的 `enterprise-search/skills/knowledge-synthesis`；适配说明与许可由主 `SKILL.md` 指定的 upstream 记录维护。
