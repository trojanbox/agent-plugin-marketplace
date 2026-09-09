# Agent Plugin Marketplace

一个可搬迁的 Agent Plugin / Skill 能力仓库，采用：

```text
Marketplace
  → Plugin
      → Skills
          → references / scripts / assets
```

`AI_USAGE.md` 是稳定的 Agent bootstrap 入口。宿主只需要先读取它，再通过 `skill-runtime.js` 动态发现 Marketplace、Plugin 和 Skill；具体 Skill 内容按需加载。

## 快速使用

```bash
node skill-runtime.js list
node skill-runtime.js list development
node skill-runtime.js catalog
node skill-runtime.js skill development/github-bug-investigation
node skill-runtime.js doctor
```

## 目录

```text
AI_USAGE.md
skill-runtime.js
marketplace.json
plugins/
  <plugin>/
    plugin.json
    skills/
      <skill>/
        SKILL.md
        references/
        scripts/
        assets/
    shared/
tests/
vendor/
```

## 设计原则

- Marketplace 负责 Catalog、分类和 Plugin 来源元数据。
- Plugin 是 namespace、版本、共享资源和能力组织边界。
- Skill 描述具体任务能力与路由合同。
- `AI_USAGE.md` 保持为薄 bootstrap，不复制 Plugin/Skill 全量清单。
- Runtime 使用相对路径发现资源，整个仓库可以移动到其他目录使用。

更多设计约束见 [`PLUGIN_MODEL.md`](./PLUGIN_MODEL.md) 与 [`SKILL_COMPOSITION.md`](./SKILL_COMPOSITION.md)。
