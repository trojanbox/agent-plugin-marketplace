# tools Plugin V1 开发验证记录

验证日期：2026-10-25。权威需求：`trojanbox/project-documents` 开发结论 #295 与讨论 #294 的 14 条有效决定。执行环境为 DevMachine Linux x64（glibc）、Node.js 24.22.0、Python 3.11.2。本记录区分代码/离线验证、公网行为及未实测范围。

## 已真实执行的检查

| 项目 | 结果 |
|---|---|
| Python 全仓测试 | **82 项通过**；包含新增 8 项 tools 迁移/入口/原路径合同检查 |
| Node 邮件与 YouTube 测试 | **93 项通过，0 失败、0 跳过**：原邮件 41，YouTube 纯逻辑 17，文件/依赖安全 18，真实 FFmpeg 集成 17 |
| 宿主 manifest 生成与检查 | 13 Plugins / 28 份宿主产物一致；最终重复生成 written=0 |
| Runtime doctor | `ok:true`；13 Plugins，64 Public + 1 Internal = **65 Skills**；结构、组合、合同、上下文问题均为空 |
| JavaScript 语法 / Git whitespace | 全部脚本通过 `node --check`，`git diff --check` 通过 |
| 语义路由审查 | 36 条当前规则人工审查，含旧 Email 样本、YouTube 正例、研究/GitHub 邻居、多轮/停止/顺序边界；不宣称统计准确率 |
| 原邮件执行器 | `email.mjs`、`himalaya-install.mjs`、`search-query.mjs` 与迁移前 Git 版本逐字节一致，仅仓库路径迁移 |
| 用户真实邮件目录 | 任务前后私有指纹比较一致：路径、文件内容、大小、权限及原依赖均未改变；未打印授权码或配置内容 |
| 原 GitHub Plugin | 与任务前版本无差异 |

基线曾有一个全仓旧测试失败：已有 Skill 描述总量比原 13861 字符预算超出 25。迁移时压缩 Email 路由描述但保留实际行为，使已有 Skill 继续满足原预算；新的 YouTube Skill 使用独立不超过 200 字符的明确预算。没有删除或放宽原有每 Skill 最大长度规则。

## 隔离家目录中的真实自动安装

在临时、独立的 HOME 中执行自动依赖准备，验证固定发布包大小和 SHA-256，解压后执行实际二进制，并留下私有安装回执：

- yt-dlp **2026.10.21** 官方 Linux x64 独立可执行文件，含打包 EJS。
- yt-dlp 官方 FFmpeg-Builds **autobuild-2026-10-24-17-20**，实际 FFmpeg/ffprobe `N-128018-ga881f0a9ad-20261024`。
- JavaScript 使用宿主 Node.js 24.22.0。此环境无需安装 Deno；Deno 固定资产与安全 ZIP 解包由单元测试覆盖，未把它写为实际 Deno 安装成功。
- 新依赖与所有媒体测试产物均在临时家目录/测试输出目录，未写入用户原 Email 配置。

下载器、归档和媒体文件没有打包进入 Git；仓库仅保存代码、参考文档及固定官方资产清单。

## 真实 YouTube 公网验证

使用公开测试视频 ID `jNQXAC9IVRw`，不登录、不使用 Cookie、不导入浏览器信息：

| 请求 | 实际结果 |
|---|---|
| 默认视频 `video` | 成功保存 **MP4**，477468 字节；实际 **320×240**、19.014 秒，AV1 + Opus 音轨；流复制无损封装，无需转码；已通过格式/时长/完整解码校验 |
| 默认纯音频 `audio` | 成功保存 **MP3**，179877 字节，19.005542 秒；真实 MP3 编码，`transcoded:true` |
| 默认中文字幕 `subtitles` | 明确返回 **`subtitle_unavailable`**；没有下载英文或翻译字幕替代中文 |
| 明确英文 `subtitles --lang en` | 成功保存 **SRT**，416 字节；实际 `language:en`、`subtitle_source:manual`，字幕格式/时间轴检查通过 |

另外，旧下载器测试 ID `BaW_jenozKc` 当前不可用，真实返回 `video_unavailable`，没有重试下载其他视频假装成功。一次公开视频通过不能保证其他视频、网络或未来平台状态都可用。

## 真实 FFmpeg 离线集成覆盖

这 17 项测试的**下载器传输由固定替身提供**，媒体由真实 FFmpeg 本地生成，探测、转换、解码、文件写入、断点、锁和覆盖逻辑都实际执行：

- VP8/Opus → MP4 必要时重编码，WebM → MKV 无损封装，兼容 H264/AAC → MP4 流复制。
- 真实 MP3/M4A 音频转换和视频流排除，VTT/SRT 转换和时间轴校验。
- 中文人工字幕、同语言原生自动字幕和缺失语言；损坏字幕不能靠生成空文件伪装成功。
- 网络中断后校验状态与部分文件，第二次请求安全续传；篡改字节或选定流变动时拒绝恢复。
- 已有文件不覆盖；明确授权覆盖时也先验证新成品，损坏输入不会删除旧成品。
- 错误/逃逸路径、伪造不存在文件、访问限制、同目标并发锁、时长/分辨率不一致。

## 14 项决定的实现映射

| 决策范围 | 实现与验证位置 |
|---|---|
| tools 合并 / GitHub 独立 | Canonical manifests、生成器产物、`test_tools_plugin_integration.py` |
| Email 原配置不变 | 原执行器直接迁移、现有 41 项邮件测试、用户目录前后私有指纹 |
| 单视频三类输入 | `youtube-core.mjs`、`youtube.mjs`，URL/类型/参数拒绝测试 |
| 字幕人工优先 | `selectSubtitle()` 与真实字幕模式集成 |
| 默认中文 / 指定语言 | 语言规范化、中文脚本/区域匹配与实际语言结果 |
| 无语言不回退 | `subtitle_unavailable`、排除 `tlang` 自动翻译轨道及真实中文缺失验证 |
| SRT / VTT | `youtube-media.mjs` 与实际 FFmpeg 字幕转换 |
| MP4 / MKV | 视频模式与实际容器/音轨/解码验证 |
| 默认 cap1080 | `mediaSelector()`、实际流选择及最终分辨率上限检查 |
| MP3 / M4A | 纯音频后处理与实际文件探测 |
| Agent 安全依赖准备 | `youtube-deps.mjs`、固定发布清单、受控安装及篡改/平台/禁令测试 |
| 允许必要转码 | 先实际流复制，仅明确封装不兼容时一次 FFmpeg 编码后备；其他失败不盲目重试 |
| 默认输出目录 | 系统家目录与安全绝对路径，隔离 Email 配置 |
| 不覆盖 / 可验证续传 | `youtube-io.mjs`、请求绑定清单、文件摘要、排他锁与原子发布 |

## 未实测 / 明确支持边界

- **Windows/macOS 原生执行未在本轮运行**；Windows 路径、资产选择与 ZIP 安全由单元测试覆盖，不能替代原生系统验收。
- **macOS 缺少现成 FFmpeg 时没有官方 yt-dlp FFmpeg-Builds 资产可自动安装**；使用已有可用 FFmpeg/ffprobe，缺少则明确 `unsupported_platform`。不为通过测试使用未经校验第三方包。
- Linux FFmpeg 自动解包依赖 Python 标准库 lzma/tarfile；缺少时报告阻塞。CLI 本身需要宿主 Node.js 18+。
- 没有用用户真实 QQ 账号收发邮件或更新授权码；邮件行为通过既有隔离回归及执行器字节一致性保证本轮不改业务逻辑，不能把它说成新的 SMTP/IMAP 端到端验收。
- 暂未运行原生 4K 下载、超长视频、所有平台/CPU 和所有第三方网络故障组合。默认上限、格式、失败安全和文件恢复已有确定测试，其他实际环境结果仍需按真实证据报告。
