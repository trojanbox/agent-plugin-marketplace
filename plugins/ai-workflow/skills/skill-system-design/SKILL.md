---
name: skill-system-design
description: "用于设计、创建、修改、拆分、合并、删除或审计 AI Skill Runtime 中的 Marketplace / Plugin / Group metadata / Skill / 路由 / 组合规则。适合‘缺不缺一个 Skill/一个 Plugin 该不该拆/这个 Skill 为什么触发不到/多个 Skill 会不会冲突/帮我新增或优化 Skill/整理 Plugin 与 Marketplace/打包最新版 Runtime’。执行时先盘点 Catalog 和现有回归样本，优先修路由/组合而非新增能力；涉及路由、Gate 或 Composition 的修改必须做语义路由 Eval，再运行 Runtime doctor 并交付可用产物。"
visibility: workflow
phase: architecture
---

# Skill System Design / Skill 系统设计与维护

## 唯一目标

让 Runtime 随能力增长仍保持**可发现、少冲突、可组合、渐进加载、可测试、可搬迁**，避免入口、Plugin manifest 和 `SKILL.md` 重新膨胀成全量知识库。

## 初始化

1. 读取当前 Runtime 的薄入口 `AI_USAGE.md`；
2. 用 `list / catalog / skill` 发现真实结构，不凭记忆猜名称；
3. 只加载当前维护任务涉及的 Marketplace/Plugin/Skill/依赖；
4. 组合规则确实需要全局核对时再读取 `SKILL_COMPOSITION.md`；
5. 当前磁盘/用户新包是结构事实源。

## Progressive Disclosure Gate（强制）

按 Agent Skills 官方渐进披露原则维护四层：

```text
AI_USAGE.md       → 只告诉 Agent 如何发现
marketplace.json  → 只提供 Catalog / Plugin 来源与分组元数据
plugin.json       → 只提供 Plugin identity/version/namespace/Group metadata
SKILL.md          → 只放每次激活都需要的核心流程/约束
references/scripts/assets/shared → 只在具体条件成立时加载
```

要求：

- `AI_USAGE.md` 禁止复制 Plugin/Skill Catalog、领域案例和 Gate 细节；
- `marketplace.json` 只登记 Plugin；`plugin.json` 只保存 Plugin 元数据和 Group 映射，禁止复制每个 Skill 的完整工作流或输出模板；候选列表由 Runtime `list <plugin>` 动态返回；
- `SKILL.md` 保留触发、目标、核心步骤、关键 gotcha、组合条件和停止边界；长模板、详细检查表、专项模式、协议/证据表移到 `references/`；
- 主文件引用 reference 时必须写清**什么时候读**，不能只写“详情见 references”；
- references 保持聚焦并尽量单层；避免 reference 再要求深层 reference 链；
- 官方上限/建议见维护 reference，本 Runtime 额外用测试设置更保守的上下文预算，防止回归。

审计上下文或拆大 Skill 时先读取 `references/progressive-disclosure.md`；设计/拆分的详细合同按需读取 `references/skill-design-contract.md`。

## 变更工作流

1. **分类根因**：Trigger gap、false positive、neighbor conflict、phase/gate、workflow、composition、stale rule、context bloat 等，只修证据支持的根因。
2. **新增 Gate**：现有 Skill 能通过边界/流程修正承接时不新增；确有独立、重复任务目标时才建新 Skill。详细判据读 `references/skill-design-contract.md`。
3. **拆分 Gate**：主文件超过上下文预算或大量内容只在少数分支使用时，优先搬到 focused references，保持逻辑 Skill 不变。
4. **路由/组合修改**：读取 `references/semantic-routing-eval.md`，复用 `references/semantic-routing-regression.csv` 的相关样本；真正双主目标应判 conflict，不为通过率硬合并。
5. **验证与交付**：读取 `references/runtime-maintenance-and-delivery.md`，运行 `doctor`、自动测试、必要语义回归和 ZIP/Patch 验证。

## 完成条件

- 入口、Marketplace、Plugin、Skill 都符合渐进披露职责；
- 依赖/引用没有断裂，主文件的按需读取条件明确；
- 路由/Gate/Composition 变更有语义回归证据；
- `doctor` 与测试真实通过后再声明可用；
- 用户要可安装产物时交付完整 Runtime，并按项目规则提供验证过的 Patch。
