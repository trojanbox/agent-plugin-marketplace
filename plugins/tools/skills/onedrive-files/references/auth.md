# Microsoft 账号授权和本地配置

OneDrive 通过 Microsoft Graph v1.0 的 **Delegated Files.ReadWrite** 权限读写当前授权用户的文件，附加 `offline_access` 以支持 Token 刷新。个人 Microsoft 账号和工作/学校账号均可使用，最终还受到租户管理员、应用权限和用户实际账号限制。

官方资料：
- [Microsoft OAuth 设备码协议](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-device-code)
- [OneDrive / Graph 文件操作](https://learn.microsoft.com/en-us/graph/api/resources/onedrive?view=graph-rest-1.0)
- [Graph 上传会话](https://learn.microsoft.com/en-us/graph/api/driveitem-createuploadsession?view=graph-rest-1.0)

## 第一次配置（用户需完成自己的 Microsoft 授权）

1. 在 [Microsoft Entra 管理中心](https://entra.microsoft.com/) 的 **App registrations** 中注册自己的应用。账户类型选对应个人、组织，或同时支持工作/学校与个人账号。获得 **Application (client) ID**（UUID）。
2. 将应用设为 Public client（允许公共客户端设备码流程），添加 Microsoft Graph **Delegated** 权限 `Files.ReadWrite`；根据账号和管理策略授予必要同意。**不创建 Client Secret，也不要让用户把密码、密钥或 refresh token 发到聊天里。**
3. 执行（仅 CLI 示例）：
   ```sh
   node <plugin>/shared/scripts/onedrive.mjs configure CLIENT_ID --tenant common
   node <plugin>/shared/scripts/onedrive.mjs auth start
   ```
   若仅个人 Microsoft 账号可用 `--tenant consumers`，只组织账号可用 `organizations`，也可使用明确 tenant UUID。真实 Client ID 由用户提供给命令，示例中的 CLIENT_ID 是占位符。
4. `auth start` 返回官方 `verification_uri` 和短 `user_code`。用户在自己的浏览器打开微软页面、输入代码并授予权限，再让 Agent 运行：
   ```sh
   node <plugin>/shared/scripts/onedrive.mjs auth complete
   node <plugin>/shared/scripts/onedrive.mjs auth status
   ```
5. 浏览器授权未完成时会返回 `auth_pending` 和等待间隔；尊重 Microsoft `interval`，不要高频轮询。过期后需要重新启动授权。

## 凭据安全

只写入执行用户自己的 `~/.agent-plugin-marketplace/onedrive/`，分为 `config.json`（公开 Client ID / tenant）、`pending.json`（暂存 device_code）、`tokens.json`（Access/Refresh Token）。新增私有目录及文件的权限由已有的安全 IO 实现校验，POSIX 权限为目录 0700、文件 0600；Windows 使用本用户 SID 的 ACL。工具输出永远不包含 device_code、access_token、refresh_token、Cookie 或 Client Secret。

Token 到期时按微软 OAuth Refresh Token 流续期，受本地私有锁保护；失效或被撤销时返回重新授权错误，不推测凭据、不自动更换账号。执行 `auth logout` 仅删除此电脑上的 Token/待处理授权；如需撤销微软账号授权，还应在微软账号安全/应用授权界面完成。

文件上传和下载仅使用 `graph.microsoft.com/v1.0` 的本人 OneDrive 资源，必要的文件传输跳转仅接受预审过的 Microsoft 域名，绝不把 Graph Token 发送到 OneDrive 预签名上传/下载地址。

若用户没有 Microsoft App Registration 或无法允许 Public Client 流程，工具不能自行伪造或绕过该前提，应明确说明阻塞。没有实际账号授权时，模拟测试只能证明本地合同流程。
