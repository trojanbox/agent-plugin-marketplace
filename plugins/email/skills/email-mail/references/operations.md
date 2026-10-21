# 四项邮件 CLI 操作

所有命令使用 `node <实际 Plugin>/shared/scripts/email.mjs ...`，JSON 输出。

| 功能 | 参数与示例 | Himalaya v2.2.1 底层命令 |
| --- | --- | --- |
| 搜索 | `search --query "from alice@example.com"` | `envelope search`（默认 INBOX） |
| 指定文件夹 | `search --query "subject 会议" --mailbox sent` | `envelope search -m sent`（非 ASCII 条件改走 `envelope list` 本地匹配） |
| 阅读正文 | `read --id 42 [--mailbox sent]` | `message read`（不额外标记已读） |
| 下载附件 | `download --id 42 --dir /safe/output [--part 2]` | `attachment download` |
| 发送（含附件） | `send --to alice@example.com --subject 报告 --body-file /safe/message.txt --attach /safe/report.pdf` | `message compose --send --attach` |
| 自动修复/诊断 | `repair` | **Agent 自动检查安装 Himalaya、收紧权限，诊断凭据是否齐备，绝不发送邮件** |
| 本地诊断 | `doctor` | 自动恢复受支持的本地依赖/权限后执行 `account list`（**不进行 QQ 网络登录**） |

- `--to`/`--cc`/`--bcc`/`--attach`/`--part` 均可重复；发送正文用 `--body-file` 或**标准输入**，避免放进命令行参数。
- 搜索查询遵循 Himalaya 本身的查询语言，例如 `after 2026-10-01`、`from alice@example.com and subject report`。可选 `--page`、`--page-size`。多个条件之间必须显式写 `and`/`or`/`not`，与 Himalaya 一致。
- **非 ASCII 关键词（中文等）由本插件本地匹配**：Himalaya 把非 ASCII 检索词编码成 IMAP literal，QQ 邮箱服务端对这种形式不匹配并直接返回空结果，因此中文检索会静默变成「没有邮件」。插件改为读取文件夹邮件头后在本地匹配，返回值带 `matching:"local"`。
  - 本地匹配支持 `subject`、`from`、`to`、日期（`after`/`before`/`date`）和 `flag` 条件；`body`/`text` 条件在非 ASCII 查询下会直接返回 `invalid_input` 并说明原因，不返回空结果冒充成功。
  - 本地匹配按邮件头里的日期判断先后，与服务端按收件时间判断可能不同；需要严格时间范围时用 ASCII 日期条件走服务端。
  - 返回值中的 `matched` 是命中数（扫描未覆盖整个文件夹时为下限），`scanned` 是已读取的邮件头数量，`truncated:true` 表示未扫完整个文件夹、命中数可能更多；排序条件（`order by`）需要扫完整个文件夹才不会漏排。
  - 本地匹配只读取邮件头，不读取正文，也不改变已读状态。
- 邮件 ID 与它所在文件夹相关，后续 `read`、`download` 应沿用搜索时的 `--mailbox`。指定不存在的文件夹应返回错误。
- 下载到明确目标目录，Himalaya 原生遇同名文件加后缀。适配器核对本次确实出现新增文件；没有文件不能声明成功。
- 本版本使用 Himalaya 原生 `message compose --attach` 发送普通 MIME 附件；复杂 HTML/MIME 另须真实验证，目前没有强制引入 MML。
- 发送失败或配置缺失时**由 Agent 先调用 `repair` 并按返回的状态修复根因**，不要求用户手动安装软件、修改文件权限或编辑配置。若需授权码/轮换凭据，Agent 通过私密交互取得后执行 `init --email ADDRESS [--replace yes]`。
- 返回 JSON 中 `untrusted:true` 标记搜索/阅读/附件中的外部数据，详见 `security-and-results.md`。
