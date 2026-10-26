# X 下载依赖与维护

X 下载与 `tools/youtube-download` 使用同一个已验证的 yt-dlp/FFmpeg/ffprobe + Node/Deno 工具链，不再单独维护可执行文件、副本或用户凭据。宿主现有依赖及设置保持不变，尤其不能修改 QQ 邮箱配置。

```bash
node <plugin>/shared/scripts/x.mjs doctor
node <plugin>/shared/scripts/x.mjs repair
```

`doctor` 只检查本地依赖，`repair` 用官方已固定的 SHA-256 资产进行缺失依赖的受控安装/修复，不能绕开 `YOUTUBE_AUTO_INSTALL=0` 等宿主原有禁止选项。X/Twitter 视频与 YouTube 有不同的网络访问规则：依赖就绪 **不代表** X 公开视频可匿名访问。

详细的包版本、官方来源、校验、平台限制、环境变量及 macOS/Windows/Linux 兼容边界参阅同一 Plugin 中 `../../youtube-download/references/dependencies.md`；该文件只在真正需要初次安装或诊断依赖问题时读取。X 的输出目录为 `~/Downloads/X`，恢复状态使用其私有 `.x-partials`，不会影响邮件设置或 YouTube 已下载文件。
