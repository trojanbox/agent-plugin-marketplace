---
name: onedrive-files
description: "操作当前用户 OneDrive：浏览、搜索、查询、文件上传/下载、创建文件夹与移入回收站。Microsoft Graph OAuth 设备码授权，支持个人及工作/学校账号，令牌私有存储/刷新、分片上传、下载校验与默认防覆盖。不管理共享站点或提供浏览器账号代登录。"
phase: operations
---

# OneDrive 云文件操作

## 目标与入口

用当前 tools Plugin 的独立 `../../shared/scripts/onedrive.mjs` CLI 通过 Microsoft Graph v1.0 操作**已授权用户自己的 OneDrive**。必须先发现实际 tools Plugin 路径再运行 `node <实际插件根>/shared/scripts/onedrive.mjs ...`，不要假设固定安装目录。

**首次连接需要用户亲自在 Microsoft 登录页面授权**，并提供在 Microsoft Entra 注册的 Public Client 应用 Client ID。只需要公开应用 ID，绝不索取 Microsoft 密码、Client Secret、Cookie 或账户 Token。若未配置 Client ID，可帮助说明注册步骤，不能假冒已连接。

## 命令范围

- `configure CLIENT_ID [--tenant common|consumers|organizations|TENANT_UUID]`：注册公开应用 ID（无需 Secret）；`auth start` 返回微软设备码和登录入口；用户完成网页登录后调用 `auth complete`。未完成时返回 `auth_pending`，不得盲目高频轮询；`auth status` 和 `auth logout` 管理本地令牌状态。
- `list [REMOTE_FOLDER]`、`info REMOTE_PATH`、`search KEYWORD`：获取列表、分页/搜索、元数据；不抓取其他账号的内容。
- `download REMOTE_FILE [--dir ABS] [--overwrite yes|no]`：默认保存到当前执行用户的 `~/Downloads/OneDrive`，经文件大小、SHA-256 与 Graph 提供的哈希（如果有）校验后原子发布；默认不覆盖。
- `upload LOCAL_FILE REMOTE_FOLDER [--name FILENAME] [--overwrite yes|no]`：要求已存在远程父文件夹；通过官方分片上传会话上传 1 字节至 250 GB，默认 `conflictBehavior=fail`；禁止未经确认覆盖旧文件。返回完整提交响应后才宣告成功。
- `mkdir REMOTE_FOLDER` 创建一个文件夹；`trash REMOTE_PATH --confirm yes` 显式将指定文件/文件夹移到回收站。严禁删除根目录、批量删除或绕过确认。

所有云端路径相对 OneDrive 根目录（根可用 `/` 表示）；登录和传输脚本只能发起约定的 Microsoft Graph 授权及受信任的临时文件传输域名请求。目录/令牌安全逻辑复用 tools 本身已有的校验 IO，不修改 QQ 邮箱、YouTube、X 下载配置。

## 按需阅读

1. 执行命令、返回含义和默认路径 → `references/operations.md`。
2. 初始化、设备授权、过期/刷新或账号类型不匹配 → `references/auth.md`。
3. 覆盖、危险文件、无法下载、冲突或权限错误 → `references/security-and-results.md`。

## 完成边界

仅当 API 真正成功、上传收到最终提交确认或下载完成文件验证后，才报告 `status:uploaded` / `status:downloaded` 和真实文件路径。模拟测试通过不能证明用户的 OneDrive 登录/网络/API 已经成功。

用户未给 Client ID 或未亲自授权时，只能说明需先配置/授权，不自动创建应用注册、不存储密钥、不对外泄露 Token。仅处理当前用户默认 OneDrive；共享链接、SharePoint 站点、完整目录同步、跨盘搬运、永久删除和外链公开分享均不在首版范围。
