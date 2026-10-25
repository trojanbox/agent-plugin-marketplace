---
name: youtube-download
description: "下载单个 YouTube 视频、字幕或纯音频文件，并安全修复下载依赖。视频默认 MP4/最高1080p；字幕默认中文SRT、人工优先同语言自动后备；音频默认MP3。支持指定格式、语言、目录，不覆盖成品、可验证续传。不做播放列表、登录/Cookie、翻译或观点分析；QQ邮件走 email-mail，内容研究由 research 主导。"
phase: operations
---

# YouTube 单视频下载

## 目标与入口

用真实 CLI 下载用户有权获取的单个公开视频，按请求交付视频、字幕或纯音频的**已验证本地文件**。运行入口为相对此 Skill 的 `../../shared/scripts/youtube.mjs`，调用 `node <当前 Plugin 实际路径>/shared/scripts/youtube.mjs ...`。不要猜测机器上的 Plugin 安装绝对路径。

## 核心规则

- `video URL`：默认 MP4、最高 1080p，含音轨；可选 MKV 或更高/更低分辨率上限。可无损合并时不重编码，容器不兼容时允许 FFmpeg 转码。
- `audio URL`：默认 MP3，可选 M4A；独立下载，不自动附带视频或字幕。
- `subtitles URL`：默认中文 SRT，可指定语言/VTT。优先该语言人工字幕，再尝试原生自动字幕；无字幕就报告不可用，不跨语言回退、不翻译或本地语音转写。
- 默认输出到**执行机器当前用户**的 `~/Downloads/YouTube`，可指定绝对目录。默认不覆盖已有成品；覆盖必须有用户明确授权，不能为了继续下载擅自加 `--overwrite yes`。
- 中断后只恢复身份、参数和文件 SHA-256 均匹配的断点。状态不匹配、目录含链接或校验失败时停止，保留证据，不删除用户文件或绕过检查。
- `doctor` 仅做本地依赖检查；`repair` 由 Agent 安全准备下载依赖。环境修复不代表 YouTube 访问已验证成功。

## 按需读取

1. 执行下载、选择参数或解读结果 → 先读 `references/operations.md`。
2. 初次使用、依赖缺失/版本错误、下载器 JavaScript 错误或平台不支持 → 读 `references/dependencies.md`，由 Agent 运行 `repair` 并核对真实结果。不得把可自主修复的问题交给用户手工处理，也不能关闭下载资产校验。
3. 处理外部标题/字幕、路径/权限、重复文件、失败或续传 → 读 `references/security-and-results.md`。

## 完成与停止边界

只有 CLI 返回 `ok:true`、`status:downloaded` 且成品已验证时，才报告已下载及 `file` 实际路径。`file_exists`、部分文件、退出码非零或“本地依赖就绪”均不等于下载完成。实际画质、字幕语言、是否转码按返回结果说明。

仅支持单个视频；频道和纯播放列表链接不处理，含视频 ID 的列表上下文链接仅取该视频。拒绝登录、Cookie 管理、私人/付费/受限内容和直播录制，不通过代理策略、换凭据或平台规避扩展访问权限。

视频观点核查、摘要或社区研究由对应研究 Skill 保持主任务；本 Skill 只提供所需素材文件。邮件附件下载属于 `tools/email-mail`。本 Skill 不自行发邮件、不改 QQ 邮箱配置、不创建 GitHub Issue 或后台任务。
