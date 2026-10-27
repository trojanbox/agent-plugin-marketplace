import 'dotenv/config'

import { seedDemoData } from './database-tools.js'

const count = seedDemoData()
console.log(`Ensured ${count} demo items exist`)
