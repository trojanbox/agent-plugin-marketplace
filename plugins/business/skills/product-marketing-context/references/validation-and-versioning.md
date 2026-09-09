# Product Marketing Context 校验、保存与版本规则

准备保存或更新 `.agents/product-marketing.md` 时读取。

## Phase 4 — Validation Gate

保存前检查：

- [ ] 产品定义与核心受众没有互相矛盾；
- [ ] 关键定位、ICP、差异化能追溯到用户确认或证据；
- [ ] `inferred` 没有伪装成事实；
- [ ] 未知内容保留为 `unknown` / 待验证，而不是补写；
- [ ] 客户引语、案例、指标、Logo 没有被编造；
- [ ] 竞争对手描述没有把未经验证的营销判断写成事实；
- [ ] 用户已经提供过的信息没有被重复追问；
- [ ] 本次修改范围和 Changelog 描述一致。

任何会实质改变定位的关键缺口仍然未知时，先呈现缺口并让用户确认；低影响缺口可以保留为待验证，不阻塞整份 Context。

---

## Phase 5 — Save & Version

需要落盘时，使用主 `SKILL.md` 已声明的 canonical 文档骨架。

### 新文档

- `Document version: v1`
- `Last updated: YYYY-MM-DD`
- Changelog 首条：`v1 (...) — Initial context.`

### 更新文档

只要是实质变化：

1. `vN → vN+1`；
2. `Last updated` 改为当天；
3. Changelog **顶部追加**一条，写清改了什么、为什么；
4. 不删除、不改写历史 Changelog。

纯错别字、排版修正可以不升版本。

### Evidence Status

文档中保留一个 `Evidence Status` 区域：

- 汇总本版最重要的 `inferred` 与 `unknown`；
- 列出需要验证的关键假设；
- 已有来源时可简短记录来源类型/位置；
- 不需要把整个研究日志塞进 Context。

---

# 输出与交接

完成后告诉用户：

1. Context 当前版本；
2. 实际保存位置（如果已保存）；
3. 本次新增/修改了哪些核心章节；
4. 仍有哪些高影响 `inferred` / `unknown`；
5. 后续只有明确支持该 Context 的 Skill 才会读取它，当前 Runtime 不自动注入。

如果当前没有可靠的项目根目录，只提供 Context 内容和建议目标路径，不要声称已经持久化。

---

# 与其他能力的边界

- 需要跨来源验证行业、竞争、趋势或官方事实：使用当前环境的研究能力；若研究本身成为主要任务，应路由到 `research` Category。
- 本 Skill 可以消费研究结果来更新 Context，但不要在这里重造 Deep Research / Community Research 工作流。
- 当前没有自动依赖机制，不要假设执行 `product-marketing-context` 后所有未来 Skill 都会自动加载它。
