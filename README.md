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

## Tools Plugin：邮件、媒体下载与 OneDrive 云存储

`tools` 把日常邮件、媒体下载与当前用户的 OneDrive 云文件管理放在一个安装包，`github` 仍独立。四个公开 Skill 为 `tools/email-mail`、`tools/youtube-download`、`tools/x-download` 和 `tools/onedrive-files`。

```bash
claude plugin install tools@agent-plugin-marketplace
# 或：codex plugin add tools@agent-plugin-marketplace
node plugins/tools/shared/scripts/email.mjs --help
node plugins/tools/shared/scripts/youtube.mjs --help
node plugins/tools/shared/scripts/x.mjs --help
node plugins/tools/shared/scripts/onedrive.mjs --help
```

### 从独立 Email Plugin 迁移

升级后安装 `tools`，停用/卸载宿主中的旧 `email` Plugin；旧 `email/email-mail` ID 改为 `tools/email-mail`，不保留两个兼容 Plugin。**用户原来的 `~/.agent-plugin-marketplace/email/config.toml`、QQ 授权码、默认收件人、`email/bin/` 中的 Himalaya 及目录权限都保持原样**，新工具直接读取，不需要重新配置邮箱，也不要手动移动或删除家目录里的邮件文件。

邮件原有搜索（默认 INBOX，可指定文件夹）、读取正文、发送（含普通附件）、收到附件下载以及 Himalaya 2.2.1 自修复不变。Agent 在任务授权内可主动发送；发送结果未知时绝不自动重发。实际 QQ 收发依赖有效授权码和服务端可用性，不能从本地测试推断送达。详见 [邮件配置](plugins/tools/skills/email-mail/references/setup.md) 与 [邮件操作](plugins/tools/skills/email-mail/references/operations.md)。

### YouTube 单视频下载

```bash
node plugins/tools/shared/scripts/youtube.mjs repair
node plugins/tools/shared/scripts/youtube.mjs video URL
node plugins/tools/shared/scripts/youtube.mjs video URL --format mkv --max-height 2160
node plugins/tools/shared/scripts/youtube.mjs audio URL --format m4a
node plugins/tools/shared/scripts/youtube.mjs subtitles URL --lang zh --format srt
```

`URL` 替换为单个公开视频链接。视频默认 **MP4 / 最高 1080p**，音频默认 **MP3**，字幕默认 **中文 SRT**（可选语言/VTT；人工优先，同语言原生自动字幕后备，无目标语言就明确不可用）。默认输出到执行用户 `~/Downloads/YouTube`，可用 `--dir` 指定绝对目录；默认不覆盖，可校验续传，必要时允许 FFmpeg 真正转码。视频文件在格式/音轨/时长/解码验证通过后才报告成功。

依赖由 Agent 检查并从固定官方版本、SHA-256 校验后的资产安装到用户家目录，不修改系统软件或邮箱配置。Node.js CLI 需要 18+；YouTube JS 执行用 Node.js 22+ 或 Deno，Linux FFmpeg TAR/XZ 的安全解包需要 Python 3 标准库。**目前官方 yt-dlp FFmpeg-Builds 没有 macOS 资产**：macOS 可用既有 FFmpeg/ffprobe，缺少时会明确报告平台阻塞，不使用未经核验的包。

[参数与结果](plugins/tools/skills/youtube-download/references/operations.md) · [依赖与平台支持](plugins/tools/skills/youtube-download/references/dependencies.md) · [安全与恢复](plugins/tools/skills/youtube-download/references/security-and-results.md)

### X / Twitter 公开视频下载

```bash
node plugins/tools/shared/scripts/x.mjs doctor
node plugins/tools/shared/scripts/x.mjs video 'https://x.com/user/status/1234567890123456789'
node plugins/tools/shared/scripts/x.mjs audio 'https://x.com/user/status/1234567890123456789'
node plugins/tools/shared/scripts/x.mjs video 'https://x.com/user/status/1234567890123456789/video/2' --max-height 720
```

仅支持单条**公开视频**及其音轨，默认 MP4（最高 1080p）或 MP3；无声动画 GIF 保存为无声 MP4，无法提取音频。多视频帖需在 URL 中用 `/video/N` 选择一个，不下载用户主页、图片、Spaces、付费/私有内容或批量帖子。默认保存到 `~/Downloads/X`，以安全化标题命名；与 YouTube 共享已校验的 yt-dlp/FFmpeg 依赖，但锁与断点目录独立。**不会登录 X、读取 Cookie 或绕过访问限制**，实际能否下载取决于该帖子及 X 当前公开接口。

[X 操作与返回结果](plugins/tools/skills/x-download/references/operations.md) · [依赖与平台限制](plugins/tools/skills/x-download/references/dependencies.md) · [X 安全与错误处理](plugins/tools/skills/x-download/references/security-and-results.md)

### OneDrive 云文件管理（微软 Graph v1.0）

使用当前微软账号的委派 `Files.ReadWrite` 权限。需要用户自行注册微软 Entra **Public Client** 应用并提供公开 Client ID；应用可选择允许个人、工作/学校账号。工具不收集密码、Client Secret 或 Cookie。

```bash
node plugins/tools/shared/scripts/onedrive.mjs configure CLIENT_ID --tenant common
node plugins/tools/shared/scripts/onedrive.mjs auth start
# 用户在微软网页输入设备码、完成授权后：
node plugins/tools/shared/scripts/onedrive.mjs auth complete
node plugins/tools/shared/scripts/onedrive.mjs list /
node plugins/tools/shared/scripts/onedrive.mjs search '笔记'
node plugins/tools/shared/scripts/onedrive.mjs info 'Documents/笔记.txt'
node plugins/tools/shared/scripts/onedrive.mjs download 'Documents/笔记.txt'
node plugins/tools/shared/scripts/onedrive.mjs upload /absolute/report.pdf 'Documents'
node plugins/tools/shared/scripts/onedrive.mjs mkdir 'Documents/备份'
node plugins/tools/shared/scripts/onedrive.mjs trash 'Documents/旧稿.txt' --confirm yes
```

以上 `CLIENT_ID` 是占位符。所有云端路径相对于当前用户 OneDrive 根目录；默认下载到 `~/Downloads/OneDrive`，并防止未经确认覆盖。上传采用分片会话；下载校验大小和可用远端摘要后才发布。Token 存入私有 `~/.agent-plugin-marketplace/onedrive/`，与原 QQ 邮件和视频配置隔离。首版不处理共享站点、跨账号同步或永久删除。**没有用户的 Client ID/设备码授权时，只能进行模拟接口测试，不能宣称真实 OneDrive 联调成功。**

[OneDrive 操作与结果](plugins/tools/skills/onedrive-files/references/operations.md) · [首次授权配置](plugins/tools/skills/onedrive-files/references/auth.md) · [安全与风险边界](plugins/tools/skills/onedrive-files/references/security-and-results.md)

### 本地测试

```bash
node scripts/generate-host-manifests.mjs
node scripts/validate-host-manifests.mjs
node skill-runtime.js doctor
python3 -m unittest discover -s tests -p 'test_*.py'
node --test plugins/tools/shared/tests/*.mjs
```

真实 FFmpeg 集成测试使用本地生成媒体与下载器替身，无需 QQ 凭据或 YouTube/X 账号；可通过 `YOUTUBE_TEST_FFMPEG` / `YOUTUBE_TEST_FFPROBE` 指定可执行文件，缺少时明确标记为跳过。OneDrive 使用模拟 Microsoft Graph HTTP/OAuth 响应测试，不能替代用户授权的真实云端联调。实际 YouTube/X 网络可用性与跨平台原生执行也需要另外验证。

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

## Writing v4.0：十个公开入口

Writing 现有 7 个小说流程 Skill（讨论、冻结结论、章纲、正文/可写性、文笔精修、统一审查、修订验收）与 3 个通用写作 Skill（清晰化/去 AI 味、管理层沟通、科普/使用指南）。

- 小说人物、连续性、表达、可读性、节奏和全书终审统一通过 `writing/fiction-review` 按需选择专项模式；Full-book 仍需完整通读和版本绑定。
- `writing/fiction-manuscript-drafting` 现在有 READINESS_ONLY（只查可写性）和 DRAFT（成文）两种模式，后者必须先通过同一 Readiness Gate。
- `writing/clear-writing` 提供普通清晰化与 Humanizer 模式；`writing/explanatory-writing` 分别提供科学原理讲解与实操指南模式。
- 旧逻辑 ID 不支持自动别名；完整映射、迁移边界及验收见 [Writing v4.0 迁移说明](plugins/writing/MIGRATION-v4.0.md)。

## Education v1.1.0：教师、家长与全年龄学习者

Education 由 2 个公开 Skill 扩展为 **4 个**：保留 `education/k12-lesson-planning`（从零设计课程）与 `education/k12-lesson-differentiation`（必须基于可读的现有教案做分层改造），新增 `education/family-education-guidance`（广义家庭教育行动指导）和 `education/learning-coach`（儿童、青少年和成人的真实互动学习辅导）。

课堂设计可以按提供的中国及其他地区真实课程体系和教材适配，精确标准必须核验；不把美国州标准或 NGSS/C3 方法照搬当成本地官方课标。学习辅导按真实回答选择提示、讲解、练习与反馈，不凭静态文章宣称学会；家长建议按需提供数周尝试计划，不自动追踪儿童，不做心理/学习障碍诊断或正式考试评分。具体权限和适龄要求仍服从当前宿主。

## GitHub 与 Reasoning 边界

`github` 提供 Issue 管理、查重与交接同步；这三个 Skill 的 canonical ID 统一为 `github/github-issue-manager`、`github/github-issue-triage`、`github/github-issue-handoff-sync`，不保留旧 Development 实现。跨 Plugin 资源按已安装 Skill 路径定位。

`reasoning/divergent-ideation` 负责跨领域创意发散；`scientific-reasoning` 负责事实、竞争假设、因果机制与预测；`first-principles` 负责从基本事实和约束重新构建方案；`systems-thinking` 负责反馈回路、反身性和动态演化；`structured-debate` 负责观点攻防与命题版本。选定小说后进入 Writing 的创作讨论；仅在要求 GitHub 留档时组合 github Plugin，辩论 Issue 必须使用 `【辩论】` 前缀。研发源码、决策、测试与 Patch 规则仍由 Development 持有。
