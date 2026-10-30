# Agent Plugin Marketplace

可被 Claude Code / Codex 直接安装的 Plugin Marketplace：14 个 Plugin、72 个 Public Skill（另有 2 个 internal Skill 只由自用 Runtime 发现），按领域分包；同时保留独立的 `AI_USAGE.md + skill-runtime.js` 自用 Runtime。

```text
Marketplace
  → Plugin
      → Public Skills
      → Internal Skills / shared resources
```

## 两种用法

| 场景 | 用什么 | 入口 |
| --- | --- | --- |
| 只想要 Skill，交给宿主按需发现 | Claude Code / Codex 原生安装 | 下面的安装命令 |
| 需要 Catalog、Routing、Composition 与 internal Skill | 自用 Runtime | `AI_USAGE.md` + `skill-runtime.js` |

两条链互不依赖：宿主安装后直接发现 Public Skills；自用 Runtime 不参与宿主安装链。

## 快速开始

### Claude Code

```bash
claude plugin marketplace add trojanbox/agent-plugin-marketplace
claude plugin install development@agent-plugin-marketplace
```

需要 GitHub Issue 写入的研发流程还要安装 `github@agent-plugin-marketplace`：原生宿主不会自动安装 Composition 依赖。其它 Plugin 把 `development` 换成下方 Plugin 一览中的名称。

Claude 原生分发文件：`.claude-plugin/marketplace.json`、`plugins/<plugin>/.claude-plugin/plugin.json`。

### Codex

```bash
codex plugin marketplace add trojanbox/agent-plugin-marketplace
codex plugin add development@agent-plugin-marketplace
```

Codex 原生分发文件：`.agents/plugins/marketplace.json`、`plugins/<plugin>/.codex-plugin/plugin.json`。

### 安装后验证

```bash
claude plugin list
codex plugin list
node skill-runtime.js list      # 在仓库根目录执行，不依赖宿主
```

前两条需要在对应宿主里安装并登录后才有输出；第三条确认自用 Runtime 的发现结果，与宿主安装无关。

### 更新与卸载

```bash
claude plugin marketplace update agent-plugin-marketplace    # 先刷新 Marketplace 列表
claude plugin update development@agent-plugin-marketplace
claude plugin uninstall development@agent-plugin-marketplace

codex plugin marketplace upgrade                             # 刷新 Git marketplace 快照
codex plugin remove development
```

## Plugin 一览

| Plugin | 版本 | 分类 | Public Skills | 用途 |
| --- | --- | --- | --- | --- |
| `product` | 1.0.0 | Business | 6（+1 internal） | 通用新老产品规划、调研、讨论、结论、体验审查与真实交付验收 |
| `development` | 2.0.2 | Development | 12（+1 internal） | 软件研发：调研/讨论/结论/实施计划 Issue、TDD 任务、测试设计、Bug 根因调查、S 级 Patch |
| `writing` | 4.0.2 | Documents | 10 | 小说流程、清晰化与去 AI 味、管理层沟通、原理科普与操作指南 |
| `finance` | 1.2.0 | Finance | 7 | 公司研究、财报与估值、组合风险、标的筛选、市场雷达、个人财务规划、宏观分析 |
| `education` | 1.2.0 | Education | 5 | 家庭教育指导、学习辅导、K-12 课程方案与分层改造、Anki 卡包 |
| `reasoning` | 1.3.0 | Research | 5 | 发散创意、科学推理、第一性原理、系统思考、结构化辩论 |
| `data` | 1.0.0 | Data | 4 | 数据集探索、统计分析、分析结果 QA、数据可视化 |
| `research` | 1.0.2 | Research | 4 | 外部资料检索、证据综合、领域知识构建、社区调研 |
| `tools` | 2.5.0 | Productivity | 7 | 邮件、媒体下载、OneDrive、systemd 服务/Timer、用户磁盘缓存诊断与安全清理 |
| `github` | 1.0.0 | Productivity | 3 | Issue 生命周期、查重与复发判断、交接同步与远端写入恢复 |
| `web-app-scaffolding` | 1.4.2 | Development | 3 | React+TS、Node+NestJS 与全栈脚手架创建、扩展和审查 |
| `ai-workflow` | 1.0.0 | Development | 2 | Skill Runtime/路由/组合设计与 Agent 目标提示词 |
| `business` | 1.0.1 | Business | 2 | 长期业务上下文与竞争战略分析 |
| `design` | 1.0.1 | Design | 2 | UI mockup、原型、wireframe、deck 与 Design System |

每个 Plugin 的完整路由边界与 Skill 列表：

```bash
node skill-runtime.js list <plugin>
node skill-runtime.js catalog          # 跨 Plugin 发现
```

依赖与前置：

- `development` 的 Issue 写入依赖 `github`；原生宿主不会自动安装。
- `writing`、`reasoning` 可按需组合 `research`；是否组合由主 Skill 正文的条件决定。
- `tools` 的 Node.js CLI 需要 18+；YouTube 的 JS 执行需要 Node.js 22+ 或 Deno，Linux FFmpeg TAR/XZ 解包需要 Python 3 标准库。
- `education/anki-deck-builder` 需要 Python 3.10+ 与 `genanki==0.13.1`，不需要运行中的 Anki。

## 需要细看的 Plugin

### Tools：邮件、媒体下载、OneDrive、systemd 服务/Timer 与用户磁盘清理

七个公开 Skill：`tools/email-mail`、`tools/youtube-download`、`tools/x-download`、`tools/onedrive-files`、`tools/linux-systemd-user`、`tools/linux-systemd-timer`、`tools/linux-disk-cleanup`。systemd 服务/Timer 和用户磁盘清理采用对话引导；磁盘清理默认只读，执行需要**本地主机 TTY 计划绑定挑战确认**（无TTY拒绝），npm 内容寻址缓存统一使用原生 `npm cache verify`，不按年龄删除 `_cacache` 内部文件。TTY 并非独立可信宿主授权，无法抵御同 UID 的恶意终端模拟。邮件、OneDrive 的凭据与配置保留在用户家目录的 `~/.agent-plugin-marketplace/`，不需要重新配置邮箱；systemd 用户服务写入 `~/.config/systemd/user/`，`github` 仍独立。

```bash
claude plugin install tools@agent-plugin-marketplace
# 或：codex plugin add tools@agent-plugin-marketplace
```

完整命令、平台限制、从旧 `email` Plugin 的迁移步骤与安全边界见 [`plugins/tools/README.md`](plugins/tools/README.md)。

### Product

6 个公开入口覆盖产品规划、产品调研、产品讨论、产品结论、体验审查与产品验收；内部共享事实调查按影响面核对相关源码、证据和项目版本。六项按任务独立使用，产品语义与研发实现/测试方案分开，缺少真实结果不报验收通过。详见 [`plugins/product/README.md`](plugins/product/README.md)。

### Development

12 个公开 Skill 覆盖研发 Issue 文档、讨论、结论与交接规格、实施计划与 TDD 任务、业务测试与系统/E2E 测试设计、独立 Bug 根因调查，以及 S 级局部源码 Patch Fast Lane；另有 1 个 internal Skill（`github-incidental-bug-capture`）只由自用 Runtime 发现。只有 S 级 Patch 可直接实施源码修改，M/L 开发由下游 Coding Agent 执行；现成 Issue 的纯 GitHub 写操作走 `github` Plugin。

### Writing

10 个公开 Skill = 7 个小说流程 Skill（讨论、冻结结论、章纲、正文/可写性、文笔精修、统一审查、修订验收）+ 3 个通用写作 Skill（清晰化/去 AI 味、管理层沟通、科普/使用指南）。

- 小说人物、连续性、表达、可读性、节奏和全书终审统一通过 `writing/fiction-review` 按需选择专项模式；Full-book 仍需完整通读和版本绑定。
- `writing/fiction-manuscript-drafting` 有 READINESS_ONLY（只查可写性）和 DRAFT（成文）两种模式，后者必须先通过同一 Readiness Gate。
- `writing/clear-writing` 提供普通清晰化与 Humanizer 模式；`writing/explanatory-writing` 分别提供科学原理讲解与实操指南模式。
- 旧逻辑 ID 不支持自动别名；完整映射、迁移边界及验收见 [Writing v4.0 迁移说明](plugins/writing/MIGRATION-v4.0.md)。

### Education v1.2.0

5 个公开 Skill：`k12-lesson-planning`（从零设计课程）与 `k12-lesson-differentiation`（必须基于可读的现有教案做分层改造）保持稳定，新增 `family-education-guidance`（广义家庭教育行动指导）和 `learning-coach`（儿童、青少年和成人的真实互动学习辅导）。

`anki-deck-builder` 从当前可访问的 Markdown/纯文本或最近一个知识对话主题提炼知识，经用户分批审核并最终确认后生成独立 `.apkg` 与 `cards.json`。Basic 为主，支持 Cloze 与确有双向意义的 Reversed；内容核查按需借助可靠外部证据，不负责 EPUB/PDF 原生解析或同步。

课堂设计可以按提供的中国及其他地区真实课程体系和教材适配，精确标准必须核验；不把美国州标准或 NGSS/C3 方法照搬当成本地官方课标。学习辅导按真实回答选择提示、讲解、练习与反馈，不凭静态文章宣称学会；家长建议按需提供数周尝试计划，不自动追踪儿童，不做心理/学习障碍诊断或正式考试评分。具体权限和适龄要求仍服从当前宿主。

### GitHub 与 Reasoning 边界

`github` 提供 Issue 管理、查重与交接同步；三个 Skill 的 canonical ID 统一为 `github/github-issue-manager`、`github/github-issue-triage`、`github/github-issue-handoff-sync`，不保留旧 Development 实现。跨 Plugin 资源按已安装 Skill 路径定位。

`reasoning/divergent-ideation` 负责跨领域创意发散；`scientific-reasoning` 负责事实、竞争假设、因果机制与预测；`first-principles` 负责从基本事实和约束重新构建方案；`systems-thinking` 负责反馈回路、反身性和动态演化；`structured-debate` 负责观点攻防与命题版本。选定小说后进入 Writing 的创作讨论；仅在要求 GitHub 留档时组合 github Plugin，辩论 Issue 必须使用 `【辩论】` 前缀。研发源码、决策、测试与 Patch 规则仍由 Development 持有。

### Web App Scaffolding

`react-typescript-frontend-scaffold`、`node-nestjs-backend-scaffold`、`react-nestjs-fullstack-scaffold` 分别绑定具体技术栈；frontend/backend/fullstack 只是 Group 软分组。详见 [`plugins/web-app-scaffolding/README.md`](plugins/web-app-scaffolding/README.md)。

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

在仓库根目录执行上述命令即可；`plugins/<plugin>/shared/scripts/` 下的脚本同理，安装到宿主后位于插件安装目录，由 Agent 解析实际路径，不要照抄仓库相对路径。

## 维护与校验

修改 Marketplace / Plugin / Skill / Group metadata / 路由 / Composition 后运行：

```bash
node scripts/generate-host-manifests.mjs
node scripts/validate-host-manifests.mjs
node skill-runtime.js doctor
python3 -m unittest discover -s tests -p 'test_*.py'
node --test plugins/tools/shared/tests/*.mjs
```

CI 会重新生成 Host manifests，并通过 `git diff --exit-code` 阻止生成产物与 Canonical Source 漂移。

Linux systemd CLI/Timer 测试使用隔离临时家目录和模拟 systemctl/loginctl/journalctl/systemd-analyze；Linux 磁盘清理测试在隔离临时家目录内执行真实文件元数据扫描与删除，不影响当前用户的真实缓存。不代表真实服务器的重启自启、补跑或各种磁盘文件系统运行行为已验证。真实 FFmpeg 集成测试使用本地生成媒体与下载器替身，无需 QQ 凭据或 YouTube/X 账号；可通过 `YOUTUBE_TEST_FFMPEG` / `YOUTUBE_TEST_FFPROBE` 指定可执行文件，缺少时明确标记为跳过。OneDrive 使用模拟 Microsoft Graph HTTP/OAuth 响应测试，不能替代用户授权的真实云端联调。实际 YouTube/X 网络可用性与跨平台原生执行也需要另外验证。

## 目录结构

```text
AI_USAGE.md                 自用 Runtime 稳定入口
skill-runtime.js            Catalog / Routing / Composition
marketplace.json            Canonical Catalog
PLUGIN_MODEL.md             Plugin 模型
SKILL_COMPOSITION.md        Composition 规范
scripts/
  generate-host-manifests.mjs
  validate-host-manifests.mjs
  host-manifest-lib.mjs
.claude-plugin/
  marketplace.json          Claude 生成产物
.agents/plugins/
  marketplace.json          Codex 生成产物
plugins/
  <plugin>/
    plugin.json
    README.md               （部分 Plugin 提供）
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
tests/                      契约测试与语义路由评测
vendor/baoyu-design/        design Plugin 的上游固定快照
```

`internal-skills/` 仅在确有内部组合能力时存在。该目录由自用 Runtime 扫描，不进入 Claude / Codex 默认 Skill discovery。`vendor/baoyu-design/` 是 `design` Plugin 的上游源码固定快照，用于离线读取方法与素材，许可见 `vendor/baoyu-design/LICENSE`。

## 设计原则

- 根 `marketplace.json` 负责 Canonical Catalog、分类、Plugin 来源与 Marketplace identity。
- `plugins/<plugin>/plugin.json` 负责 Plugin identity、版本、Public/Internal Skill roots、shared resources 和 Group metadata。
- `skills/` 只包含宿主可发现的 Public Skills。
- `internal-skills/` 只包含自用 Runtime 的内部组合能力。
- Claude / Codex Host Adapter 只负责分发，不复制 `uses / optional_uses / groups / phase / visibility` Composition Engine。
- `AI_USAGE.md + skill-runtime.js` 保留为独立自用入口，不参与宿主安装链。

## 文档索引

- [`AI_USAGE.md`](./AI_USAGE.md)：自用 Runtime 的 bootstrap 与日常路由。
- [`PLUGIN_MODEL.md`](./PLUGIN_MODEL.md)：Canonical 分层与 Host 分发层。
- [`SKILL_COMPOSITION.md`](./SKILL_COMPOSITION.md)：`uses / optionalUses`、Group、phase 与 visibility 规范。
- [`plugins/tools/README.md`](./plugins/tools/README.md)：邮件、YouTube、X、OneDrive、Linux systemd 服务、Timer 与用户磁盘清理的完整用法与迁移。
- [`plugins/writing/MIGRATION-v4.0.md`](./plugins/writing/MIGRATION-v4.0.md)：Writing v4.0 旧 ID 映射。
- [`plugins/web-app-scaffolding/README.md`](./plugins/web-app-scaffolding/README.md)：脚手架模板说明。
- [`BAOYU_DESIGN_INTEGRATION.md`](./BAOYU_DESIGN_INTEGRATION.md)：design Plugin 的上游隔离与离线交付。
- `tests/`：契约测试，以及 `tests/*-semantic-routing-eval.md` 语义路由评测语料。
