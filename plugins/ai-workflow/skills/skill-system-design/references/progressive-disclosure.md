# Progressive Disclosure / 渐进披露规范

用于审计 Runtime 的上下文预算与拆分方式。

## Agent Skills 官方原则

- Agent 启动时只需要 Skill 的 `name + description` 元数据。
- Skill 激活后会把完整 `SKILL.md` 主体加载到上下文，因此主文件的每个 token 都会与用户对话、系统上下文和其它已激活 Skill 竞争注意力。
- 官方建议 `SKILL.md` 主体控制在 **5,000 tokens 以内**，并保持 **500 行以内**。
- 长参考资料、模板、专项模式和只在少数分支需要的细节应移到 `references/`；脚本放 `scripts/`，静态模板/资源放 `assets/`。
- reference 要聚焦、按需读取；`SKILL.md` 应明确写出“什么时候读哪个文件”。
- 从 `SKILL.md` 出发的文件引用尽量保持单层，避免深层 reference 链。

来源：Agent Skills Specification 的 Progressive disclosure / File references，以及 Best practices 的 Spending context wisely / Structure large skills with progressive disclosure。

## 本 Runtime 的更保守预算

官方 token 数无法用简单字节数精确替代，因此 Runtime 采用可自动检查的保守代理：

| 层级 | 内部预算 | 职责 |
|---|---:|---|
| `AI_USAGE.md` | ≤ 4 KiB | bootstrap / discovery only |
| `marketplace.json` | ≤ 8 KiB | Catalog / Plugin source metadata |
| `plugin.json` | ≤ 8 KiB | Plugin identity/version/namespace/Group metadata |
| `SKILL.md` | ≤ 5,000 字符且 ≤ 500 行 | 每次激活都需要的核心合同 |
| `references/*.md` | 建议 ≤ 6,000 字符 | 单一主题的按需细节 |

字符预算是 Runtime 自己的上下文防回归约束，不等同于官方 token 上限。

## 拆分判断

优先移出主文件：

- 长输出模板；
- 详细字段表/检查表；
- 只在某一种模式触发的专项流程；
- 示例集合；
- 长协议、证据格式、兼容矩阵；
- 发布/持久化细节（若并非每次执行都需要）。

优先留在主文件：

- 什么时候使用 / 不使用；
- 唯一目标；
- 主流程；
- 每次都必须遵守的安全/真实性边界；
- `uses / optional_uses` 的触发条件；
- 会导致错误路由或错误副作用的关键 gotcha；
- 明确的停止条件。
