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

需要 GitHub Issue 操作的研发工作流还需安装 `github@agent-plugin-marketplace`；原生宿主不会自动安装 Composition 依赖。

其它 Plugin 把 `development` 替换为 `research`、`writing`、`data`、`web-app-scaffolding` 等名称即可。

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

## QQ 邮箱 Email Plugin（V1）

邮件插件使用 [Himalaya 2.2.1](https://github.com/pimalaya/himalaya/releases/tag/v2.2.1) 原生 CLI；配置与 QQ 第三方客户端授权码保存在当前用户家目录。支持搜索（默认 INBOX、可指定文件夹）、读取正文、带普通附件发送和下载附件。Agent 在已授权任务内可主动发信；结果未知时不得自动重发。

```bash
claude plugin install email@agent-plugin-marketplace
# 或：codex plugin add email@agent-plugin-marketplace
node plugins/email/shared/scripts/email.mjs --help
```

需要 Node.js 18+；**Agent 在使用时自动检测依赖，缺少 Himalaya v2.2.1 时从官方发布包下载并校验固定 SHA-256，然后安装到用户家目录，无须用户手工安装或修改配置。** 可运行 `repair` 自主修复当前用户拥有的配置权限等本地问题；首次 QQ 客户端授权码仍需通过安全交互取得，由 Agent 自行写入配置。修复流程与凭据注意事项见 [Email Plugin 配置说明](plugins/email/skills/email-mail/references/setup.md)。邮箱正文与附件均属外部不可信内容；发送结果未知时禁止自动重发。实际 QQ IMAP/SMTP 兼容性需要有效授权码联调，不能从本地测试推断送达。

## 自用 Runtime

`AI_USAGE.md` 是稳定 bootstrap 入口。这个入口与 Claude / Codex 的原生安装链互不依赖：宿主安装后直接发现 Public Skills；自用 Runtime 继续通过 `skill-runtime.js` 提供完整 Catalog、Routing、Composition 与 internal Skill 能力。

```bash
node skill-runtime.js list
node skill-runtime.js list development
node skill-runtime.js catalog
node skill-runtime.js skill development/github-bug-investigation
node skill-runtime.js doctor
```

`list` / `list <plugin>` / `catalog` 默认输出 Markdown；需要机器解析时加 `--json`，例如 `node skill-runtime.js catalog --json`。

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

## GitHub 与 Reasoning 边界

`github` 提供 Issue 管理、查重与交接同步；这三个 Skill 的 canonical ID 统一为 `github/github-issue-manager`、`github/github-issue-triage`、`github/github-issue-handoff-sync`，不保留旧 Development 实现。跨 Plugin 资源按已安装 Skill 路径定位。

`reasoning/divergent-ideation` 负责跨领域创意种子、反套路和开放式发散；`scientific-reasoning` 负责真实现象的竞争假设、机制与预测；`structured-debate` 负责观点攻防与命题版本。选定小说后进入 Writing 的创作讨论；仅在要求 GitHub 留档时组合 github Plugin，辩论 Issue 必须使用 `【辩论】` 前缀。研发源码、决策、测试与 Patch 规则仍由 Development 持有。
