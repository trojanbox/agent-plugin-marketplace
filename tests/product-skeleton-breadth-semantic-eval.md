# 所有新产品广度优先：语义路由与阶段 Gate 回归

## 本轮根因与范围

- **根因**：`WORKFLOW_GAP / PHASE_GATE_GAP`。现有 Product 规划/讨论流程在整体模块边界尚未确认时允许对单模块连续取舍，存在跨模块反复推翻风险。
- **修改面**：`product/product-planning` 的全局骨架规划与 `product/product-new-product-discussion` 的新产品讨论 Gate；原稳定 `product/product-discussion` 保持已有产品迭代。共享骨架合同和统一 Q/D 决策方法；新增一个公开 Skill，不改变 GitHub 授权。
- **真实性声明**：**没有调用独立模型批量路由器**。以下为当前模型按实际已加载规则逐条人工判断的语义一致性复核；不报告模型路由准确率或多次运行成功率。结构测试与 Runtime doctor 独立执行并记录其结果。

新产品正式讨论阶段继承 `skeleton_draft → skeleton_review → skeleton_confirmed`，骨架整体审查未通过前保持 `skeleton_review`，直到得到用户整体确认。

## 骨架与邻居语义回归（2026-10-31，拆分后重新评估）

| 编号 | 用户意图（摘要） | 路由结果 | 状态 |
| --- | --- | --- | --- |
| PRD-SK001 | 我想从零构思企业内部AI平台，先给出全局模块和系统关系，暂时不要细化… | product/product-planning | PASS |
| PRD-SK002 | 我们要做一个连好几个外部服务的新产品，先把产品包含哪些模块画明白。 | product/product-planning | PASS |
| PRD-SK003 | 新产品的本地版云端版和插件能力都有，先核对全局职责分工。 | product/product-planning | PASS |
| PRD-SK004 | 上轮产品讨论一直在细化插件，先回到模块骨架和整体边界，我们已经有讨论… | product/product-new-product-discussion | PASS |
| PRD-SK005 | Q-010的局部选择先保留，当前重新盘点所有模块和依赖，骨架还没整体… | product/product-new-product-discussion | PASS |
| PRD-SK006 | 我只做一个单功能倒计时小工具，规划第一版就行。 | product/product-planning | PASS |
| PRD-SK007 | 已有管理台只有设置页操作很别扭，帮我审查可用性。 | product/product-experience-review | PASS |
| PRD-SK008 | 按现有仓库源码追踪模块A到模块B的API和事务实现。 | development/github-research-document-generator | PASS |
| PRD-SK009 | 把这轮新产品整体骨架和未决边界写入已经创建的产品讨论Issue。 | product/product-new-product-discussion | PASS_COMPOSITION |
| PRD-SK010 | 骨架的外部连接还没弄清楚，先帮我把插件里每个授权弹窗都定案。 | product/product-new-product-discussion | PASS |
| PRD-SK011 | 还没确认模块边界，就要你生成一份全产品正式PRD。 | product/product-conclusion → product-new-product-discussion | PASS_SEQUENCE |
| PRD-SK012 | 全局骨架用户已经确认，现在讨论插件如何显示一个表单。 | product/product-new-product-discussion | PASS |
| PRD-SK013 | 同时做一份完整产品骨架方案和独立的数据库及API技术结论，顺序未定。 | conflict | PASS_CONFLICT |
| PRD-SK014 | 我们新产品的骨架已确认，但增加跨模块能力会修改责任归属，先核对影响。 | product/product-new-product-discussion | PASS |
| PRD-SK015 | 按照产品骨架直接开发分布式调度器，写代码测试并提交。 | development/github-discussion-facilitator | PASS |
| PRD-SK016 | 设计企业平台的能力边界和外部系统如何交互，只要高层产品骨架不需要技术… | product/product-planning | PASS |
| PRD-SK017 | 想做个很简单的提醒产品，先把整个功能骨架列出来。 | product/product-planning | PASS |

## 旧回归和边界

- 继续保留 `tests/product-semantic-routing-cases.csv` 的全部既有样本，新增 PRD-SK001～017；新产品讨论类样例的预期入口已随拆分迁移到 product-new-product-discussion，已有产品及其它领域的期望主路由继续保留。
- `PRD001/PRD002` 仍由 planning 承接；`PRD004/PRD031` 的已有产品表达仍由原 discussion 承接，新产品正式讨论按新的入口承接；`PRD023/PRD040` 真实双主目标或未知归属仍识别冲突；`PRD029` 新产品缺源码可基于用户材料做规划；`PRD027` 产品结论只能评估就绪，未授权不创建。
- 骨架 Gate 面向所有新产品和整体重规划；新产品正式讨论与已有产品局部讨论已拆开；简单单功能产品采用极简骨架；已有骨架的局部需求只检查影响范围。

## 验证局限

此报告确认文字路由合同的内部一致性，不能证明未来宿主中的每次自动路由或实际产品骨架质量。后续真实使用发现反例时保留原始输入，补回归样本。
