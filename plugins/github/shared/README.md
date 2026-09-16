# GitHub Shared Resources

通用 GitHub 协作持久化的唯一实现：handoff 协议、远端写入恢复、模板、schema 与本地交接 CLI。领域 Skill 负责内容、证据、命名与决定；此处不包含研发审批、源码/Patch 或测试矩阵。

写入失败时读取 `references/github-remote-write-recovery.md`；恢复 Gate 确认能力不足后再读取 `references/handoff-protocol.md`。CLI 仅操作本地文件，不直接访问 GitHub：

```bash
python3 scripts/github_workflow.py handoff --help
```

跨 Plugin 消费者应通过已发现的 `github/github-issue-manager` 定位本 Plugin 的真实 shared 目录；自用 Runtime 的 `skill` 返回 `sharedRoot`，原生宿主从已安装 Skill 路径定位。不能假设两个 Plugin 相邻安装，不能把模板复制回 Development。
