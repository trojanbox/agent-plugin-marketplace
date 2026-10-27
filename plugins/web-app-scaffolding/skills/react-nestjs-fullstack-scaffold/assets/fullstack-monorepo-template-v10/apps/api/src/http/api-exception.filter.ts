import { API_ERROR_CODE, type ApiFailure } from '@repo/contracts'
import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common'
import type { Response } from 'express'

import { ApplicationError, type ErrorCategory } from '../errors/application-error.js'

const categoryStatus: Record<ErrorCategory, number> = {
  validation: HttpStatus.BAD_REQUEST,
  unauthenticated: HttpStatus.UNAUTHORIZED,
  forbidden: HttpStatus.FORBIDDEN,
  not_found: HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
  internal: HttpStatus.INTERNAL_SERVER_ERROR,
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()

    if (exception instanceof ApplicationError) {
      const status = categoryStatus[exception.category]
      const payload: ApiFailure = {
        code: exception.options.numericCode ?? status,
        message: exception.message,
        data: {},
        error: {
          code: exception.code,
          retryable: exception.options.retryable ?? false,
          ...(exception.options.details ? { details: exception.options.details } : {}),
        },
      }
      response.status(status).json(payload)
      return
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const code = status === HttpStatus.BAD_REQUEST ? API_ERROR_CODE.Validation : `HTTP_${status}`
      const payload: ApiFailure = {
        code: status,
        message:
          status === HttpStatus.BAD_REQUEST ? 'Request validation failed' : exception.message,
        data: {},
        error: { code, retryable: false },
      }
      response.status(status).json(payload)
      return
    }

    console.error(exception)
    const payload: ApiFailure = {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      data: {},
      error: { code: API_ERROR_CODE.Internal, retryable: false },
    }
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(payload)
  }
}
