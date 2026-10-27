import { Module } from '@nestjs/common'

import { HealthController } from './controllers/health.controller.js'
import { DatabaseService } from './database/database.service.js'

@Module({
  controllers: [HealthController],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class InfrastructureModule {}
