# 下载依赖、自修复与平台边界

首次接入、依赖缺失/过旧、JavaScript/EJS 错误或平台不支持时读取。**由 Agent 执行诊断与受控修复**，不能让用户手工安装 yt-dlp、FFmpeg 或编辑 PATH；无法在已授权范围内安全恢复时，报告真实原因。

## 执行流程

```sh
node <plugin>/shared/scripts/youtube.mjs doctor
node <plugin>/shared/scripts/youtube.mjs repair
```

正常下载也会检查并恢复缺失依赖。`doctor` 不自动安装、不连接 YouTube；`repair` 不下载媒体。先检查宿主已有可用工具，再使用用户私有的验证版本。显式指定的工具路径不兼容时明确报错，不悄悄换到另一个程序。

## 固定官方资产

发布资产及可信 SHA-256、文件大小、精确压缩包成员在 `../../shared/scripts/youtube-releases.json`（相对此 Skill 根目录）。维护时通过官方发行资料核验并更新清单，不运行不受控的 `yt-dlp -U` 或任意远程安装脚本。

| 依赖 | 此实现的验证基线 | 用途 |
|---|---|---|
| yt-dlp | 官方 `2026.10.21` 独立可执行文件，含 EJS | 仅单个 YouTube 视频的媒体与字幕提取 |
| FFmpeg / ffprobe | yt-dlp 官方 FFmpeg-Builds `autobuild-2026-10-24-17-20` | 合并、必要时重新编码、字幕转换、文件探测和完整解码校验 |
| JavaScript | 宿主 Node.js 22+，或可用 Deno 2.3+；需要时安装固定 Deno `v2.9.8` | 运行 yt-dlp 随包的 EJS 解算组件 |
| Node.js | CLI 本身需要 Node.js 18+ | 运行本 Plugin 脚本；低于 22 时按需准备 Deno |
| Python（仅 Linux FFmpeg 自动解包） | 宿主 Python 3.8+ 且带标准库 lzma/tarfile | 对已校验 TAR/XZ 包流式提取精确的普通二进制文件，不使用 extractall |

官方资料：
- yt-dlp：[README](https://github.com/yt-dlp/yt-dlp)、[固定发行版](https://github.com/yt-dlp/yt-dlp/releases/tag/2026.10.21)。
- FFmpeg：[yt-dlp 官方构建](https://github.com/yt-dlp/FFmpeg-Builds)、[固定发行版](https://github.com/yt-dlp/FFmpeg-Builds/releases/tag/autobuild-2026-10-24-17-20)。
- Deno：[固定发行版](https://github.com/denoland/deno/releases/tag/v2.9.8)。

### 平台范围

- Linux glibc x64 / ARM64、Windows x64 / ARM64：清单包含 yt-dlp、FFmpeg/ffprobe 和 Deno 的固定资产。是否实际可执行仍受操作系统最低版本、动态库和架构影响；Linux x64 已在隔离家目录执行安装验证，不能据此宣称其他平台都已实测。
- macOS x64 / ARM64：yt-dlp 和 Deno 有官方资产；**yt-dlp 的 FFmpeg-Builds 当前没有 macOS 构建**。可使用宿主已经可用的 FFmpeg/ffprobe。缺少时返回 `unsupported_platform`，不能为了声称跨平台完整而安装未核验的第三方二进制。
- musl Linux：清单提供 yt-dlp 资产；FFmpeg/Deno 若没有匹配的官方资产则停止，或使用宿主实际可运行的工具；不把 glibc 二进制当作 musl 兼容版本。
- CLI 运行环境 Node 本身不在此脚本内自举。Agent 应通过已授权宿主软件能力准备环境；无法安全取得所需 Node/Python 或官方媒体依赖时如实报告，而非改用来源不明的下载器。

## 私有存储与隔离

- YouTube 工具仅写入当前执行用户 `~/.agent-plugin-marketplace/youtube/`，固定版本放 `bin/<tool>-<version>-<platform>-<sha>/`。
- 每个安装目录带回执，保存已验证的归档摘要及解出的可执行文件摘要；后续使用验证文件完整性。安装过程在私有临时目录完成，再发布成正式版本。
- QQ 邮箱原路径 `~/.agent-plugin-marketplace/email/` **不改变、不拷贝、不清空**。YouTube 依赖、断点和媒体文件都不应进入该目录。
- POSIX 新目录 0700、可执行文件 0700、状态文件 0600；Windows 新私有目录由当前用户 SID 和 SYSTEM ACL 控制。已有目录异常或属于其他用户时不越权修复。
- 已有系统工具仅在其实际版本适用时使用，不覆盖或删除系统安装；私有受管版本损坏时仅替换自身受管条目，不触碰系统路径。

## 宿主控制项

| 环境变量 | 含义 |
|---|---|
| `YOUTUBE_AUTO_INSTALL=0` | 禁止自动安装；Agent 必须尊重，不能临时去掉禁令绕过 |
| `YOUTUBE_YTDLP_BIN` | 显式 yt-dlp 绝对可执行路径；无效或版本过旧就报错 |
| `YOUTUBE_FFMPEG_BIN` | 显式 FFmpeg 绝对路径；配套 ffprobe 默认位于同一目录 |
| `YOUTUBE_FFPROBE_BIN` | 显式 ffprobe 绝对路径，必须与指定 FFmpeg 位于同一目录 |
| `YOUTUBE_DENO_BIN` | 显式 Deno 绝对路径；不兼容时报告错误 |

使用宿主自带 yt-dlp 时，版本探测不能证明 EJS 已安装，因此本地报告 `host_package_requires_ejs`；受管官方独立版报告 `bundled_in_verified_yt_dlp`。如果实际请求明确表明宿主版缺少 EJS，且宿主允许自动安装、没有显式锁定路径，可按根因换用已验证官方受管版本并重试一次。登录、限流、地区或私人访问错误不得触发自动换身份/重复重试。

## 不能绕过的失败边界

安装仅允许 GitHub 官方发行资产与其 HTTPS 资产域跳转；每个文件固定大小和 SHA-256 不匹配就停止。ZIP 仅解出清单中的精确普通文件；TAR/XZ 以流式读取方式拷贝精确成员，拒绝链接、越界和重复成员。没有可验证资产、网络不可达、权限不足、缺少受支持的解包能力、CPU/系统不适配都属于真实阻塞，不能关闭校验、使用 sudo、下载任意替代包或把失败报告为就绪。
