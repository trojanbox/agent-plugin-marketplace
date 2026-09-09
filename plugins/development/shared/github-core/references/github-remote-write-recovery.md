# GitHub 远端写入恢复 Gate

本协议用于 GitHub Issue / 评论 / 标签 / 生命周期写操作在执行前或执行中失败时，区分**真正的远端能力不可用**与**本地 CLI、PATH、Shell 命令形态或请求构造失败**。

只有完成本 Gate 后仍确认 GitHub 无法写入，才允许进入 `handoff-protocol.md`。用户明确要求不要生成 handoff 时，即使远端最终不可写，也只报告阻塞原因并保留当前已整理内容，不创建交接包。

## 1. 先分类失败位置

优先判断失败发生在哪一层：

1. **CLI 解析层**：`gh: not found`、PATH 缺失、可执行文件未找到；
2. **Shell / 执行宿主层**：命令过长、heredoc/引号/命令替换失败、宿主在进程启动前拒绝命令；
3. **GitHub CLI 认证层**：未登录、账号不匹配、scope 不足；
4. **GitHub 远端层**：HTTP/GraphQL 明确返回 401/403/404/422、仓库策略拒绝或资源冲突；
5. **成功但结果不完整**：命令返回成功但没有编号、URL 或无法回读核验。

`gh: not found`、Shell 转义错误、长命令被宿主拦截都**不能单独判定为 GitHub 不可写**。

## 2. CLI 定位与 PATH 恢复

先尝试：

```bash
command -v gh
```

如果 PATH 中没有，按顺序检查常见用户级位置：

```text
$HOME/.local/bin/gh
$HOME/bin/gh
/usr/local/bin/gh
```

发现可执行文件后，当前操作优先直接使用**绝对路径**继续，不要求先修改系统环境。

只有用户明确要求持久化 PATH，或当前项目环境规范明确允许时，才修改 `.bashrc` / `.zshrc` 等启动文件。修改必须幂等，不能重复追加相同 PATH。

不要因为 PATH 缺失重新安装一个已经存在的 `gh`。

## 3. 认证与读取探针

找到 CLI 后先做低风险确认：

```bash
"$GH_BIN" auth status -h github.com
"$GH_BIN" issue list -R owner/repo --limit 1
```

要求：

- 不读取或打印 token 明文；
- 不 `cat ~/.config/gh/hosts.yml`；
- 不把 token 拼进命令参数、URL 或日志；
- 认证成功且 Issue 可读时，说明“GitHub 整体不可用”的判断还没有成立。

## 4. Markdown 写入默认使用文件

Issue / 评论正文较长、包含 Markdown、代码块、反引号、Mermaid 或 shell 敏感字符时，默认先写到临时文件，再让 `gh` 读取文件。

推荐：

```bash
"$GH_BIN" issue create -R owner/repo \
  --title "【讨论】..." \
  --body-file /tmp/issue-body.md \
  --label discussion

"$GH_BIN" issue edit <number> -R owner/repo \
  --body-file /tmp/issue-body.md

"$GH_BIN" issue comment <number> -R owner/repo \
  --body-file /tmp/comment-body.md
```

不要把大段 Markdown heredoc、token 读取、查重逻辑和远端写操作塞进同一条复杂 shell 命令。正文生成、远端写入、结果核验应拆成独立步骤。

## 5. 执行宿主拒绝时的降复杂度重试

如果写命令在 `gh` 真正启动前被宿主拒绝，执行**最多两次**有意义的降复杂度恢复，禁止无依据循环重试：

1. 使用已确认的 `gh` 绝对路径；
2. 把正文移到 `--body-file`；
3. 将“生成正文 / 写 GitHub / 核验结果”拆成独立命令；
4. 去掉 shell 命令替换、嵌套 heredoc、token 提取和不必要的管道；
5. 如果当前环境有其它受支持的 GitHub 写工具，可以改用该工具，但仍要保留目标仓库、授权和真实性 Gate。

恢复动作必须针对已观察到的失败形态，不能用延时、无限重试或绕过安全控制碰运气。

## 6. 何时才算真正不可写

满足以下任一情况，才可以判定当前 GitHub 写入能力不足：

- 没有任何受支持的 GitHub 写工具，且常见 CLI 位置也不存在；
- `gh auth status` 明确确认未登录或权限不足，当前会话无法安全修复；
- GitHub 远端明确拒绝当前账号/仓库的写操作；
- 经过上面的有限降复杂度恢复后，写操作仍无法到达或完成，且没有其它受支持写入路径；
- 系统/用户明确禁止当前远端写操作。

进入 handoff 前必须保留真实失败证据，并说明失败属于哪一层。

## 7. 写入成功后的真实性核验

成功返回后必须读取目标对象核对至少：

- 仓库；
- Issue 编号和 URL；
- 标题；
- 预期标签；
- 正文或评论的关键开头/幂等标记；
- 需要的状态（open/closed 等）。

只有核验成功后，才能向用户声称远端已创建、更新、评论、加标签、关闭或重开。
