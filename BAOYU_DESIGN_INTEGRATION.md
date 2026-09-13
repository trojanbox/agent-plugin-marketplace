# baoyu-design Integration

本包在 Agent Plugin Marketplace 中提供 `design` Plugin：

- `design/visual-artifact-design`：UI mockup、交互原型、wireframe、deck、移动端界面等视觉交付；
- `design/design-system-authoring`：Design System / UI Kit / tokens / components 的创建、导入、编译和验证。

## 上游隔离

`JimLiu/baoyu-design` 不直接放入 `plugins/design/skills/`，防止其内部 `SKILL.md` / built-in prompts 被 Runtime 扫描成顶层 Skill。上游版本固定在 `vendor/baoyu-design/UPSTREAM.json`，完整源码 materialize 到 `vendor/baoyu-design/upstream/`。

## 离线交付合同

官方 `AI repository snapshot` 在上传 Artifact **之前**会执行：

```bash
node vendor/baoyu-design/materialize-upstream.mjs
node vendor/baoyu-design/materialize-upstream.mjs --verify-only
```

因此 `agent-plugin-marketplace-snapshot` 必须已经包含固定 commit 的完整 `vendor/baoyu-design/upstream/` 与 `.upstream.json` 校验标记。正常 Runtime 初始化只需要下载并解压成功的 snapshot，随后 Design Skills 可在无网络环境直接读取上游方法、脚本和 starter assets，不再把在线 hydration 作为执行前置条件。

`materialize-upstream.mjs` 仍保留，用于：

- 维护者从源码 checkout 构建 snapshot；
- 显式刷新经过审核的新 pinned commit；
- 修复本地开发副本。

它不应成为已交付 Runtime 的日常执行步骤。若 snapshot 中缺少 upstream 或 `--verify-only` 失败，应视为制品不完整/损坏并重新获取有效 snapshot，而不是在 Skill 执行期间静默访问网络补齐。

## 已验证

- `node skill-runtime.js doctor`
- `python -m unittest discover -s tests -p 'test_*.py' -v`
- `node skill-runtime.js list design`
- `node vendor/baoyu-design/materialize-upstream.mjs --verify-only`（对已构建 snapshot）
- 两个 Design Skill 的 Runtime discovery
- 语义路由回归语料中的 14 条 design 边界样例

PPTX/MP4 等重导出依赖继续保持 optional；基础 Runtime 不强制安装 Playwright/ffmpeg。
