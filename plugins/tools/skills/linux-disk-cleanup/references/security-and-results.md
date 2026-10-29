# Linux Disk Cleanup 权限、安全和结果合同

## 权限与删除范围

- 当前 Skill 仅为 Linux **当前普通用户**提供家目录只读统计及固定白名单缓存文件清理。不使用 sudo/root，不访问其他用户账户，不读取用户缓存文件内容；不执行 `rm`、`find -delete`、`docker prune`、`journalctl --vacuum` 或跨系统清理命令。
- 只支持 `~/.cache`（旧普通文件）、`~/.npm/_logs`（旧日志）、`~/.npm/_cacache`（只读扫描 + **npm 官方 `npm cache verify`**）。前两项默认筛选最近 30 天以前的普通文件，npm 内容寻址缓存则**不能按年龄删文件**，由 npm 自己校验与回收无用数据。缓存中的项目标记/密钥/数据库会保守跳过或阻断，但无法识别所有用户业务文件。Docker 镜像、业务源代码、node_modules、数据库和系统日志不支持自动清理。
- 对当前用户缓存目录也需保护正在运行的进程与可恢复性。删除文件不可撤销，不能依赖「缓存以后会自动生成」为所有缓存证明无风险；对有副作用或重要业务的未知缓存应先停止执行并人工核实。
- 只读 `doctor`、`report`、`scan` 不代表删除授权。普通缓存必须先展示 scope/年龄/候选数/估算大小和摘要，npm-cache 则展示原生验证与不确定的回收副作用。**Agent 禁止自行调用交互式清理或模仿用户输入**；必须由用户在目标主机本地终端使用精确 SHA 计划并键入挑战短语。CLI 已取消 `--confirm yes`，无交互终端强制失败关闭。

## 技术门禁

- 参数不接受任意路径、通配符、`--root` 或其他 Linux 账号。预设目标从正在运行的普通用户 home 推导。
- 家目录和目标缓存根目录不能是软链接或非本人拥有目录，不能被其他用户写入；遍历时不进入软链接、硬链接、跨文件系统目录、权限不安全目录或特殊文件。候选仅为当前 UID 拥有、单链接的普通文件。
- 不执行 shell。`scan` 只访问文件元数据，不读取正文；生成包含候选路径、设备号、inode、大小、mtime/ctime、scope/天数等信息的 SHA256 **计划指纹**。npm-cache 采用全量 `_cacache` 条目元数据指纹，发现不安全文件、软链接、跨设备或可疑项目结构立即拒绝，**不生成逐文件按年龄删除的授权计划**。
- `clean` 首先重新完整扫描并要求指纹匹配；等待目标主机本地 TTY 输入 `DELETE <scope> <SHA前12位>`，**用户输入后再次全量扫描，变化即 `stale_plan`**。普通缓存逐文件用 `lstat` 和 `O_NOFOLLOW`/`fstat` 核实后删除；npm-cache 只通过无 shell 的 `execFile` 运行 `npm cache verify --cache <HOME>/.npm --offline --ignore-scripts`，不自行执行 `unlink`，不运行 `npm cache clean --force`，也不推断 npm 原生回收量。
- Node 路径 `unlink` 与文件验证之间不具备完全原子性，**不能抵抗所有同 UID 文件系统竞态**。本地 TTY 输入也**不是独立安全主体**：同 UID 且能控制 TTY 的 Agent 仍可伪造输入或调用其他文件 API，因此当前解决的是无终端/普通意外自动执行风险；绝对无法绕过的真人审批需要宿主可信确认 UI、额外密钥/硬件认证或独立权限服务。不得向用户宣称已实现硬隔离。
- 扫描最多 50,000 项，`report` 默认最多 20,000 项；超限候选扫描拒绝执行清理，`report` 标记截断并说明数字是部分下限。安全检查失败时停止，不允许用裸 shell 清理兜底。

## 正确解释结果

- `status=plan`：只读列出的候选，不代表文件已删除；`missing_target`：缓存目录不存在，不会创建新目录。
- `status=cleaned`：仅普通缓存按计划逐个 `unlink` 返回成功的文件数和逻辑字节估算；`maintenance_completed`：npm 已返回官方 `cache verify` 执行结果，但未承诺回收大小或精确块数。两者都需重新读取 `report` 才能比较文件系统空间。
- `stale_plan`：与用户预览不同，需重新扫描、重新确认；`approval_required`/`approval_denied`：无人交互或输入不符，未执行；`no_candidates`：没有候选；`partial_change`：普通缓存可能部分删除；`maintenance_failed`：npm 失败，内部缓存可能部分改变，需核实后再决定；`unsupported_user`/`unsupported_platform`：拒绝操作。
- 不自行把清理任务注册成 systemd Timer、cron 或后台守护进程，也不在未经用户明确授权时执行缓存压缩/全目录删除/停止进程。
