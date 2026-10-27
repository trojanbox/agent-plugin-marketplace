import 'dotenv/config'

import { migrateDatabase } from './database-tools.js'

const file = migrateDatabase()
console.log(`Migrations applied to ${file}`)
