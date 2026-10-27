import { StandardSchemaValidationPipe, type INestApplication } from '@nestjs/common'
import helmet from 'helmet'

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api/v1')
  app.use(helmet())
  app.useGlobalPipes(new StandardSchemaValidationPipe({ transform: true }))
}
