# 安装与配置

## 依赖

Node.js 18+，安装 [Himalaya 2.2.1 官方二进制](https://github.com/pimalaya/himalaya/releases/tag/v2.2.1) 到 PATH。CLI 会校验准确版本（其它版本仍未做兼容验证）。QQ 邮箱中启用 IMAP/SMTP，取得第三方客户端授权码（请勿使用日常登录密码）。

## 家目录与凭据

从 `os.homedir()` 和系统路径库得到当前执行用户家目录，配置写入 `.agent-plugin-marketplace/email/config.toml`：

| 平台 | 家目录下的位置示例 |
| --- | --- |
| Linux | `/home/user/.agent-plugin-marketplace/email/config.toml` |
| macOS | `/Users/user/.agent-plugin-marketplace/email/config.toml` |
| Windows | `C:\Users\user\.agent-plugin-marketplace\email\config.toml` |

目录与文件名称是 V1 的具体实现选择；上游 D-002 仅强制在家目录中创建专用文件夹。Linux/macOS 目录 0700、文件 0600；Windows 使用当前用户 SID 和 `icacls.exe` 收紧 ACL。真实 Windows 权限仍须在 Windows 设备实测。

从安装的 Plugin 目录运行：

```sh
node /path/to/plugins/email/shared/scripts/email.mjs init --email your-account@qq.com
node /path/to/plugins/email/shared/scripts/email.mjs doctor
```

`init` 通过**不回显的交互输入**或标准输入获取授权码；绝不可通过命令参数传递密钥，也不要贴到聊天/Issue/仓库。`doctor` 只检查本地配置/二进制/TOML，不连接真实 QQ 服务器。重复初始化不会覆盖现有配置；授权码轮换需要用户在可信编辑器中更新家目录文件。

使用 Himalaya 2.x 原生格式：`[accounts.qq]`、`imap.server`、`imap.sasl.plain.password.raw`、`imap.id.auto = true`、`smtp.server`、`smtp.sasl.plain.password.raw`。服务器为 `imaps://imap.qq.com:993` 和 `smtps://smtp.qq.com:465`。确切 QQ 认证机制仍需实测。

CLI 在家目录的专用配置文件夹中执行 Himalaya `-c config.toml`。使用**相对配置文件名**规避上游冒号分隔语法与 Windows `C:\...` 盘符的冲突；路径含空格、中文、非系统盘、UNC 的场景还应真实测试。
