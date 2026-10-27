import { mkdirSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

import { items } from '../src/modules/infrastructure/database/schema/item.schema.js'

const apiRoot = fileURLToPath(new URL('../', import.meta.url))

export function resolveDatabaseFile(file = process.env.DB_FILE_NAME ?? './data/app.db'): string {
  return isAbsolute(file) ? file : resolve(apiRoot, file)
}

export function openDatabase(file = process.env.DB_FILE_NAME ?? './data/app.db') {
  const databaseFile = resolveDatabaseFile(file)
  mkdirSync(dirname(databaseFile), { recursive: true })
  const sqlite = new Database(databaseFile)
  sqlite.pragma('foreign_keys = ON')
  sqlite.pragma('journal_mode = WAL')
  return { sqlite, db: drizzle(sqlite), databaseFile }
}

export function migrateDatabase(file = process.env.DB_FILE_NAME ?? './data/app.db'): string {
  const { sqlite, db, databaseFile } = openDatabase(file)
  try {
    migrate(db, { migrationsFolder: resolve(apiRoot, 'drizzle') })
    return databaseFile
  } finally {
    sqlite.close()
  }
}

export function seedDemoData(file = process.env.DB_FILE_NAME ?? './data/app.db'): number {
  const { sqlite, db } = openDatabase(file)
  try {
    const now = Date.now()
    const demoItems = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Monorepo 的边界应该很清楚',
        summary: '前端、后端和跨应用合同各自拥有明确职责。',
        content:
          '这个示例把浏览器应用放在 apps/web，把 API 放在 apps/api。\\n\\n真正跨应用传输的数据协议进入 packages/contracts，避免前后端各维护一份 DTO。',
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        title: 'Nest Module 保持粗粒度',
        summary: '复杂项目需要模块边界，模块数量也需要克制。',
        content:
          '当前按 Account、Catalog、Infrastructure 三个粗粒度边界组织。\\n\\nController 负责 HTTP，Service 负责用例，Repository 负责持久化查询。',
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        title: 'SQLite 也走 Migration',
        summary: '开发方便不意味着把数据库生命周期塞进 API 启动流程。',
        content:
          'Schema 通过 Drizzle 描述，Migration 用 drizzle-kit 显式生成并提交。\\n\\n测试库和开发库都从同一套 migration ledger 构建。',
      },
      {
        id: '44444444-4444-4444-8444-444444444444',
        title: '浏览器认证使用 Session Cookie',
        summary: '会话凭据留在 HttpOnly Cookie，前端不保存 token。',
        content:
          '登录和注册创建随机 Session Token，数据库只保存摘要。\\n\\n受保护的写请求额外验证 CSRF Token。',
      },
      {
        id: '55555555-5555-4555-8555-555555555555',
        title: '测试分层是脚手架的一部分',
        summary: 'Unit、Integration、HTTP、E2E 都有明确入口。',
        content:
          '模板已经准备了前端 Component Test、后端 Unit/Repository/HTTP Integration，以及 Playwright 全链路测试。',
      },
    ].map((item, index) => ({
      ...item,
      createdAt: new Date(now - index * 60_000),
    }))

    db.insert(items).values(demoItems).onConflictDoNothing({ target: items.id }).run()
    return demoItems.length
  } finally {
    sqlite.close()
  }
}
