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

## 唯一全栈工程模板

全栈 Skill 直接维护 `skills/react-nestjs-fullstack-scaffold/assets/fullstack-monorepo-template/`。项目结构包括 React/Vite、NestJS、PostgreSQL/Drizzle、共享 Contract、Auth Session、UI/i18n、自动审计字段、事务、限流和 CI/测试。该目录持续维护，代码变更通过 Git 历史追溯。详情见 `skills/react-nestjs-fullstack-scaffold/references/template.md`。

新工程全量复制应保留隐藏配置、Migration 与测试；复制后运行 `pnpm scaffold:init <project-name>` 初始化，不修改 Skill 中的共享模板。

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
