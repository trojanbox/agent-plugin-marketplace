export type ErrorCategory =
  'validation' | 'unauthenticated' | 'forbidden' | 'not_found' | 'conflict' | 'internal'

export class ApplicationError extends Error {
  constructor(
    readonly category: ErrorCategory,
    readonly code: string,
    message: string,
    readonly options: {
      details?: Record<string, unknown>
      retryable?: boolean
      numericCode?: number
    } = {},
  ) {
    super(message)
  }
}
