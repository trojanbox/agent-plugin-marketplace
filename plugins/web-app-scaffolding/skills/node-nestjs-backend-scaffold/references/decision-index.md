# Decision Index — GitHub Issue #35

权威讨论：`trojanbox/project-documents#35`。

本文件只用于追溯；具体执行规则以本 Skill 对应 reference 为准。若 GitHub 决策后续被原地修正，应同步更新 Skill。

| Decision | Contract | Source |
| --- | --- | --- |
| D-001 | NestJS fixed default | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5598438484 |
| D-002 | `apps/api`, feature-based backend | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5598485410 |
| D-003 | Controller / Service / Repository | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5598549617 |
| D-004 | PostgreSQL + Drizzle, Query Builder First | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5598619550 |
| D-005 | Zod + Nest Standard Schema | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5598664165 |
| D-006 | API Envelope / Detail / List | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5598828903 |
| D-007 | Page / Filter / Sort contract | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5598873070 |
| D-008 | `@nestjs/config` + Zod | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5598918184 |
| D-009 | Logger / requestId / Health / shutdown | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5598948992 |
| D-010 | Session / CSRF / Permission / scrypt / Helmet | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5599093347 |
| D-011 | Vitest + Nest TestingModule + real PG | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5599146226 |
| D-012 | Drizzle Migration lifecycle | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5599305777 |
| D-013 | Coarse-grained Nest Module | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5599365608 |
| D-014 | TypeScript / naming / imports | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5599394708 |
| D-015 | UTC / ID / transaction / concurrency / idempotency | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5599416350 |
| D-016 | HTTP/Cache on demand, OpenAPI default | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5599472982 |
| D-017 | Application Error / ApiFailure | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5599511806 |
| D-018 | Oxlint + Prettier + architecture gates | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5599533695 |
| D-019 | REST / resource limits / performance | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5599554648 |
| D-020 | Node LTS / pnpm / package / dependencies / compatibility | https://github.com/trojanbox/project-documents/issues/35#issuecomment-5599580233 |

## Decision-to-reference map

```text
D-001/002/003/013/020 → architecture-and-module-boundaries.md
D-004/012/015         → persistence-and-migrations.md + time-transactions-and-concurrency.md
D-005/006/007/017/019 → api-contracts-validation-and-errors.md
D-008/009             → config-observability-and-health.md
D-010                 → auth-and-security.md
D-011                 → testing-and-e2e.md
D-014/018             → typescript-naming-and-quality.md
D-016/019             → integrations-cache-openapi-and-files.md + performance-runtime-and-dependencies.md
```
