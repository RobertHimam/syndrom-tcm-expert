import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    complaint: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockFindMany = vi.mocked(prisma.complaint.findMany)
const mockCreate = vi.mocked(prisma.complaint.create)

describe('GET /api/complaints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns list of complaints ordered by name', async () => {
    const complaints = [
      { id: '1', name: 'Headache', description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Insomnia', description: 'Trouble sleeping', createdAt: new Date(), updatedAt: new Date() },
    ]
    mockFindMany.mockResolvedValue(complaints)

    const res = await GET()

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
    expect(data[0].name).toBe('Headache')
  })

  it('returns 500 when database query fails', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'))

    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('POST /api/complaints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a complaint with valid name', async () => {
    const created = { id: 'new-1', name: 'Fatigue', description: null, createdAt: new Date(), updatedAt: new Date() }
    mockCreate.mockResolvedValue(created)

    const req = new Request('http://localhost/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Fatigue' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('Fatigue')
  })

  it('returns 400 when name is missing', async () => {
    const req = new Request('http://localhost/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'no name here' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('persists optional description when provided', async () => {
    const created = { id: 'new-2', name: 'Anxiety', description: 'Chronic worry', createdAt: new Date(), updatedAt: new Date() }
    mockCreate.mockResolvedValue(created)

    const req = new Request('http://localhost/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Anxiety', description: 'Chronic worry' }),
    })
    await POST(req)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Anxiety', description: 'Chronic worry' }),
      })
    )
  })

  it('returns 500 when database create fails', async () => {
    mockCreate.mockRejectedValue(new Error('DB error'))

    const req = new Request('http://localhost/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('creates a complaint with syndrome associations', async () => {
    const syndromeIds = ['f47ac10b-58cc-4372-a567-0e02b2c3d479', '550e8400-e29b-41d4-a716-446655440000']
    const body = { name: 'Insomnia', syndromeIds }
    const mockComplaint = { id: 'c-1', name: 'Insomnia', syndromes: syndromeIds.map(id => ({ syndrome: { id, name: 'S-' + id } })) }
    
    mockCreate.mockResolvedValue(mockComplaint as any)

    const request = new Request('http://localhost/api/complaints', {
      method: 'POST',
      body: JSON.stringify(body)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.syndromes).toHaveLength(2)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          syndromes: {
            create: [
              { syndromeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
              { syndromeId: '550e8400-e29b-41d4-a716-446655440000' }
            ]
          }
        })
      })
    )
  })
})
