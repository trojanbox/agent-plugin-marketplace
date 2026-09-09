# Skill / Plugin / Marketplace / Group Metadata 设计合同

新增、拆分、合并 Skill/Plugin，或修改 Marketplace/Group metadata/identity/trigger/output/stop boundary 时读取。

# 三、新增 Skill Gate（强制）

用户提出“加一个 Skill”或分析中发现潜在能力缺口时，先回答以下问题：

1. **当前最接近的 Skill 是什么？**
2. **现有 Skill 为什么无法稳定承接？**
3. **这是能力缺失，还是 description / route / phase / Gate 写得不好？**
4. **新能力是否有独立且重复出现的任务目标、输入/输出或安全边界？**
5. **新 Skill 与现有邻居 Skill 如何互斥或组合？**
6. **新增后是否会让用户一句常见表达同时命中多个主 Skill？**

只有在“独立任务目标成立 + 路由边界可清晰表达”时才新增。

以下情况优先**修改现有 Skill**：

- 只是缺几个触发词；
- 只是现有流程少一个步骤；
- 只是另一个领域复用已有通用方法；
- 新 Skill 与已有 Skill 的输出、阶段和副作用基本相同；
- 用户真实表达无法区分两个候选。

---

# 四、设计一个 Skill 时必须定义的内容

## 4.1 Identity

至少包括：

- `name`
- `description`
- `phase`（主路由与内部组合 Skill 都应显式填写，用作工作流软索引）
- `visibility`（Runtime 使用该字段时）
- `uses / optional_uses`（仅真实需要时）

`description` 必须能承担路由职责，至少表达：

- 做什么；
- 高信号用户表达；
- 不做什么；
- 最关键的邻接 Skill 边界。

不要只写抽象能力名称。

## 4.2 Trigger Coverage

用用户真实会说的话检查：

- 明确触发词；
- 不带 Skill 专业术语时的自然表达；
- 中文口语、简写和常见任务描述；
- 任务已经处于某阶段时的续接表达。

至少准备 3 类样例：

- **应该触发**；
- **不应该触发**；
- **可能与邻居冲突**。

## 4.3 Neighbor Conflict

对每个相邻 Skill 明确：

- 当前 Skill 主目标；
- 邻居 Skill 主目标；
- 哪个阶段先；
- 哪些是主 Skill 冲突，需要用户选择；
- 哪些只是 Composition，可以直接复用。

禁止用 `optional_uses` 掩盖两个真正主工作流的冲突。

## 4.4 Output Contract

定义：

- 默认交付物；
- 是否有文件/Issue/代码等副作用；
- 哪些状态可以声称“完成”；
- 哪些验证必须真实运行；
- 缺证据时如何降级。

## 4.5 Stop Boundary

必须写清什么时候停止发散。例如：

- 发现目标功能当前并不存在 → 明确指出并停止设计其后续实施；
- 发现属于另一个 Skill 的主目标 → 路由，不在当前 Skill 里继续复制完整流程；
- 缺少必要源码/文档 → 只输出证据允许的结论。

---

# 五、Plugin、Marketplace 与 Group Metadata 设计

Plugin 是**安装、版本、namespace、shared resources 与生命周期边界**。新增 Plugin 的门槛高于新增 Skill；优先保持 Plugin 数量稳定，不为了目录好看把单一 Skill 拆成独立 Plugin。

适合新增或拆分 Plugin：

- 一组 Skills 通常会作为一个整体安装、升级和禁用；
- 它们共享稳定领域语义、权限/工具边界或 shared resources；
- 发布节奏、Owner 或安全边界已经明显独立；
- 继续放在同一 Plugin 会导致大量用户只想安装其中一半，或产生不必要依赖/权限。

适合同一 Plugin 下保留多个 Skills：

- 用户通常希望一起安装；
- namespace、生命周期和权限模型相近；
- 共用 scripts/references/assets/MCP/tool requirements；
- Skill 之间只是不同具体工作流，不需要独立发布。

`plugin.json` 只保存：

- `name / version / description`；
- 固定 `skills: "./skills"`；
- 可选 `shared: "./shared"`；
- Group metadata；
- 少量兼容/分发元数据。

不要在 `plugin.json` 复制 Skill 工作流、Gate、模板或逐 Skill description。具体候选由 Runtime 扫描 `SKILL.md` frontmatter 动态生成。

Marketplace 只负责 Catalog / category / source / distribution metadata。Marketplace category 是**发现分类**，不能成为 Skill 的强制运行时路由 Gate。

## 5.1 Group 是 metadata，不是物理目录或二级路由 Gate

标准物理目录固定为：

```text
plugins/<plugin>/skills/<skill>/SKILL.md
```

Group 写在 `plugin.json`：

```json
{
  "groups": {
    "testing": ["github-business-test-plan-generator", "github-technical-test-plan-generator"]
  }
}
```

Group 的职责：

- 让 `list <plugin>` 按子领域聚类候选；
- 给人类维护者和 AI 一个软语义索引；
- 保留原有目录分组信息而不污染 namespace。

Group **不能**成为“先命中 Group 才能看到 Skill”的强制路由门。`catalog` 必须始终可以跨 Group 搜索。

## 5.2 逻辑 ID 与物理目录解耦

Skill 的稳定逻辑 ID 始终是：

```text
<plugin>/<skill>
```

本 Runtime 为兼容旧调用，Plugin 名沿用原 Category 名，因此历史 `<category>/<skill>` ID 无需迁移。

例如物理文件：

```text
plugins/development/skills/github-test-plan-audit/SKILL.md
```

逻辑 ID：

```text
development/github-test-plan-audit
```

因此：

- `uses / optional_uses` 只引用 `<plugin>/<skill>`；
- Group 调整不需要迁移 Composition 和外部稳定引用；
- 同一 Plugin 下不能存在同名 Skill；
- Runtime `doctor` 必须检查重复逻辑 ID、Group metadata 指向不存在 Skill 等问题。

## 5.3 Shared Resources 与物理深度

同一 Plugin 的共享内容统一放：

```text
plugins/<plugin>/shared/
```

例如 shared references、scripts、schemas、templates、licenses。Skill 自己的 `references / scripts / assets / tests` 继续放在 Skill 目录中。

- Plugin/Skill/Group 使用小写 kebab-case；
- 只允许 `Plugin -> skills -> Skill`，不再建立 `Group -> Skill` 物理层；
- Skill 内部资源目录中的文件不得被误识别成新 Skill；
- Marketplace source 负责定位已安装 Plugin；远程 Git/npm/HTTP 的拉取与升级属于 Plugin Manager，不属于 Skill Runtime 执行器。
