# Runtime Boundaries

## 何时由本 Skill 主路由

用户的主要交付物是可看、可比较、可演示或可交互的设计：页面、App screen、prototype、wireframe、deck、视觉文档、动画、3D、营销视觉等。

## 邻域边界

- `data/data-visualization`：用户主要问“这些数据该怎么画 / 图是否误导 / 给我生成趋势图”时为主；Dashboard UI 或产品图表容器设计由本 Skill 为主。
- `research/*`：用户主要要事实、证据、市场调研时为主；“调研后做投资人 deck”若最终目标明确是 deck，可由本 Skill 为主并组合 Research。
- `writing/*`：纯邮件、报告正文、润色由 Writing 为主；排版成视觉页面/演示稿且视觉层是核心时进入本 Skill。
- `development/*`：把设计实现进真实生产代码库、修源码或提交 PR 属于 Development；本 Skill 可先产出设计稿/交互原型作为输入。
- `design/design-system-authoring`：创建或导入 tokens/components/UI Kit/design system 时由它主路由；消费已有 Design System 做普通页面仍由本 Skill 主路由。

## 冲突

若用户同时要求“建立完整 Design System”与“独立设计一套无从属关系的产品原型”，这是两个可独立验收的主目标，应拆成两个主 Skill 任务，不靠 `optional_uses` 隐藏第二个目标。
