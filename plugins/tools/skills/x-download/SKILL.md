---
name: x-download
description: "下载单个 X/Twitter 公开帖子的 MP4 视频（支持无声动图/GIF）或提取 MP3 音频，安全修复 yt-dlp/FFmpeg 依赖；支持标题命名、文件校验、安全续传和选择 /video/1～4。仅处理公开视频，不使用登录/Cookie、不下载图片/Spaces/用户主页/批量内容。"
phase: operations
---

# X/Twitter 公开帖子媒体下载

## 入口与职责

使用当前 Plugin 中的真实 CLI `../../shared/scripts/x.mjs` 下载用户有权获取的**一条公开 X/Twitter 帖子中的一个视频/动图**。运行命令为 `node <实际 tools Plugin 根路径>/shared/scripts/x.mjs video|audio URL`；从当前 Plugin/Skill 的实际路径定位脚本，不能猜测安装目录。

此 Skill 只负责下载**媒体文件**，不会分析帖子观点、抓取私有内容、管理登录凭据或修改其他平台配置。X 有时限制匿名访问；应如实返回访问失败，不尝试绕过访问控制。

## 基本合同

- `video URL`：默认 MP4、分辨率上限 1080p，尽可能无损封装；必要时用 FFmpeg 转码。X 的动画 GIF 实际常为**无声视频**，保存为 MP4；验证时允许没有音轨。
- `audio URL`：默认 MP3；可选 M4A。来源必须有真实音轨，无声动画直接报告不可提取。
- URL 支持 `x.com` 或 `twitter.com` 的单帖状态链接（含 www/mobile 变体及 `/video/1～4`）。当帖子有多个视频时，使用对应的 `/video/N` 明确选择；不批量下载。
- 默认输出到**当前执行用户**的 `~/Downloads/X`；文件名来自视频/帖子标题，安全清理路径符号、控制字符和不兼容名字，超长截断；标题缺失时回退帖子 ID。
- 默认**不覆盖**已有文件；只有用户明确授权才能传 `--overwrite yes`。下载、处理、格式/时长/完整解码和 SHA-256 检验通过后才提交文件。
- 内部锁与断点使用帖子 ID、媒体序号、模式/格式/分辨率建立请求身份。恢复先核对源媒体 ID、选中流及所有临时文件摘要；不匹配就停止，不能跳过校验。
- `doctor` 仅检查本地已验证下载依赖；`repair` 检查并自主安全修复缺失依赖，二者都不说明 X 的网络访问是否成功。复用 tools 已有经过完整性检查的 yt-dlp、FFmpeg 与 Node/Deno 运行时。

## 按需读取

1. 真正下载、参数选择或解释 JSON → 读取 `references/operations.md`。
2. 首次使用、依赖缺失或版本不兼容 → 读取 `references/dependencies.md`；由 Agent 在允许范围内执行 `repair`，不要让用户手工安装或关闭校验。
3. 遇到链接异常、受限媒体、文件冲突、安全错误或恢复失败 → 读取 `references/security-and-results.md`。

## 成功与停止

仅当 X CLI 返回 `ok:true`、`status:downloaded`，且确实通过完整媒体验证时，才报告成品的真实 `file`、格式、大小、时长与实际画质。下载器只安装成功或临时分片存在时不能报告成功。X 某些帖子可能要求登录或随平台变化而无法匿名访问；拒绝自动读取浏览器 Cookie、账户密码、私有/付费/地区受限资源或使用非官方镜像绕过。

不处理图片下载、搜索结果、Space 音频直播、完整用户主页、转推列表、海量媒体批处理或文章正文抓取。对媒体内容的事实核查和摘要留给研究 Skill；QQ 邮箱走 `tools/email-mail`；YouTube 走 `tools/youtube-download`。
