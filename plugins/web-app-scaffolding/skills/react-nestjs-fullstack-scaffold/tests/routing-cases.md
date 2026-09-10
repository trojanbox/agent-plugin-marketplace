# React + NestJS Fullstack Scaffold Routing Cases

目标：验证 Fullstack Skill 只承接当前固定 React + NestJS 组合，不抢单侧任务，也不误吃未来 Java/Python/Go 技术栈。

| ID | Bucket | Prompt | Expected |
| --- | --- | --- | --- |
| F001 | positive | 从零把 React 前端和 NestJS 后端一起搭起来，按我们完整脚手架规范。 | web-app-scaffolding/react-nestjs-fullstack-scaffold |
| F002 | positive | 初始化 apps/web + apps/api + packages/contracts，React/Vite + Nest/Drizzle。 | web-app-scaffolding/react-nestjs-fullstack-scaffold |
| F003 | positive | 把这个 React + Nest Monorepo 的前后端合同、目录和测试统一整改。 | web-app-scaffolding/react-nestjs-fullstack-scaffold |
| F004 | positive | 给我做一套 React SaaS + Nest API，全链路 Session、分页、E2E 都按规范。 | web-app-scaffolding/react-nestjs-fullstack-scaffold |
| F005 | positive | 前后端一起实现 websites CRUD，共享 Zod Contract，跑真实全链路 E2E。 | web-app-scaffolding/react-nestjs-fullstack-scaffold |
| F006 | multi-turn | 前端和 Node 后端合同都已经定了，现在一起把整个项目骨架落下来。 | web-app-scaffolding/react-nestjs-fullstack-scaffold |
| S001 | negative | 只给我做 React 管理后台页面。 | web-app-scaffolding/react-typescript-frontend-scaffold |
| S002 | negative | 只初始化 NestJS API 和 PostgreSQL。 | web-app-scaffolding/node-nestjs-backend-scaffold |
| S003 | negative | 用 Java Spring Boot 做后端脚手架。 | 当前 pack 无匹配 Java Skill；不得命中 Node/Nest Skill |
| S004 | negative | 用 Python FastAPI 做后端基线。 | 当前 pack 无匹配 Python Skill；不得命中 Node/Nest Skill |
| S005 | negative | 用 Go 做一套 API 脚手架。 | 当前 pack 无匹配 Go Skill；不得命中 Node/Nest Skill |
| S006 | negative | React 前端 + Spring Boot 后端一起初始化。 | 当前 pack 无 React+Spring Fullstack Skill；不得命中 React+Nest Fullstack |
| S007 | negative | Vue + NestJS 做全栈项目。 | 当前 pack 无 Vue+Nest Fullstack Skill；不得命中 React+Nest Fullstack |
| N001 | negative | 登录接口偶发 500，先结合日志源码找根因。 | development/github-bug-investigation |
| N002 | negative | 先完整梳理当前前后端架构怎么工作的，不改代码。 | development/github-research-document-generator |
| N003 | negative | 讨论一下后端到底选 Nest 还是 Spring，先别实现。 | development/github-discussion-facilitator |
| N004 | negative | 给已经确认的全栈方案生成开发计划。 | development/github-development-plan-generator |
| A001 | adversarial | 先查清登录 500，再顺便把前后端都迁到脚手架规范。 | 先 Bug investigation；根因确认后再 fullstack implementation |
| A002 | adversarial | React + Nest 全栈先把 Redis、Worker、CQRS 都预装好。 | fullstack 命中，但拒绝预防性平台复杂度 |
| A003 | conflict | 同时给我 React+Nest 完整项目，以及一套独立 Spring Boot 后端模板。 | 两个独立主交付物；应识别冲突/分别执行，不由一个 Fullstack Skill吞并 |
| A004 | gate | 现有是 Next.js + FastAPI，只修一个页面和一个接口，不要求迁栈。 | 不静默迁到 React/Vite + Nest；尊重现有栈 |
| A005 | gate | 现有 Next.js + FastAPI，明确把完整项目迁到我们的 React + Nest 基线。 | web-app-scaffolding/react-nestjs-fullstack-scaffold |
| A006 | composition | 从零做一个 React + Nest 小项目，只有登录注册、列表详情和健康检查，后端目录也按脚手架规范。 | web-app-scaffolding/react-nestjs-fullstack-scaffold 主导；后端目录/Module 必须下沉到 node-nestjs-backend-scaffold 的架构规则，后端保留粗粒度多 Module，不因 endpoint/Provider 机械细拆 |
