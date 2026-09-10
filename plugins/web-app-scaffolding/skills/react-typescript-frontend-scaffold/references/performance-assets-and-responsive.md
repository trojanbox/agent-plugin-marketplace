# Performance, Assets & Responsive

在处理 Route lazy、图片 lazy、静态资源、字体、响应式、Bundle、memoization、React Compiler 时读取。

## 1. Route / 大 Feature 懒加载是默认能力

业务 Route 默认 `route.lazy`；App Bootstrap、App Shell、全局 Error/Loading Boundary 等极小基础设施 eager。

适合 lazy：

```text
Route / 大 Feature
富文本编辑器
图表/可视化
大型代码编辑器
低频复杂设置
明显重型第三方能力
```

不推荐：

```tsx
const Button = lazy(() => import('./button'))
const Badge = lazy(() => import('./badge'))
```

Route/大 Feature 是默认拆包边界，不机械拆小组件。

避免 Lazy Waterfall；Route 阶段已知的 Component/Loader/Action 尽量并行加载。

## 2. 图片懒加载

非首屏关键内容图片必须 lazy + reserve layout space + alt + responsive source when available。

现代浏览器：

```html
<img
  loading="lazy"
  decoding="async"
  width="800"
  height="600"
  src="..."
  alt="..."
/>
```

Safari 13.1 / iOS 13.4 基线不能可靠依赖 native `loading="lazy"`，共享 Image Primitive 需要 IntersectionObserver fallback；业务 Feature 不重复手写 observer，也不引入第三方 lazy library。

首屏 Hero/LCP/关键 Logo 不 lazy，保持 eager。`fetchpriority="high"` 只能做 progressive enhancement，不作为功能正确性依赖。

## 3. Responsive Image

有多尺寸资源时：

```html
<img
  src="image-800.jpg"
  srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
  sizes="(max-width: 640px) 100vw, 50vw"
  width="800"
  height="600"
  alt="..."
/>
```

内容图优先 `<img>/<picture>`，CSS `background-image` 主要用于纯装饰。

当前兼容 Safari 13.1，所以 WebP/AVIF 只能增强，关键内容必须保留 JPEG/PNG fallback：

```html
<picture>
  <source type="image/avif" srcset="image.avif" />
  <source type="image/webp" srcset="image.webp" />
  <img src="image.jpg" alt="..." />
</picture>
```

## 4. 静态资源与 Vite Asset Graph

普通图片/插画/字体通过源码 import 进入 Vite Asset Graph，让 Vite 处理 hash/路径：

```ts
import heroUrl from './assets/hero.jpg'
```

`public/` 只放必须固定 URL/文件名或不经源码引用的资源：robots.txt、favicon、verification file 等。

默认不装 SVGR；品牌/产品 SVG 默认 asset URL，只有真需要控制 SVG 内部状态/动画才实现 React Component。

## 5. 字体

默认 system UI stack，不加载 Google Fonts/Adobe Fonts 等远程字体 CDN。

```css
--font-family-sans:
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

真实品牌字体：self-host WOFF2 + `@font-face` + `font-display: swap`，只加载实际 weight/style；首屏真正关键字体才 preload。

不用 Icon Font；通用图标继续 Lucide。

## 6. 响应式默认能力

普通视觉布局由 CSS 处理：Media Query / Grid / Flex。

推荐：

```css
.root {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 48rem) {
  .root {
    grid-template-columns: 15rem minmax(0, 1fr);
  }
}
```

反例：组件用 `window.innerWidth` + resize state 只为改变列数/间距/排列。

JS 只在交互行为确实不同的时候用 `matchMedia` 或集中 Hook。

App Shell 必须有宽屏、中等收缩、小屏可用策略；专业桌面工具可以声明 Minimum Operational Width，并给更小视口明确降级，不允许随机横向溢出。

小屏不能简单 `display:none` 隐藏核心操作；可收进 More Menu、Drawer、紧凑布局。

## 7. Component 对可用空间负责

复用组件不要假设自己永远占完整 viewport。优先自然 wrap/stack/minmax/flex-wrap。

Container Query 可以在 Browser Contract 允许且有 fallback 时使用，但不作为核心功能正确性的唯一机制。

## 8. Memoization / React Compiler

不预防性滥用 `useMemo/useCallback/React.memo`。

反例：

```tsx
const title = useMemo(() => website.name, [website.name])
const handleOpen = useCallback(() => setOpen(true), [])
```

没有真实性能或稳定引用合同时只增加噪音。

React Compiler 当前**不作为默认能力**：虽然已稳定，但 Vite 8 下会增加额外编译依赖/层。保持清晰 React Rules 与测量优先；项目真有性能收益或未来集成更直接时再启用。

## 9. Performance Review Gate

- 新业务 Route 是否 lazy？
- 是否把小组件机械 lazy？
- 是否有明显 lazy waterfall？
- LCP 图片是否被错误 lazy？
- 非首屏图片是否 lazy 且有尺寸占位？
- 是否下载远超实际显示尺寸的大图？
- WebP/AVIF 是否有兼容 fallback？
- 是否把普通资源无理由塞 public/？
- 是否引入远程字体或过多 weight？
- 是否用 React state 监听窗口宽度做普通布局？
- 是否无依据添加 memoization / React Compiler？
