---
name: visual-artifact-design
description: "用于设计和交付视觉产物：高保真 UI、可点击原型、线框图、落地页、Dashboard、移动端界面、演示稿、视觉文档、动画或其他 HTML 设计稿。以用户要看到、比较、演示或交互的视觉结果为主目标时使用；若主要目标是数据图、研究、纯文本或生产代码实现，交给对应领域 Skill。"
visibility: workflow
phase: presentation
optional_uses: "research/deep-research,research/knowledge-synthesis,data/data-visualization"
---

# Visual Artifact Design

## 目标

把需求转成可审阅、可迭代、可交互的视觉设计产物。设计方法、项目类型路由、starter components 与确定性脚本来自固定版本的 `baoyu-design` 上游；本 Skill 只负责 Runtime 主路由、领域边界与宿主适配。

## Upstream Gate

上游固定在 `vendor/baoyu-design/UPSTREAM.json` 指定的 commit。执行设计任务前：

1. 检查 `vendor/baoyu-design/upstream/system-prompt.md` 与 `project-types.json` 是否存在；
2. 缺失时运行 `node vendor/baoyu-design/materialize-upstream.mjs`；
3. 若当前宿主无网络且尚未 hydrate，明确说明缺少固定上游源码，停止依赖上游细节的设计执行，不猜造缺失规则；
4. 已 hydrate 时读取 `vendor/baoyu-design/upstream/system-prompt.md`，再按 `project-types.json` 只加载本次需要的 `built-in-skills/*.md` 与 starter component。

不要把 `vendor/baoyu-design/upstream/SKILL.md` 注册成 Runtime Skill；它只作为第三方实现资料。

## Runtime 路由

- UI mockup / Dashboard / landing page → 上游 `hi-fi-design` + `interactive-prototype`；
- mobile app → `mobile-prototype` + hi-fi/prototype；
- wireframe → `wireframe`；
- slides/deck → `make-a-deck`；
- visual document → `make-a-doc`；
- animation / 3D / HTML email / flier 等 → 按上游 project type 加载对应内部 skill。

如果用户要**创建设计系统本身**，切换到 `design/design-system-authoring`。如果只是让页面遵循已有设计系统，本 Skill 保留主路由，并使用上游 `use-design-system.md`。

## 工作流

1. 明确交付物、受众、使用场景、保真度、设计上下文与需要探索的差异；信息已充分时不重复追问。
2. 优先读取用户提供的代码、Figma、HTML/CSS、截图、品牌与现有 Design System；从零设计作为最后选择。
3. 依据上游方法建立明确视觉方向，生成到 `designs/<project>/`，保持资产自包含。
4. 交互型产物实现真实状态、点击、表单、导航和必要动画；视觉比较优先使用上游 design canvas。
5. 有浏览器能力时通过 HTTP 预览、检查 console/交互并修复；没有可视预览能力时做静态检查，并明确说明未完成视觉浏览器验收。
6. 使用上游 `agents/record-asset.mjs` 维护 `_d_meta.json` 时，以实际脚本成功结果为准。

宿主工具映射与降级规则见 `references/host-adapter.md`；跨领域边界见 `references/runtime-boundaries.md`。

## 能力组合

仅在子任务真实存在时加载 optional Skill：

- 视觉交付需要**最新、多来源外部事实** → `research/deep-research` 负责证据，设计 Skill 保留最终视觉信息架构与呈现；
- 用户给出多份长材料，需先形成稳定内容骨架再设计 → `research/knowledge-synthesis`；
- 原型内包含需要正确选择图型/避免误导的真实数据图 → `data/data-visualization`；普通 UI 装饰图不加载它。

同一句请求里若研究、数据分析或写作本身才是主要目标，则对应领域 Skill 拥有主路由，设计只在用户明确要求视觉交付时参与。

## 验收

- 产物与用户场景、已有视觉语言一致；
- 不用通用 AI 模板审美填充空白；
- 关键交互可操作，页面加载无已知运行时错误；
- 外部事实可追溯，设计系统约束被实际遵守；
- 未执行的导出、浏览器或脚本验证不声称成功。
