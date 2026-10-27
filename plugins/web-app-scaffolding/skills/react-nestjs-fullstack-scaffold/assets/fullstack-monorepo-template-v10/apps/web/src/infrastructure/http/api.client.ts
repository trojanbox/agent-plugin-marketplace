import type { ApiFailure } from '@repo/contracts'

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly failure?: ApiFailure,
  ) {
    super(failure?.error.code ?? `HTTP_${status}`)
  }

  get errorCode(): string {
    return this.failure?.error.code ?? 'UNKNOWN'
  }
}

export class ApiClient {
  protected constructor() {}

  protected static basePath = '/api/v1'

  protected static readCookie(name: string): string | undefined {
    const prefix = `${encodeURIComponent(name)}=`
    return document.cookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix))
      ?.slice(prefix.length)
  }

  protected static isMutation(method: string): boolean {
    return !['GET', 'HEAD', 'OPTIONS'].includes(method)
  }

  protected static async request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const { body: requestBody, ...requestInit } = options
    const method = requestInit.method?.toUpperCase() ?? 'GET'
    const headers = new Headers(requestInit.headers)
    headers.set('Accept', 'application/json')

    let body: BodyInit | undefined
    if (requestBody !== undefined) {
      headers.set('Content-Type', 'application/json')
      body = JSON.stringify(requestBody)
    }

    if (this.isMutation(method)) {
      const csrfToken = this.readCookie('csrf_token')
      if (csrfToken) headers.set('X-CSRF-Token', decodeURIComponent(csrfToken))
    }

    const response = await fetch(`${this.basePath}${path}`, {
      ...requestInit,
      method,
      headers,
      ...(body !== undefined ? { body } : {}),
      credentials: 'include',
    })

    const payload = (await response.json()) as T | ApiFailure
    if (!response.ok) throw new ApiClientError(response.status, payload as ApiFailure)
    return payload as T
  }

  static get<T>(path: string, options?: ApiOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' })
  }

  static post<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body })
  }
}
