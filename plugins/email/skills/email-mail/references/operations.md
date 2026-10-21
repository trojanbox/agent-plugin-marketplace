# 四项邮件 CLI 操作

所有命令使用 `node <实际 Plugin>/shared/scripts/email.mjs ...`，JSON 输出。

| 功能 | 参数与示例 | Himalaya v2.2.1 底层命令 |
| --- | --- | --- |
| 搜索 | `search --query "from alice@example.com"` | `envelope search`（默认 INBOX） |
| 指定文件夹 | `search --query "subject 会议" --mailbox sent` | `envelope search -m sent` |
| 阅读正文 | `read --id 42 [--mailbox sent]` | `message read`（不额外标记已读） |
| 下载附件 | `download --id 42 --dir /safe/output [--part 2]` | `attachment download` |
| 发送（含附件） | `send --to alice@example.com --subject 报告 --body-file /safe/message.txt --attach /safe/report.pdf` | `message compose --send --attach` |
| 本地诊断 | `doctor` | `account list`（**不进行 QQ 网络登录**） |

- `--to`/`--cc`/`--bcc`/`--attach`/`--part` 均可重复；发送正文用 `--body-file` 或**标准输入**，避免放进命令行参数。
- 搜索查询遵循 Himalaya 本身的查询语言，例如 `after 2026-10-01`、`from alice@example.com and subject report`。可选 `--page`、`--page-size`。
- 邮件 ID 与它所在文件夹相关，后续 `read`、`download` 应沿用搜索时的 `--mailbox`。指定不存在的文件夹应返回错误。
- 下载到明确目标目录，Himalaya 原生遇同名文件加后缀。适配器核对本次确实出现新增文件；没有文件不能声明成功。
- 本版本使用 Himalaya 原生 `message compose --attach` 发送普通 MIME 附件；复杂 HTML/MIME 另须真实验证，目前没有强制引入 MML。
- 返回 JSON 中 `untrusted:true` 标记搜索/阅读/附件中的外部数据，详见 `security-and-results.md`。
