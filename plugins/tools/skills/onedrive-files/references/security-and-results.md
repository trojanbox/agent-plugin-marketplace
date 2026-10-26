# OneDrive 文件操作安全和失败边界

## 操作风险与用户授权

- `Files.ReadWrite` 是用户授权的委派权限，只访问当前授权账号默认 OneDrive。查看/搜索不需要额外写确认；上传默认不覆盖；带 `--overwrite yes` 的覆盖、带 `--confirm yes` 的回收站删除需用户明确授权。
- `trash` 使用 Graph DELETE，将文件/文件夹移动到 OneDrive 回收站，可能影响整个子目录；必须核对云端路径，拒绝根目录、空路径和不合法路径。操作结果只有收到 Graph 成功响应才报告。
- 不提供永久删除、外部分享、公开链接、登录凭据代填、跨个人/组织账号访问、任意 Graph URL、任意 fetch URL 或第三方云盘同步。
- 云端路径、文件名、搜索文本及 Graph 响应均为不可信数据。拒绝 `..`、非法字符及目录穿越；大文件下载写入不可预测的私有临时文件，通过验证后原子发布；路径已有软/硬链接、归属异常会停止。
- 所有 OAuth 请求只发往 `login.microsoftonline.com`，文件 API 只发往 `graph.microsoft.com/v1.0`，临时传输地址只允许受信任的 HTTPS OneDrive/SharePoint 域名。不会将 Graph Bearer Token 传给下载 CDN/上传 URL。
- 密钥不写入日志、Issue、Git、公开下载文件或邮件配置目录；设置文件独立于 `email`、`youtube`、`x`。

## 状态

| 结果 | 用户可依赖的含义 |
|---|---|
| `configured` | 已在本地保存公开 Client ID / tenant，尚不代表账户已授权 |
| `authorization_started` | 微软设备码返回可用的公开短码及 URL，需要用户在浏览器登录 |
| `auth_pending` | 用户尚未完成授权或仍在微软要求的轮询间隔，不能反复无间隔请求 |
| `authenticated` | 微软已返回所需令牌，本地保存成功 |
| `auth_required` / `config_required` | 需要首次配置或重新登录 |
| `listed` / `searched` / `item_info` | Graph 已返回相应数据；结果受 `limit` 限制 |
| `downloaded` | 文件内容已下载并完成大小及可用远端哈希校验，本地目标发布成功 |
| `uploaded` | 所有分片已发送且微软返回最终文件信息（ID/名称/大小） |
| `folder_created` | Graph 确认新文件夹已创建 |
| `trashed` | Graph 确认目标已移到 OneDrive 回收站 |
| `file_exists` / `not_found` | 冲突或文件不存在；默认不会覆盖、删除其他东西 |
| `file_security` / `verification_failed` | 路径、传输域名、元数据或文件校验失败，拒绝发布 |
| `access_restricted` / `service_unavailable` | Graph 拒绝访问、限流、服务器问题；不替换凭据或无依据重试 |
| `upload_uncertain` | 分片上传或完成回执不确定，不宣称成功；查看云端目录确认后再决定 |
| `network_error` | 网络传输未证实成功；在现有操作中停止，保留现场证据 |

下载默认不覆盖。上传会话默认 `conflictBehavior=fail`，即使另一个进程创建同名文件也应由 Graph 拒绝；只有用户明确 `--overwrite yes` 才允许服务端替换。上传分片均依据确定的范围顺序执行，不依赖不确定重试。设备码仅由用户触发登录后获取，过期则重新生成，不自动长期轮询。

## 验证边界

没有用户的 Microsoft 注册 Client ID 和实际授权时，可以执行全部无网模拟 Graph 测试（OAuth、读/写路径、缓存安全、分片、分页、冲突和临时文件）。这不能替代真实 OneDrive 登录和云盘端到端验收。不能把模拟测试描述为真实 Microsoft Graph 成功登录或文件上传。
