# YouTube CLI 操作与输出合同

执行下载、选择参数或解释输出时读取。所有调用使用已发现的真实 Plugin 根目录：

```sh
node <plugin>/shared/scripts/youtube.mjs --help
node <plugin>/shared/scripts/youtube.mjs doctor
node <plugin>/shared/scripts/youtube.mjs repair
node <plugin>/shared/scripts/youtube.mjs video 'https://youtu.be/VIDEO_ID_11'
node <plugin>/shared/scripts/youtube.mjs video URL --format mkv --max-height 2160 --dir /absolute/output
node <plugin>/shared/scripts/youtube.mjs audio URL --format m4a
node <plugin>/shared/scripts/youtube.mjs subtitles URL --lang zh --format srt
node <plugin>/shared/scripts/youtube.mjs subtitles URL --lang en --format vtt
```

`VIDEO_ID_11` / `URL` 为占位，必须替换为用户提供的视频链接。Windows 目录示例：`--dir 'D:\下载\YouTube'`。命令由 Agent 执行，用户不需要手工安装依赖或配置 PATH。

## 参数

| 子命令 | 参数与默认值 |
|---|---|
| `video URL` | `--format mp4` 或 `mkv`；`--max-height 1080`（整数 144～16384）；`--dir ABS`；`--overwrite no`；`--timeout 7200` |
| `audio URL` | `--format mp3` 或 `m4a`；`--dir ABS`；`--overwrite no`；`--timeout 7200` |
| `subtitles URL` | `--lang zh`；`--format srt` 或 `vtt`；`--dir ABS`；`--overwrite no`；`--timeout 7200` |
| `doctor` | 不接受额外参数。只检查依赖，不安装、不访问视频、不改变邮件配置 |
| `repair` | 不接受额外参数。检查并安全安装缺失/不兼容依赖；不下载媒体 |

`--timeout` 单位为秒，支持 10～86400。额外参数、重复选项、Cookies、任意 yt-dlp 参数和 shell 指令均不转发。视频 URL 支持 HTTPS 的 youtube.com/watch、shorts、embed、live（仅已完成视频）、youtu.be。watch 链接中的 list、时间戳和跟踪参数被移除，始终只处理一个视频；不对纯播放列表、频道、其他站点执行下载。

## 字幕精确语义

- 默认 `zh` 可匹配已提供的中文区域/字形标签：精确 `zh` 优先，再按稳定规则选择简体及繁体等中文变体。实际标签在结果中报告。
- 显式 `zh-Hans` 可匹配等价 `zh-CN` / `zh-SG`；显式 `zh-Hant` 可匹配 `zh-TW` / `zh-HK` / `zh-MO`。明确指定字形/区域时不改为另一种字形或其他语言。`en` 可匹配英语区域变体；显式区域优先精确匹配。
- 人工字幕优先于同语言自动字幕。YouTube `automatic_captions` 中带 `tlang` 的自动翻译轨道被排除；`-orig` 原生 ASR 标签按实际语言报告。
- 用户说中文/简体中文/繁体中文/英文/英语/日文/日语时支持对应别名；也可直接提供标准语言标签。禁止逗号、多语言列表和正则通配符。
- 选定语言缺失时返回 `subtitle_unavailable`，不会下载英文代替中文，也不会自动翻译或从音频重新转写。

## 文件与下载结果

默认目录为实际执行用户的 `~/Downloads/YouTube`。从已经验证的单视频元数据读取标题，规范化为安全的跨平台文件名（保留中文，替换路径/保留字符、移除控制与格式字符，UTF-8 标题主体最多 180 字节；超长时尽量在句末截断并添加省略号；标题缺失或清理后为空则回退视频 ID）：

```text
<安全化视频标题>.h1080.mp4
<安全化视频标题>.h2160.mkv
<安全化视频标题>.mp3
<安全化视频标题>.zh.srt
```

`h1080` 表示请求上限；实际视频可能为 720p，以结果的 `height` 为准。不同媒体类型、容器、分辨率上限、字幕语言有独立目标。视频 ID 用于请求身份/锁/安全续传，不再作为正常文件名。标题可能更改，重新下载会采用当次标题；不会自动重命名或删除旧成品。

成功结果示意（字段值仅作结构演示）：

```json
{
  "ok": true,
  "status": "downloaded",
  "mode": "video",
  "video_id": "VIDEO_ID_11",
  "file": "/home/user/Downloads/YouTube/示例视频标题.h1080.mp4",
  "format": "mp4",
  "size": 12345,
  "sha256": "<实际文件摘要>",
  "height": 720,
  "width": 1280,
  "duration": 19.0,
  "video_codec": "h264",
  "audio_codec": "aac",
  "transcoded": false,
  "recovered": false,
  "untrusted": true
}
```

字幕额外包含 `requested_language`、实际 `language`、`subtitle_source:manual|automatic`；音频不包含视频分辨率。视频与音频成品经 ffprobe 信息检查、时长检查及完整解码校验后才提交；字幕必须包含有效格式和时间轴，空文件不算成功。`transcoded:true` 表示执行了有损编码；无损封装不会标记为转码。

`doctor` / `repair` 成功仅返回 `status:local_dependencies_ready` 和 `network_verified:false`，不能据此宣称 YouTube 下载已可用。

## 同名与续传

遇到同名成品返回 `file_exists`（退出码 1），即使是另一个同名视频也不覆盖，原文件保持不变。用户明确要求替换才传 `--overwrite yes`；工具先在临时目录生成并校验新文件，再安全替换同名旧成品，转换失败不会删除旧文件。使用标题后同名视频可能发生碰撞；明确覆盖前需核对 `existing_file` 是预期目标。

恢复材料在目标目录的 `.youtube-partials/<request-key>/`：状态包含视频、媒体模式、格式/分辨率/语言、固定流标识以及每个部分文件的大小和 SHA-256。重试相同命令时，先验证完整状态，再下载。请求来源、参数、字幕来源或部分文件改变时返回 `resume_invalid`，禁止强制使用旧断点。中断和超时保留可验证材料，但完整性不明的强制进程终止可能留下无法自动恢复的状态，必须如实说明。

工作目录锁阻止同一目标并发写入；同机器已死亡进程的锁可以验证后恢复，不抢占仍在运行或其他机器持有的锁。不引入调度器、队列或数据库。
