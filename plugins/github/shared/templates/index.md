# GitHub 交接包

- Bundle ID：`{{BUNDLE_ID}}`
- 目标仓库：`{{TARGET_REPOSITORY}}`
- 模式：`{{MODE}}`
- 状态：`{{STATUS}}`
- 创建时间：`{{CREATED_AT}}`

## 使用方式

1. 先运行 `handoff validate --strict`；
2. 对 `dedupe_status: pending` 的 Issue 完成查重；
3. 运行 `handoff next-actions` 获取同步顺序；
4. 每次远端写入成功后运行 `handoff record-sync`；
5. 不得把本地草稿描述为已完成的 GitHub 操作。

## 文件清单

文件和顺序以 `manifest.json` 为准。
