# Agent Plugin Marketplace Plugin Model

## 分层

```text
AI_USAGE.md
    ↓ bootstrap
skill-runtime.js
    ↓ reads
marketplace.json
    ↓ discovers installed Plugins
plugins/<plugin>/plugin.json
    ↓ discovers
plugins/<plugin>/skills/<skill>/SKILL.md
    ↓ on demand
references / scripts / assets / plugin shared
```

- **Marketplace**：Catalog、分类和已安装 Plugin 的本地 source metadata。
- **Plugin**：稳定 namespace、版本、Skills 根目录、shared resources 和 Group metadata 的边界。
- **Skill**：具体任务能力与路由合同。
- **Group**：只用于 Plugin 内的软分组，写在 `plugin.json`，不进入物理路径和逻辑 Skill ID。

## 稳定兼容

历史逻辑 ID `<category>/<skill>` 保持不变，因为迁移后 Plugin 名沿用原 Category 名。以下入口继续有效：

```bash
node skill-runtime.js list
node skill-runtime.js list development
node skill-runtime.js catalog
node skill-runtime.js skill development/github-bug-investigation
node skill-runtime.js doctor
```

`list`/`doctor` 输出继续保留 `category/categories/categoryCount` 兼容字段，同时新增 `plugin/plugins/pluginCount`。

## Manifest

`marketplace.json`：

```json
{
  "schemaVersion": 1,
  "name": "agent-plugin-marketplace",
  "version": "1.0.0",
  "plugins": [
    {"name": "development", "source": "./plugins/development", "category": "Development"}
  ]
}
```

`plugins/<plugin>/plugin.json`：

```json
{
  "schemaVersion": 1,
  "name": "development",
  "version": "1.0.0",
  "description": "...",
  "skills": "./skills",
  "shared": "./shared",
  "groups": {
    "testing": ["github-business-test-plan-generator"]
  }
}
```

## 可搬迁性

Runtime 根目录只由 `skill-runtime.js` 的真实位置确定；Marketplace source 使用 Runtime 内相对路径。因此整个目录移动到其他位置后无需修改 manifest。自动测试会把完整 Runtime 复制到随机临时目录并重新执行 `doctor` 和 Skill direct-read。

这只保证**文件位置可搬迁**。具体 Skill 对宿主工具的要求仍由 Skill 自己定义；例如现有部分 repo-ops Skill 仍依赖 AgentDock。当前 Runtime **尚未实现**宿主 capability resolver，也没有把这些 Skill 自动隐藏。

## 当前职责边界

当前 `skill-runtime.js` 是**已安装 Plugin 的发现与执行目录解析器**。它不伪实现以下能力：

- Git/npm/HTTP Marketplace 拉取；
- Plugin 安装/升级/卸载；
- Plugin → Plugin SemVer 依赖解析；
- lockfile / signature / digest verification；
- Claude/Codex manifest export adapter。

这些能力以后应进入独立的 Plugin Manager / Resolver，避免把网络分发职责塞进每次 Skill 发现和执行链路。
