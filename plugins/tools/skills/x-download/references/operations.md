# X/Twitter 下载操作合同

先确保操作的是用户允许下载的公开媒体。通过当前 tools Plugin 的 `shared/scripts/x.mjs` 运行：

```bash
node <plugin>/shared/scripts/x.mjs --help
node <plugin>/shared/scripts/x.mjs doctor
node <plugin>/shared/scripts/x.mjs repair
node <plugin>/shared/scripts/x.mjs video 'https://x.com/example/status/2103382268051964103'
node <plugin>/shared/scripts/x.mjs audio 'https://twitter.com/example/status/2103382268051964103'
node <plugin>/shared/scripts/x.mjs video 'https://x.com/example/status/2103382268051964103/video/2' --max-height 720
node <plugin>/shared/scripts/x.mjs audio URL --format m4a --dir /absolute/output
```

示例 URL 只演示结构；执行时用用户提供的真实帖子链接。命令由 Agent 执行，不能要求用户手工准备 yt-dlp、FFmpeg、Cookie 或授权码。

| 模式 | 参数 |
|---|---|
| `video URL` | `--format mp4\|mkv`（默认 mp4）；`--max-height 1080`，范围 144～16384；`--dir ABS`；`--overwrite no\|yes`；`--timeout 7200` |
| `audio URL` | `--format mp3\|m4a`（默认 mp3）；`--dir ABS`；`--overwrite no\|yes`；`--timeout 7200` |
| `doctor` / `repair` | 不接受额外参数。依赖检查/修复，不下载媒体 |

`--timeout` 单位秒，范围 10～86400。URL 为 HTTPS 的 x.com/twitter.com 用户 `/status/<数字 ID>`，可加 `/video/1` 到 `/video/4` 指定一个媒体。跟踪参数会剥离。不会自动爬取多个帖子、下载所有图片、登录或翻译。

## 输出及验证

- 输出目录：当前执行用户 `~/Downloads/X`，或显式绝对目录。
- 文件名：`<安全化标题>.h1080.mp4` / `<安全化标题>.mp3` / `<安全化标题>.video2.h1080.mp4`。标题主体最多 180 UTF-8 字节；缺失使用 `X-<帖子ID>`。h1080 表示画质上限；实际分辨率以结果 `height` 为准。
- 不覆盖同名文件，冲突返回 `file_exists` 与 `existing_file`。帖子改标题后可能采用新文件名，不擅自移动或删除旧文件。
- X 的单帖 ID 可能不同于实际视频 ID；下载器会校验 `post_id` 和 `media_id`。多视频帖子如果不能唯一选择，返回 `multiple_media_unsupported`，可尝试附上明确的 `/video/N` 链接。
- GIF 在 X 上通常是无声短 MP4；下载视频允许没有音轨，音频模式遇到无声视频时返回不可提取。

成功 JSON 形状：

```json
{
  "ok": true,
  "status": "downloaded",
  "platform": "x",
  "mode": "video",
  "post_id": "2103382268051964103",
  "media_id": "2103381602994659329",
  "media_index": null,
  "file": "/home/user/Downloads/X/视频标题.h1080.mp4",
  "format": "mp4",
  "size": 123456,
  "sha256": "<实际 SHA-256>",
  "duration": 29.4,
  "width": 480,
  "height": 852,
  "video_codec": "h264",
  "audio_codec": "aac",
  "transcoded": false,
  "recovered": false,
  "untrusted": true
}
```

以上值仅示例。实际成功必须验证格式、时长、视频/音轨、完整解码、文件大小与 SHA-256；无声视频的 `audio_codec` 为 `null`。失败统一返回 `ok:false` 和状态，不能把安装依赖成功当作已下载。

## 恢复和同名保护

恢复状态保存在输出目录下私有 `.x-partials/<request-key>/`，与 YouTube 的 `.youtube-partials` 隔离；锁阻止同一帖子、媒体、格式与画质并发写入。必须确认任务身份、选定媒体 ID/流和每个临时文件 SHA-256 全部匹配才继续。旧锁仅在确认同机进程死亡后恢复。

同名成品默认不覆盖；只有用户明确指定才允许 `--overwrite yes`。工具先在临时目录完成媒体转换和完整验证，再原子替换同名成品。由于 X 会更改权限和匿名 API，真实网络下载可失败；错误报告应保留当前已验证断点，不能绕过平台限制。
