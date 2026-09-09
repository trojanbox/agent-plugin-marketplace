# baoyu-design Integration

本包在 Agent Plugin Marketplace 中提供 `design` Plugin：

- `design/visual-artifact-design`：UI mockup、交互原型、wireframe、deck、移动端界面等视觉交付；
- `design/design-system-authoring`：Design System / UI Kit / tokens / components 的创建、导入、编译和验证。

## 上游隔离

`JimLiu/baoyu-design` 不直接放入 `plugins/design/skills/`，防止其内部 `SKILL.md` / built-in prompts 被 Runtime 扫描成顶层 Skill。上游版本固定在 `vendor/baoyu-design/UPSTREAM.json`，完整源码 materialize 到 `vendor/baoyu-design/upstream/`。

当前交付环境无法从执行容器直接拉取 GitHub archive，因此包中提供固定 commit、tree/subtree SHA、MIT License、13 类 project type snapshot，以及安全的精确 materializer。首次在可联网环境使用设计能力前执行：

```bash
node vendor/baoyu-design/materialize-upstream.mjs
```

然后可以验证：

```bash
node vendor/baoyu-design/materialize-upstream.mjs --verify-only
```

## 已验证

- `node skill-runtime.js doctor`
- `python -m unittest discover -s tests -p 'test_*.py' -v`
- `node skill-runtime.js list design`
- 两个 Design Skill 的 Runtime discovery
- 语义路由回归语料中的 14 条 design 边界样例

PPTX/MP4 等重导出依赖继续保持 optional；基础 Runtime 不强制安装 Playwright/ffmpeg。
