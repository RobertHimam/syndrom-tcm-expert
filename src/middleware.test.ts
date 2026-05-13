import { describe, it, expect, vi } from 'vitest'
import { middleware } from './middleware'
import { NextRequest, NextResponse } from 'next/server'

// Mock NextResponse
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      redirect: vi.fn((url: string) => ({ status: 307, headers: new Map([['location', url.toString()]]) })),
      next: vi.fn(() => ({ status: 200, headers: new Map() })),
      json: vi.fn((body, init) => ({ status: init?.status || 200, body })),
    }
  }
})

describe('Middleware', () => {
  const createMockRequest = (pathname: string, hasCookie = false): NextRequest => {
    return {
      nextUrl: {
        pathname,
      },
      url: `http://localhost:3000${pathname}`,
      cookies: {
        get: vi.fn((name) => hasCookie ? { name, value: 'true' } : undefined),
      },
    } as unknown as NextRequest
  }

  it('allows access to public routes', () => {
    const req = createMockRequest('/login')
    middleware(req)
    expect(NextResponse.next).toHaveBeenCalled()
  })

  it('redirects unauthenticated users to /admin/login from /admin', () => {
    const req = createMockRequest('/admin/dashboard')
    middleware(req)
    expect(NextResponse.redirect).toHaveBeenCalledWith(new URL('/admin/login', 'http://localhost:3000/admin/dashboard'))
  })

  it('allows authenticated users to access /admin', () => {
    const req = createMockRequest('/admin/dashboard', true)
    middleware(req)
    expect(NextResponse.next).toHaveBeenCalled()
  })

  it('allows unauthenticated users to access /admin/login', () => {
    const req = createMockRequest('/admin/login')
    middleware(req)
    expect(NextResponse.next).toHaveBeenCalled()
  })

  it('blocks unauthenticated users from /api/admin', () => {
    const req = createMockRequest('/api/admin/stats')
    const response = middleware(req) as NextResponse
    expect(response.status).toBe(401)
  })

  it('blocks unauthenticated users from /api/rules', () => {
    const req = createMockRequest('/api/rules')
    const response = middleware(req) as NextResponse
    expect(response.status).toBe(401)
  })

  it('allows authenticated users to access /api/admin', () => {
    const req = createMockRequest('/api/admin/stats', true)
    middleware(req)
    expect(NextResponse.next).toHaveBeenCalled()
  })
})
