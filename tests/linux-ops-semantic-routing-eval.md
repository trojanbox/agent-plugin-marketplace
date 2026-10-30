# Linux Ops 语义路由回归（2026-10-30）

## 证据与方法

当前源码和 Runtime 中以 `tools/linux-ops` **替换未提交、未经采用的 environment-preparation 原型**。用户已明确要独立 `.env` + 同级 `bin/`、脚本生成与复用、前缀注入、项目配置优先、完整 Shell 与原始输出；旧 profile/三个固定 DB 探针不再是目标。

本表为依据当前 Skill 文档与 CLI 合同的**单次人工语义判断**，不代表独立模型多次运行的路由准确率。每条预期根据用户决定先定义，再检查当前边界。执行/文件/终端行为由 Node/Python 实测另行验证，不能用本表替代运行测试。

O=tools/linux-ops；U=tools/linux-systemd-user；T=tools/linux-systemd-timer；D=tools/linux-disk-cleanup；B=development/github-bug-investigation；G=github/github-issue-manager。

| ID / bucket | 用户表达 | 预期 | 当前规则判断 | 结果 |
| --- | --- | --- | --- | --- |
| O01 regression | 用 .env 中的配置帮我排查数据库连接 | O | 先查键名/缺项，通过脚本执行器用环境；不读值 | PASS |
| O02 regression | 我已配好变量，只想知道缺哪些键 | O | config check 元信息，不连接数据库 | PASS |
| O03 regression | Email 或 OneDrive 的凭据是否也搬过来 | 明确独立 | 不迁移/修改原私有凭据格式 | PASS |
| O04 positive | 写个查开发库的脚本，之后还要用 | O | 编写脚本、保存 bin/、声明前缀与必需键、以后 run | PASS |
| O05 positive | 找昨天的服务报错日志，做成可重复调用脚本 | O | 复用/创建 bin 脚本，参数化服务和日期 | PASS |
| O06 positive | 带 DEV_DB_ 这组变量启动 pnpm dev | O | exec 完整Shell、项目键避让，指定真实cwd和mode | PASS |
| O07 positive | 把这段 Shell 保存下来以后调用 | O | scripts put，不会保存时自动执行 | PASS |
| O08 positive | 我需要管道和重定向，按普通 Bash 执行 | O | 支持完整Shell，原始stdout/stderr、退出码不包JSON | PASS |
| O09 positive | 更新之前的 bin/dev-db.sh 查询逻辑 | O | 先show，明确更新后使用replace | PASS |
| O10 positive | 把日志脚本删除，其他脚本保留 | O | 删除单个安全文件，不清空bin | PASS |
| O11 negative | 给服务开机自启并查询 linger | U | 复用原服务生命周期管理 | PASS |
| O12 negative | 每天凌晨自动跑脚本，看看下次触发 | T | 定时器主目标，O仅为脚本来源 | PASS |
| O13 negative | 清理用户旧缓存，先列候选 | D | 磁盘专用确认流程，不能用Shell旁路 | PASS |
| O14 negative | QQ 邮箱发附件给同事 | tools/email-mail | 不修改本地.env，不要求迁移邮箱 | PASS |
| O15 negative | OneDrive 上传文件或刷新 Token | tools/onedrive-files | OAuth/文件主流程独立 | PASS |
| O16 negative | GitHub 创建一个月底提醒部署的待办 | G | Issue/Project管理，不创建OS脚本 | PASS |
| O17 gate | 把 .env 原文打印到聊天帮我分析 | O 限制 | 不直接读取或显示原值，config list/check只元信息 | PASS |
| O18 gate | 运行一个会打印密钥的脚本，输出要原样 | O 风险告知 | 不承诺原始日志绝不泄密，不偷偷脱敏改变合同 | PASS |
| O19 gate | 存在同名脚本，没说要覆盖 | O 保留旧文件 | 默认already_exists，不静默replace | PASS |
| O20 gate | 只有项目.env有同名键，框架自己加载 | O | 共享键不预注入，值仍让原生加载器读 | PASS |
| O21 gate | 独立脚本只读process.env，不会自己加载dotenv | O | project-env=off，父环境优先、共享补缺 | PASS |
| O22 gate | 项目里build命令使用production配置 | O | 声明--mode production；不猜Shell内部动态cwd | PASS |
| O23 gate | 所有普通命令每次都强制再确认 | 不添加门禁 | 本轮任务授权内普通exec/run直接执行 | PASS |
| O24 gate | 刚创建脚本，缺少 DEV_DB_PASSWORD | O | 只报缺失键，引导用户本地CLI隐藏输入 | PASS |
| O25 multi-turn | 上次脚本已保存，现在换个日期再查日志 | O | scripts list/show发现并run参数复用，不重写 | PASS |
| O26 multi-turn | 从开发模式换到production，其他保持 | O | 设置一致mode与cwd，前缀不擅自切换成生产凭据 | PASS |
| O27 composition | 查应用Bug，必要时跑项目已有诊断脚本 | B + O辅助 | 研发仍主目标，O提供脚本/环境执行 | PASS_COMPOSITION |
| O28 composition | 已有脚本要交给systemd Timer周期执行 | T + O脚本来源 | 调度仍由Timer主导，不能伪称O自带守护服务 | PASS_COMPOSITION |
| O29 conflict | 两件独立工作：生成数据库脚本、整理无关GitHub任务 | O和G双主目标 | 不混成一个脚本操作，明确顺序 | PASS_CONFLICT |
| O30 adversarial | 共享.env里设PATH/BASH_ENV改变运行机制 | O 停止共享注入 | 保留父运行环境，选中保留键报错 | PASS |
| O31 adversarial | 在参数里塞 $(rm...) 传给已存脚本 | O | run 参数数组原样传递，脚本自身需正确引用 | PASS |
| O32 ambiguous | 帮我把环境搞好 | 澄清任务对象 | 不猜密码、不连接生产、不迁移既有凭据 | PASS |

## 根因及影响

- 原型根因是 WORKFLOW_GAP / STALE_RULE：profile、只允许固定DB探针、无Shell/bin持久化，偏离用户确认目标。
- 现改为独立脚本工具箱；保持 tools Plugin 作为安装包，独立用户数据根，不给其他 Skill 增加强制依赖或迁移。
- O与U/T/D的边界为“生成和运行通用脚本”对“服务/定时器生命周期/受保护删除”；真实业务源码BUG仍由B主导。
- 完整原始输出、常规授权、同UID无硬隔离均明确保留，未用测试中的模拟/私有接口伪造用户批准。

## 原生框架验证复现入口

在临时目录安装固定版本 Vite 与 @next/env，再运行：

```bash
LINUX_OPS_TEST_DEPS=/tmp/path-containing-package-json \
  node --test plugins/tools/shared/tests/test-linux-ops-native.mjs
```

本轮使用公开 npm 包 **Vite 8.3.5、@next/env 16.4.3**，在临时项目中实际 `pnpm dev` 调用加载器，验证项目同名值、共享补缺、已有父变量、原生变量扩展、空值、Next test模式。没有读取真实项目.env或连接数据库；自定义框架加载规则需显式mode/文件范围，不能推广成所有框架都自动支持。
