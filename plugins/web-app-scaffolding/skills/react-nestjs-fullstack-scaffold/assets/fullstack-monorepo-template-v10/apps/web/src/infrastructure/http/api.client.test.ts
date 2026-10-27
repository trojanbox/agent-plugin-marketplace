import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiClient } from './api.client'

afterEach(() => {
  vi.unstubAllGlobals()
  document.cookie = 'csrf_token=; Max-Age=0; Path=/'
})

describe('ApiClient', () => {
  it('sends CSRF token for mutation requests', async () => {
    document.cookie = 'csrf_token=csrf-value; Path=/'
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 0, message: '', data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await ApiClient.post('/example', { hello: 'world' })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = new Headers(init.headers)
    expect(headers.get('X-CSRF-Token')).toBe('csrf-value')
    expect(init.credentials).toBe('include')
  })

  it('throws a typed error for API failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 401,
            message: 'Authentication required',
            data: {},
            error: { code: 'UNAUTHENTICATED', retryable: false },
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    await expect(ApiClient.get('/items')).rejects.toMatchObject({
      status: 401,
      errorCode: 'UNAUTHENTICATED',
    })
  })

  it('supports subclass-specific HTTP boundaries', async () => {
    class CustomApiClient extends ApiClient {
      protected static override basePath = '/custom-api'
    }

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 0, message: '', data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await CustomApiClient.get('/status')

    expect(fetchMock).toHaveBeenCalledWith('/custom-api/status', expect.any(Object))
  })
})
