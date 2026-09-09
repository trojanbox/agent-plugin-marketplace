# Workspace 与 Patch 协议

> 以下 `../../shared/github-core/...` 相对路径以当前 `plugins/development/skills/<skill>/` Skill 目录为基准。

## 安全解压

对 ZIP/TAR 使用：

```bash
python3 ../../shared/github-core/scripts/github_workflow.py archive extract \
  --archive source.zip --destination work/source
```

脚本拒绝路径穿越、归档符号链接和特殊设备文件。

## 源码快照

```bash
python3 ../../shared/github-core/scripts/github_workflow.py workspace snapshot \
  --path work/source --output snapshot.json
```

快照包含 Git 根目录、HEAD、分支、工作区状态和可见文件树哈希。快照只证明采集时的本地状态。


## 无 Git 历史的上传源码

如果用户上传 ZIP/TAR 是唯一可信基线且不包含 `.git`：

1. 安全解压到隔离工作区；
2. 记录归档 SHA-256 和文件树哈希；
3. 在**隔离副本**初始化本地 Git，仅用于 diff/patch：

```bash
git init
git add -A
git -c user.name="local-baseline" -c user.email="local-baseline@example.invalid" commit -m "baseline"
```

4. 把该本地 commit 明确标记为 `synthetic_local_baseline`，不能声称它是远端真实 HEAD/branch；
5. 修改、测试后以该本地 baseline 导出 Patch，并在另一份同归档基线副本中回放检查。

本地 Git 只服务于可审计 diff，不改变“用户上传源码是事实依据”的定义。

## Patch 审查

```bash
python3 ../../shared/github-core/scripts/github_workflow.py patch inspect --patch change.patch
python3 ../../shared/github-core/scripts/github_workflow.py patch check --workspace work/source --patch change.patch
```

`patch check` 成功只证明语法和上下文可应用，不证明行为正确。

## Patch 导出

```bash
python3 ../../shared/github-core/scripts/github_workflow.py patch export \
  --workspace work/source --base HEAD --output delivery.patch
```

脚本导出二进制安全 Git Patch，并在临时 worktree 对同一基线执行回放检查。未跟踪文件不会自动进入 `git diff`，必须先纳入 Git 或单独处理。
