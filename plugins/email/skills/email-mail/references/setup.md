# 安装与配置

## 依赖

需要可执行 Node.js 18+。**Agent 负责依赖修复**：本插件自动检查可用的 Himalaya 2.2.1，缺失或版本不兼容时，从 [Himalaya 官方 v2.2.1 发布页](https://github.com/pimalaya/himalaya/releases/tag/v2.2.1) 获取适配平台的二进制，**验证固定 SHA-256** 后安装到当前用户的私有配置目录 `email/bin/`。不需用户手动安装或改 PATH，不覆盖系统已安装的版本。其它版本未经验证。如执行环境缺少 Node，Agent 应使用已获授权的宿主开发/软件管理工具修复运行环境。QQ 邮箱需要启用 IMAP/SMTP 并取得第三方客户端授权码（请勿使用日常登录密码）；服务商要求的人类账号授权无法由程序凭空完成。

## 家目录与凭据

从 `os.homedir()` 和系统路径库得到当前执行用户家目录，配置写入 `.agent-plugin-marketplace/email/config.toml`：

| 平台 | 家目录下的位置示例 |
| --- | --- |
| Linux | `/home/user/.agent-plugin-marketplace/email/config.toml` |
| macOS | `/Users/user/.agent-plugin-marketplace/email/config.toml` |
| Windows | `C:\Users\user\.agent-plugin-marketplace\email\config.toml` |

目录与文件名称是 V1 的具体实现选择；上游 D-002 仅强制在家目录中创建专用文件夹。Linux/macOS 目录 0700、文件 0600；Windows 使用当前用户 SID 和 `icacls.exe` 收紧 ACL。真实 Windows 权限仍须在 Windows 设备实测。

**由 Agent 在运行环境中执行以下命令**，用户无须自行敲命令、修改配置文件：

```sh
node /path/to/plugins/email/shared/scripts/email.mjs repair
# 如果 repair 返回 authorization_required，Agent 获取 QQ 邮箱地址与授权码后执行：
node /path/to/plugins/email/shared/scripts/email.mjs init --email your-account@qq.com
node /path/to/plugins/email/shared/scripts/email.mjs doctor
# 如果需要更换已失效授权码，由 Agent 在获得新代码后执行：
node /path/to/plugins/email/shared/scripts/email.mjs init --email your-account@qq.com --replace yes
```

`repair` 不会发邮件；可自动创建/修复当前用户拥有的私有目录、收紧本地配置权限，并验证/安装 Himalaya。若仍缺 QQ 授权信息则返回 `authorization_required`，**Agent 仅向用户索取无法自行获取的 QQ 邮箱地址和客户端授权码**，然后由 Agent 调用 `init` 写入。`init` 使用**不回显的交互输入**或标准输入获取密钥，绝不可作为命令参数/日志/公开聊天内容。已存在配置只有在 `--replace yes` 并提供新授权码时才会被替换；无人授予新密码时不清空/捏造凭据。`doctor` 仅检查本地配置/二进制/TOML，**不连接真实 QQ 服务器**。

使用 Himalaya 2.x 原生格式：`[accounts.qq]`、`imap.server`、`imap.sasl.plain.password.raw`、`imap.id.auto = true`、`smtp.server`、`smtp.sasl.plain.password.raw`。服务器为 `imaps://imap.qq.com:993` 和 `smtps://smtp.qq.com:465`。确切 QQ 认证机制仍需实测。

CLI 在家目录的专用配置文件夹中执行 Himalaya `-c config.toml`，通过**相对文件名**规避 Windows `C:\...` 盘符冒号冲突；路径含空格、中文、非系统盘、UNC 的场景仍需实际测试。用户显式设置 `HIMALAYA_BIN` 时适配器尊重该可执行路径，若版本不兼容会返回 `dependency_version`；Agent 可在不更改用户系统安装的前提下，从执行环境去掉不兼容覆盖后使用自动安装的版本。主机设置 `EMAIL_AUTO_INSTALL=0` 会禁用自动下载安装，Agent 必须遵守该宿主限制。
