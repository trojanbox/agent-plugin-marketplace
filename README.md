# Agent Plugin Marketplace

一个可搬迁、可直接被 Claude Code / Codex 安装的 Agent Plugin / Skill Marketplace，同时保留独立的 `AI_USAGE.md + skill-runtime.js` 自用 Runtime。

```text
Marketplace
  → Plugin
      → Public Skills
      → Internal Skills / shared resources
```

## Claude Code 安装

```bash
claude plugin marketplace add trojanbox/agent-plugin-marketplace
claude plugin install development@agent-plugin-marketplace
```

其它 Plugin 把 `development` 替换为 `research`、`writing`、`data` 等名称即可。

Claude 原生分发文件：

```text
.claude-plugin/marketplace.json
plugins/<plugin>/.claude-plugin/plugin.json
```

## Codex 安装

```bash
codex plugin marketplace add trojanbox/agent-plugin-marketplace
codex plugin add development@agent-plugin-marketplace
```

Codex 原生分发文件：

```text
.agents/plugins/marketplace.json
plugins/<plugin>/.codex-plugin/plugin.json
```

## 自用 Runtime

`AI_USAGE.md` 是稳定 bootstrap 入口。这个入口与 Claude / Codex 的原生安装链互不依赖：宿主安装后直接发现 Public Skills；自用 Runtime 继续通过 `skill-runtime.js` 提供完整 Catalog、Routing、Composition 与 internal Skill 能力。

```bash
node skill-runtime.js list
node skill-runtime.js list development
node skill-runtime.js catalog
node skill-runtime.js skill development/github-bug-investigation
node skill-runtime.js doctor
```

## Canonical Source 与生成文件

唯一事实源仍然是：

```text
marketplace.json
plugins/<plugin>/plugin.json
```

Claude / Codex manifest 都由它们确定性生成，禁止手工维护生成文件：

```bash
node scripts/generate-host-manifests.mjs
node scripts/validate-host-manifests.mjs
node skill-runtime.js doctor
```

CI 会重新生成 Host manifests，并通过 `git diff --exit-code` 阻止生成产物与 Canonical Source 漂移。

## 目录

```text
AI_USAGE.md
skill-runtime.js
marketplace.json
scripts/
  generate-host-manifests.mjs
  validate-host-manifests.mjs
  host-manifest-lib.mjs
.claude-plugin/
  marketplace.json
.agents/plugins/
  marketplace.json
plugins/
  <plugin>/
    plugin.json
    .claude-plugin/
      plugin.json
    .codex-plugin/
      plugin.json
    skills/
      <public-skill>/
        SKILL.md
        references/
        scripts/
        assets/
    internal-skills/
      <internal-skill>/
        SKILL.md
    shared/
tests/
vendor/
```

`internal-skills/` 仅在确有内部组合能力时存在。该目录由自用 Runtime 扫描，不进入 Claude / Codex 默认 Skill discovery。

## 设计原则

- 根 `marketplace.json` 负责 Canonical Catalog、分类、Plugin 来源与 Marketplace identity。
- `plugins/<plugin>/plugin.json` 负责 Plugin identity、版本、Public/Internal Skill roots、shared resources 和 Group metadata。
- `skills/` 只包含宿主可发现的 Public Skills。
- `internal-skills/` 只包含自用 Runtime 的内部组合能力。
- Claude / Codex Host Adapter 只负责分发，不复制 `uses / optional_uses / groups / phase / visibility` Composition Engine。
- `AI_USAGE.md + skill-runtime.js` 保留为独立自用入口，不参与宿主安装链。

更多设计约束见 [`PLUGIN_MODEL.md`](./PLUGIN_MODEL.md) 与 [`SKILL_COMPOSITION.md`](./SKILL_COMPOSITION.md)。
