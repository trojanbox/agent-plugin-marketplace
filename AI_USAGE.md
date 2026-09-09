# Agent Plugin Marketplace

本文件是 **bootstrap 薄入口**。不要在这里维护 Plugin/Skill 清单、领域规则、Gate、案例或输出模板。

## 日常路由

1. `node skill-runtime.js list`：只看已安装 Plugin 元数据，先缩小领域。旧版把这一层称为 Category；现有名称和调用参数继续兼容。
2. 领域明确：`node skill-runtime.js list <plugin>`；跨领域或拿不准：`node skill-runtime.js catalog`。
3. 根据返回的 `description + phase` 选**唯一主 Skill**。如果仍有两个独立主交付物同时成立，先让用户选择；辅助能力不算主 Skill 冲突。
4. `node skill-runtime.js skill <plugin>/<skill>`：读取命中的 `SKILL.md` 元信息和路径。现有 `<category>/<skill>` ID 因 Plugin 名沿用原 Category 名而保持不变。
5. 先加载 `uses`；`optionalUses` 只有在主 Skill 正文写明的条件成立时才加载。
6. `SKILL.md` 引用自身 `references/`、`scripts/`、`assets/` 或 Plugin `shared/` 时，只在明确触发条件下读取/执行，不预加载整个目录。

## 分层约定

- `marketplace.json`：Catalog / 分组 / 已安装 Plugin 来源元数据；不承载 Skill 执行知识。
- `plugins/<plugin>/plugin.json`：Plugin identity、version、namespace、skills root、shared root 与 Group metadata。
- `plugins/<plugin>/skills/<skill>/SKILL.md`：宿主可发现的 Public Skill 与路由合同。
- `plugins/<plugin>/internal-skills/<skill>/SKILL.md`：仅自用 Runtime 发现的内部组合能力；不存在内部能力时不创建。
- `plugins/<plugin>/shared/`：同一 Plugin 下多个 Skills 共用的 references / scripts / schemas / assets。
- Group 只存在于 `plugin.json` metadata，不进入物理 Skill 路径和稳定逻辑 ID。

## 上下文纪律

- 不一次读取全部 `plugin.json` 或全部 `SKILL.md`；日常候选以 Runtime 动态结果为准。
- `catalog` 只在跨 Plugin、路由不确定或当前 Plugin 无匹配时使用。
- 当前 Skill 已足够完成任务时，不为了“可能有用”继续加载其它 Skill。
- Marketplace 负责发现与分发元数据；已安装 Plugin 的执行不依赖远程 Marketplace 在线可用。
- Claude / Codex 原生 manifest 是 Canonical metadata 的生成产物；`AI_USAGE.md + skill-runtime.js` 只服务自用 Runtime，不参与宿主安装链。

## Runtime 维护

修改 Marketplace / Plugin / Skill / Group metadata / 路由 / Composition 后运行：

```bash
node scripts/generate-host-manifests.mjs
node scripts/validate-host-manifests.mjs
node skill-runtime.js doctor
```

结构维护、拆分和语义路由回归按正常路由进入对应 AI Workflow Skill。全局 Composition 规范只在维护/诊断确实需要时读取 `SKILL_COMPOSITION.md`。

规则：**上一层只负责发现下一层，不复制下一层知识。**
