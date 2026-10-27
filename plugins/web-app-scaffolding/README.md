# Web App Scaffolding Plugin

这是一个符合当前 Agent Plugin Marketplace 规范的 Plugin 包，包含 **3 个公开 Skill**：

```text
web-app-scaffolding/react-typescript-frontend-scaffold
web-app-scaffolding/node-nestjs-backend-scaffold
web-app-scaffolding/react-nestjs-fullstack-scaffold
```

物理结构固定为：

```text
plugins/web-app-scaffolding/
├── plugin.json
└── skills/
    ├── react-typescript-frontend-scaffold/
    ├── node-nestjs-backend-scaffold/
    └── react-nestjs-fullstack-scaffold/
```

## 为什么这样支持未来技术栈

技术栈写进 **Skill identity + description**，Group 只做软分组，不创建 `languages/java/...` 这类 Runtime 不识别的中间层。

未来可按真实栈新增：

```text
web-app-scaffolding/java-spring-boot-backend-scaffold
web-app-scaffolding/python-fastapi-backend-scaffold
web-app-scaffolding/go-<framework>-backend-scaffold
```

如果某个完整前后端组合本身是常见独立主任务，再增加组合 Skill，例如：

```text
web-app-scaffolding/react-spring-boot-fullstack-scaffold
```

其 `uses` 指向对应 frontend/backend Skill，避免复制两套规则。不要创建一个枚举所有语言的万能 Fullstack Skill。

## v9 可复制项目源码基线

全栈 Skill 已内置用户确认的 `fullstack-monorepo-template-v9.zip` 解压源码：

```text
skills/react-nestjs-fullstack-scaffold/
├── SKILL.md
├── references/template-v9.md
└── assets/fullstack-monorepo-template-v9/
    ├── AGENTS.md
    ├── README.md
    ├── apps/web/
    ├── apps/api/
    ├── packages/contracts/
    ├── packages/ui/
    ├── packages/i18n/
    ├── tests/
    └── pnpm-lock.yaml
```

新建全栈工程默认从 v9 实际源码复制或按需复用，默认数据库为 SQLite/Drizzle。完整复制时保留隐藏目录和配置；局部复用应同步处理 Workspace、Contracts、imports、Migration、Lockfile 与测试依赖。具体使用边界见 `references/template-v9.md`。

v9 原始资产作为冻结基线保留；未来有意修改模板时另存版本，避免影响后续追溯。

## Marketplace 登记

本 Plugin 的 Canonical Source 位于：

```text
plugins/web-app-scaffolding
```

根 `marketplace.json` 使用以下条目登记：

```json
{
  "name": "web-app-scaffolding",
  "source": "./plugins/web-app-scaffolding",
  "category": "Development"
}
```

修改 Canonical Source 后，先生成 Claude/Codex 宿主清单，再运行验证：

```bash
node scripts/generate-host-manifests.mjs
node scripts/validate-host-manifests.mjs
node skill-runtime.js doctor
node skill-runtime.js list web-app-scaffolding
node skill-runtime.js skill web-app-scaffolding/react-nestjs-fullstack-scaffold
```
