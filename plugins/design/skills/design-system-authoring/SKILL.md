---
name: design-system-authoring
description: "用于创建、导入、编译和验证可复用设计系统/UI Kit：design tokens、字体、组件、starting points、Design Components，以及从 Figma .fig、GitHub 或现有 HTML/CSS 提取设计语言。目标是产出可被后续设计项目绑定和消费的设计系统资产时使用；普通页面设计使用 visual-artifact-design。"
visibility: workflow
phase: architecture
---

# Design System Authoring

## 目标

维护一个可加载、可版本化、可验证的 Design System，而非只做“看起来像某品牌”的页面。固定上游来自 `vendor/baoyu-design/UPSTREAM.json`。

## Upstream Gate

执行前检查 `vendor/baoyu-design/upstream/built-in-skills/design-system-authoring-guide.md`。缺失时运行：

`node vendor/baoyu-design/materialize-upstream.mjs`

若当前环境无法联网且 upstream 尚未 hydrate，明确报告这一前置条件，不能凭记忆重写上游设计系统协议。

## Authoring Flow

1. 加载上游 `design-system-authoring-guide.md`；按任务再加载 `create-design-system.md`、`design-components.md`、`design-system-preview.md`。
2. 来源是本地 Figma `.fig` → 加载 `import-from-figma.md`，先 outline，再按选择 materialize 或 `design-system`；来源是 GitHub/HTML → 分别加载对应 import skill。
3. 系统必须有明确 tokens、typography、components 与使用约束；组件、CSS、bundle、manifest 之间保持单一事实来源。
4. 使用上游 `agents/compile-design-system.mjs` 生成可消费 bundle/manifest；使用 `agents/check-design-system.mjs` 做只读校验；最后用 `agents/build-preview.mjs` 生成 review 页面。只有命令真实成功才能记录为通过。
5. 保留来源、版本和资产归属；用户提供或第三方系统只作为视觉/组件事实来源，不把示例品牌内容当作用户事实。
6. 交付后，普通设计项目通过上游 `use-design-system.md` 导入固定副本到 `_ds/<slug>/`，由 `_d_meta.json` 记录绑定。

工具与降级规则见 `references/authoring-runtime.md`。

## 边界

- “用 Fluent 2 设计设置页” → `design/visual-artifact-design`，消费已有系统；
- “给我做一套 Fluent 风格 tokens + components + UI Kit” → 本 Skill；
- “实现生产 React 组件库并发布 npm 包” → 生产代码实现应交给 Development，除非当前请求仅要求设计系统原型/设计资产；
- “分析 CSV 后画图” → Data，不因 design token 或颜色问题进入本 Skill。

## 验收

- 编译器与 checker 的真实退出结果已记录；
- `_ds_manifest.json`、bundle、CSS/token 依赖闭包可解析；
- Preview 可在具备浏览器能力的宿主加载；
- Figma/GitHub/HTML 来源与版本可追溯；
- 未安装的 Playwright、PPTX、视频等可选能力不影响基础设计系统链路，也不伪报可用。
