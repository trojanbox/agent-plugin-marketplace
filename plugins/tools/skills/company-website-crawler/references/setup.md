# Firecrawl / DeepSeek 密钥配置

## 初次配置

需要 Node.js 18+，以及 Firecrawl 和 DeepSeek 官方 API Key。

配置保存在当前执行用户的家目录中：

- Linux / macOS: ~/.agent-plugin-marketplace/company-website-crawler/config.json
- Windows: %USERPROFILE%\.agent-plugin-marketplace\company-website-crawler\config.json

文件包含**明文密钥**，应只允许当前用户读取。Linux/macOS 目录 0700、文件 0600；Windows 按当前用户 SID 和 SYSTEM 设置 ACL。配置文件**不在 Git 仓库中**。

在 tools Plugin 根目录运行以下命令：

    node shared/scripts/company-website-crawler.mjs init

CLI 会依次提示 Firecrawl API Key 和 DeepSeek API Key，TTY 输入不回显，最终输出只含配置文件路径及配置状态。**不要把 Key 发到聊天、Issue、CLI 参数或 shell 历史中。** Agent 可以引导用户从官方控制台取得 Key，但不得猜测或要求提供账户密码。

密钥轮换明确执行：

    node shared/scripts/company-website-crawler.mjs init --replace yes

旧配置默认不会被覆盖。重新初始化需要重新输入**两个** Key。

本地检查：

    node shared/scripts/company-website-crawler.mjs doctor

输出 firecrawl_configured / deepseek_configured 与 network_tested=false。doctor 不会访问外部服务、也不会验证 Key 的额度或有效性。

## 非交互执行

受控运行环境可以通过 stdin 提供两行密钥，第一行 Firecrawl、第二行 DeepSeek；输入来源须是可信 Secret Manager，不要把密钥明文写入脚本、日志或 shell 参数。禁止在命令执行输出中打印 stdin。

## 故障

配置缺失会报告 config_missing；配置存在时 init 需要显式 --replace yes；私有文件不得为符号链接。若 Key 无效、服务额度耗尽或服务商拒绝请求，保持真实错误记录，不通过重试或越权修改配置来绕过。

首次使用需先确认执行机器的用户家目录与配置机器一致；另一台机器需要重新配置该用户的密钥。敏感配置不得进入 run 输出文件包。
