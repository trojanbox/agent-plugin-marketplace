# Decision Index / 决策索引

本 Skill 来源于 GitHub Issue #34：`【讨论】通用项目脚手架：前端设计体系与 AI Skill 技术基线`。

Source: https://github.com/trojanbox/project-documents/issues/34

本文件用于追溯，不替代其它 execution reference。后续决策覆盖早期候选；本 Skill 已按最终 confirmed 状态整理。

| Decision | 最终结论 |
| --- | --- |
| D-001 | 默认移除 Tailwind CSS |
| D-002 | Native CSS + CSS Modules；PostCSS 兼容层；不引入 Sass/SCSS |
| D-003 | Browser Contract：Chrome 80+ / Edge 80+ / Firefox 78+ / Safari 13.1+ / iOS 13.4+ |
| D-004 | Design Token 两层模型；`tokens.css` 是 Canonical Source |
| D-005 | Feature-based 前端目录；`packages/ui` 业务无关 |
| D-006 | 一组件一目录；`index.ts` 只用于真实 Public API |
| D-007 | React 组件职责、Props、Composition、Local State/Context 规则 |
| D-008 | Page/Router/Service/Hook/API Client 职责；loader/action 默认范式 |
| D-009 | 文件命名：业务 kebab-case + `.role` 技术后缀 |
| D-010 | 目录、类型、常量/enum、Import/Export 规则 |
| D-011 | CSS Modules、Accessibility、表单、测试、TS/Oxlint、依赖、注释、性能、并发默认合同 |
| D-012 | 复杂交互默认允许并优先 Radix Primitives，业务 Feature 不直连 |
| D-013 | `packages/i18n`：i18next + react-i18next；默认 zh-CN，内置 en-US |
| D-014 | Playwright E2E，固定 `tests/e2e`，Chromium/Firefox/WebKit |
| D-015 | 核心 E2E 跑真实 Frontend + Backend + 独立 Test DB；Mock 仅异常/外部依赖 |
| D-016 | 内部前端 Package 作为 Workspace Source Package；Vite 最终编译，Turborepo 编排 |
| D-017 | 默认 Icon System：Lucide；不混 Emoji/Unicode/第二套通用图库 |
| D-018 | Dark Mode 默认能力：light/dark/system，默认 system |
| D-019 | Route/大 Feature 懒加载；非首屏图片 lazy；Safari 13.1 IntersectionObserver fallback |
| D-020 | Env/Config 单一 typed boundary；客户端公开前缀 `VITE_PUBLIC_*` |
| D-021 | 前端安全基线：无 Secret、无 Web Storage auth token、raw HTML 严格受限 |
| D-022 | 响应式默认能力；普通布局由 CSS 负责 |
| D-023 | HTTP 默认 Native Fetch；统一 `api.client.ts`；不引入 Axios |
| D-024 | Vite Asset Graph；system font；品牌字体自托管；现代图片格式保留 fallback |
| D-025 | React Compiler 当前不作为默认构建能力 |
| D-026 | Visual Design Baseline：克制、清晰、高信息效率、低噪音 |

## 重要覆盖关系

- D-002 覆盖最初“SCSS 候选”：最终**不引入 Sass/SCSS**。
- D-003 覆盖最初 `100+` 浏览器草案：最终回落到 2020 年左右基线。
- D-009 覆盖 D-008 早期示例中的 `website-service.ts`：最终必须 `website.service.ts`。
- D-014/D-015 覆盖 D-011 早期“E2E 不默认”的候选：最终 **Playwright E2E 是默认能力**。
- D-016 覆盖早期“packages/ui 需要独立 Library Build”的担忧：内部 Package 默认直接 Source Package。
- D-018 将 D-004 的 Theme 能力提升为默认 `light/dark/system` 合同。
- D-023 将 D-008 的 API Client 落实为 Native Fetch。

## 源码/项目适配原则

这些决策定义“新通用脚手架的默认合同”。对既有项目：

1. 先读取现状与 AGENTS.md；
2. 如果技术栈与本基线不同但用户未要求迁移，不静默替换；
3. 用户明确要求迁移到本脚手架时，按最终决策执行，不引用已废弃候选；
4. 具体业务项目可以在有明确理由时覆盖默认值，但要集中记录差异，不在代码里形成隐性第二套规范。
