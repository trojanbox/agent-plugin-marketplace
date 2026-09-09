# Git 分叉基线、Patch Bundle 与 AgentDock 执行流程

确认输入后读取，用于 merge-base 选择、二进制安全 Patch、AgentDock 执行、校验、清理和结果报告。

## 环境边界与仓库来源

- 当前 ChatGPT 容器与 AgentDock 使用独立文件系统；
- `repo` 必须直接提供 AgentDock 可访问的 HTTPS / SSH / Git URL、`file://` URL 或绝对路径；
- 当前容器可见的本地路径不能自动视为 AgentDock 可见；本地路径场景必须先确认 AgentDock Host 能访问；
- 不做仓库别名映射，不读取固定 mapping 文件；
- 拒绝 URL 内嵌用户名、密码或 Token。

## 分叉基线判断

### 显式基线

用户提供 `base_branch` 时：

1. 验证目标分支和基线分支均存在；
2. 计算 `git merge-base <base> <target>`；
3. 使用该 merge-base 作为 origin 节点；
4. `base_inference.mode=explicit`，置信度为 `high`。

### 自动推断

未提供 `base_branch` 时，候选优先级为：

1. 远端默认分支；
2. `main`、`master`、`dev`、`develop`、`trunk`、`production`、`prod`、`stable`；
3. `release/*` 和 `stable/*`；
4. 用户提供的 `base_candidates`；
5. 如果没有长期分支候选，才回退到其他远端分支，并把置信度降为 `low`。

每个候选返回：

- 候选分支名；
- merge-base SHA；
- merge-base 时间；
- 目标分支从 merge-base 之后的提交数；
- 候选分支从 merge-base 之后的提交数；
- 是否远端默认分支；
- 排序结果。

优先选择目标分支距离 merge-base 最近的长期分支；距离相同再优先默认分支、常见长期分支和更近的 merge-base。自动判断必须把 `selected_base_branch`、`merge_base`、`confidence` 和候选摘要返回给用户。

## 生成规则

1. 通过 AgentDock 插件在临时目录建立 blobless 仓库，并获取远端分支和完整提交图。
2. 解析或推断基线，计算 merge-base。
3. 生成 `<repo>-origin.zip`：
   - 使用 `git archive` 导出 merge-base 的完整树；
   - ZIP 内包含单一 `<repo>-origin/` 顶层目录；
   - 不包含 `.git`。
4. 生成 `content.patch`：
   - 使用 merge-base 到目标 tip 的完整 Diff；
   - 启用 `--binary --full-index --find-renames`；
   - 不为空时才继续打包。
5. 验证 Patch：
   - 在 merge-base 的临时 worktree 上运行 `git apply --check --index`；
   - 再运行 `git apply --index`；
   - 比较应用后的 index 与目标分支树，必须完全一致。
6. 生成最终 ZIP，根目录只包含：

   ```text
   <repo>-origin.zip
   content.patch
   ```

7. 校验最终 ZIP CRC、成员名称和 SHA-256。
8. 删除本次仓库、worktree、内层 ZIP 和临时 Patch，只保留最终 ZIP。
9. 通过 AgentDock `file_publish` 发布最终 ZIP。

## AgentDock 插件流程

1. 从用户输入取得 AgentDock 可访问的 `repo`；
2. `server_info`：确认 AgentDock Host 路径模型，本地路径场景确认路径存在；
3. 读取包内 `scripts/export_branch_patch.py`；
4. `file_edit`：把脚本临时写入 AgentDock runner 目录；
5. `exec_command`：运行脚本，直接传入 `repo`、目标分支和可选基线参数；
6. AgentDock 内完成仓库来源校验、分支分析、merge-base、origin ZIP、Patch、回放验证和最终打包；
7. `file_publish`：发布脚本返回的 `archive_path`。

示例输入：

```json
{
  "skill_action": "export",
  "repo": "https://gitlab.example.com/group/project.git",
  "target_branch": "fix/toolbar-noop-writeback",
  "archive_name": "project-fix-toolbar-noop-writeback.zip"
}
```

支持动作：

- `status`：检查环境并执行过期清理；
- `resolve`：验证并规范化直接传入的仓库地址；
- `analyze`：获取远端分支并返回基线推断，不生成文件；
- `export`：分析、生成、验证和打包。

## 临时文件清理

每次脚本启动都会清理：

```text
<TMPDIR>/git-branch-patch-bundle-export/
```

只删除该专属目录中修改时间超过 86400 秒的运行目录和导出文件，不触碰其他临时目录。已发布 Artifact 不受影响。

## 结果报告

至少返回：

- 目标分支与目标提交 SHA；
- 显式或自动选择的基线分支；
- merge-base SHA；
- 推断模式与置信度；
- 候选分支摘要；
- `origin.zip`、`content.patch` 和最终 ZIP 的大小与 SHA-256；
- Patch 应用校验结论；
- 过期临时文件清理数量；
- Artifact 下载链接。

## 限制

- Git LFS 内容按仓库 Blob 保存；仓库中是 LFS 指针时，origin 和 Patch 也可能是指针；
- 子模块只记录 gitlink，不递归打包子模块仓库；
- Patch 不携带提交元数据；需要提交序列时应另行导出 `format-patch`；
- 自动基线推断存在歧义时必须如实报告，不把推断描述成 Git 原生记录的事实。
