# Authoring Runtime

## 固定上游

真实方法与脚本都位于 `vendor/baoyu-design/upstream/`，由 `UPSTREAM.json` 锁定 commit。Runtime Skill 只做路由与适配，避免在本目录复制一份会漂移的上游协议。

## 脚本职责

- `agents/import-figma.mjs`：离线解析本地 `.fig`；
- `agents/compile-design-system.mjs`：编译设计系统；
- `agents/check-design-system.mjs`：只读验证；
- `agents/build-preview.mjs`：构建单文件 review 页面；
- `agents/import-design-system.mjs`：把系统固定副本导入普通设计项目；
- `agents/record-asset.mjs`：维护项目交付物版本元数据。

这些脚本是确定性工具。设计判断留给方法论与用户反馈，脚本失败时保留原始错误并修根因，不通过吞错、关闭校验或假成功绕过。

## 可选依赖

基础编译、Figma 导入与元数据脚本主要依赖 Node 与上游 vendored library。PPTX/视频导出有额外 Playwright/esbuild/TypeScript，视频还依赖 ffmpeg；只在用户实际要求相应导出时安装/检查。

## 宿主优先级

当前宿主的安全、文件、浏览器、PDF/PPTX 与图片生成规则优先于上游通用 harness 文档。无法映射的工具能力明确降级，不自行虚构接口。
