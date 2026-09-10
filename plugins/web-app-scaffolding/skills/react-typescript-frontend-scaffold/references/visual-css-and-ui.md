# Visual Design, CSS & UI

在设计页面、写 CSS、调整 Token/Theme、实现通用 UI 或复杂交互时读取。

## 1. 默认视觉语言

目标：**轻、稳、清晰、克制、专业、高信息效率**。

优先级：

```text
User task / information hierarchy
→ Existing page pattern
→ Existing UI Primitive
→ Design Token
→ Layout / responsive
→ Decoration
```

避免从 Card、Gradient、Shadow、漂亮颜色开始设计。

默认 Starter Theme：Slate 中性色 + Indigo 品牌色；项目可以通过 Token 换品牌，不改组件。

## 2. 页面层级

优先：

```text
1. Whitespace
2. Typography
3. Background / Surface
4. Border
5. Shadow（最后考虑）
```

App Shell 方向：Soft App Background + 融入背景的 Sidebar + 独立 Workspace Surface + 低阴影 + 中等圆角。

禁止 Card 套 Card 成为默认页面结构。

## 3. CSS 技术合同

```text
Native CSS
CSS Modules
CSS Custom Properties
PostCSS + postcss-preset-env
Browserslist
```

不使用 Tailwind、SCSS、Less、CSS-in-JS。

组件：

```tsx
import styles from './website-card.module.css'

export function WebsiteCard() {
  return <article className={styles.root}>...</article>
}
```

静态视觉禁止塞 inline style；运行时值才允许：

```tsx
<div style={{ width: `${progress}%` }} />
```

CSS Module class 用 camelCase：`.root .headerActions .statusBadge`。不需要 BEM。

`:global`、`!important` 默认禁止；第三方不可控 DOM/CSS 的局部边界例外，并写原因。

状态优先：

```css
.root:hover {}
.root:focus-visible {}
.root:disabled {}
.root[aria-selected='true'] {}
.root[data-state='open'] {}
```

选择器保持浅层，不镜像整棵 DOM。

## 4. Design Token

Canonical Source：

```text
apps/web/src/styles/
├── tokens.css
├── reset.css
├── base.css
└── index.css
```

模型：

```text
Foundation Token
      ↓
Semantic Token
      ↓
Component CSS
```

Foundation 示例：

```css
--space-1: 4px;
--space-2: 8px;
--space-4: 16px;
--radius-md: 8px;
--font-size-sm: 14px;
--control-height-md: 36px;
```

Semantic Color 示例：

```css
--color-bg-surface: #fff;
--color-text-primary: var(--palette-slate-900);
--color-action-primary: var(--palette-indigo-600);
```

推荐：

```css
.button { background: var(--color-action-primary); }
```

反例：

```css
.button { background: var(--palette-indigo-600); }
```

颜色优先 Semantic；spacing/radius/typography/control size 可直接消费 Foundation。默认不上 tokens.json、Style Dictionary、Token Compiler、全量 Component Token。

## 5. Visual Scale

Spacing：4px 原子网格 + 8px 主节奏，常用 8/16/24/32。

Typography：

```text
12px Caption/Badge
14px 默认产品 UI
16px 阅读型正文
20px Page/Section 标题
24px 大型标题，谨慎使用
```

字重只默认 400/500/600。

Radius：6/8/12/16/24/full；不制造 7/9/11/13px 随机圆角。

Control Height：32/36/40，默认 36px；同一操作区域 Input/Select/Button/Trigger 尽量同尺寸。

Shadow 只适合 Dialog/Dropdown/Popover/Floating Toolbar 等真实悬浮层；普通 Section/Card 默认无 Shadow。

## 6. Dark Mode

Dark Mode 是默认能力，支持：`light / dark / system`，默认 `system`。

主题只覆盖 Semantic Token：

```css
:root,
[data-theme='light'] {
  --color-bg-surface: #fff;
  --color-text-primary: #0f172a;
}

[data-theme='dark'] {
  --color-bg-surface: #111827;
  --color-text-primary: #f8fafc;
}
```

组件不写自己的 `[data-theme='dark'] .component` 分支。

用户显式选择优先于 system；在 React mount 前设置根 `data-theme`，避免闪烁；同步 `color-scheme`。Light/Dark 都过对比度检查。

## 7. Radix Primitives

复杂交互默认允许并优先 Radix Primitives：Dialog、Popover、Dropdown Menu、Select、Tooltip、Tabs 等。

```text
Radix → 行为 / Focus / Keyboard / ARIA / Portal / Dismiss
packages/ui → 自己的 Component API
CSS Modules + Token → 全部视觉
```

业务 Feature 禁止直接 import Radix；由 `packages/ui` 封装。简单 Button/Input 等不机械套 Radix。

不用 Radix Themes、shadcn/ui。

## 8. Icon System

唯一通用图标源：`lucide-react`。

```css
--icon-size-sm: 16px;
--icon-size-md: 20px;
--icon-size-lg: 24px;
```

默认 `currentColor`、Lucide 原生 stroke；不随机 strokeWidth。

```tsx
<IconButton aria-label="删除">
  <Trash2 aria-hidden="true" />
</IconButton>
```

正式 UI 禁止 Emoji/Unicode/第二套通用 Icon Library。品牌 Logo/产品专有图形可用专有 SVG。

## 9. Page / Table / Motion

Page Header 稳定结构：Title + secondary info/status + actions；一个操作区原则上只保留一个主要高强调操作。

Table/List 优先扫描效率：操作列收敛，避免一行 5～8 个按钮；Loading/Empty/Error 不破坏整体骨架。

Motion：100–150ms micro state；150–200ms menu/popover；150–250ms dialog/panel。主要用 opacity/transform，避免 bounce/长飞入；尊重 `prefers-reduced-motion`。
