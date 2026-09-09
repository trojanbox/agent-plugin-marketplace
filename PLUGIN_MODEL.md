# Agent Plugin Marketplace Plugin Model

## Canonical 分层

```text
AI_USAGE.md
    ↓ bootstrap（自用）
skill-runtime.js
    ↓ reads
marketplace.json
    ↓ discovers installed Plugins
plugins/<plugin>/plugin.json
    ├─ skills/<skill>/SKILL.md
    ├─ internal-skills/<skill>/SKILL.md
    └─ shared/
```

- **Marketplace**：Canonical Catalog、分类、Plugin 来源和 Marketplace identity。
- **Plugin**：稳定 namespace、版本、Public/Internal Skill roots、shared resources 和 Group metadata 的边界。
- **Public Skill**：位于 `skills/`，可被 Claude / Codex 原生插件发现，也可被自用 Runtime 使用。
- **Internal Skill**：位于 `internal-skills/`，只由自用 Runtime 发现，不进入宿主原生 Skill discovery。
- **Group**：只用于 Plugin 内的软分组，写在 `plugin.json`，不进入物理路径和逻辑 Skill ID。

## Host 分发层

Canonical Source 只维护：

```text
marketplace.json
plugins/*/plugin.json
```

生成器单向派生：

```text
Canonical Source
  ├─ Claude → .claude-plugin/marketplace.json
  │           plugins/*/.claude-plugin/plugin.json
  └─ Codex  → .agents/plugins/marketplace.json
              plugins/*/.codex-plugin/plugin.json
```

生成产物提交 Git。`scripts/generate-host-manifests.mjs` 必须确定性输出并清理 stale manifest；`scripts/validate-host-manifests.mjs` 校验生成内容、宿主必要字段、Public/Internal Skill 物理边界和漂移。

Host Adapter 不实现第二套 Runtime Composition Engine。`uses / optional_uses / groups / phase / visibility` 继续由 `skill-runtime.js` 解释；Claude / Codex 原生模式只承诺 Public Skill 的安装与发现。

## Manifest

Canonical `marketplace.json`：

```json
{
  "schemaVersion": 1,
  "name": "agent-plugin-marketplace",
  "version": "1.0.0",
  "owner": {"name": "trojanbox"},
  "repository": "https://github.com/trojanbox/agent-plugin-marketplace",
  "plugins": [
    {"name": "development", "source": "./plugins/development", "category": "Development"}
  ]
}
```

Canonical `plugins/<plugin>/plugin.json`：

```json
{
  "schemaVersion": 1,
  "name": "development",
  "version": "1.0.0",
  "description": "...",
  "skills": "./skills",
  "internalSkills": "./internal-skills",
  "shared": "./shared",
  "groups": {
    "testing": ["github-business-test-plan-generator"]
  }
}
```

`internalSkills` 是可选字段；没有内部能力的 Plugin 不创建该目录也不声明该字段。

## 稳定兼容

历史逻辑 ID `<category>/<skill>` 保持不变，因为迁移后 Plugin 名沿用原 Category 名。Internal Skill 迁移目录不会改变逻辑 ID。

以下入口继续有效：

```bash
node skill-runtime.js list
node skill-runtime.js list development
node skill-runtime.js catalog
node skill-runtime.js skill development/github-incidental-bug-capture
node skill-runtime.js doctor
```

`list` / `catalog` 隐藏 Internal Skills；`doctor` 和 direct-read 仍能看到并校验它们。

## 可搬迁性

Runtime 根目录只由 `skill-runtime.js` 的真实位置确定；Canonical Marketplace source 使用 Runtime 内相对路径。因此整个目录移动后无需修改 manifest。Host manifest 同样只使用仓库内相对 Plugin source。

具体 Skill 对宿主工具的要求仍由 Skill 自己定义；例如部分 repo-ops Skill 依赖 AgentDock。原生 Host 安装只解决分发和发现，不为缺失宿主 capability 自动补兼容层。

## 当前职责边界

`skill-runtime.js` 仍然只负责**本地已存在 Plugin 的发现、路由和 Composition**。它不承担：

- Git/npm/HTTP Marketplace 拉取；
- Plugin 安装/升级/卸载；
- Plugin → Plugin SemVer 依赖解析；
- lockfile / signature / digest verification；
- Claude / Codex 安装生命周期。

Claude / Codex 的安装、升级、缓存和卸载由宿主自己的 Plugin Marketplace 机制负责。
