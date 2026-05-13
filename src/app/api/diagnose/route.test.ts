import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    consultation: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/diagnosis', () => ({
  diagnose: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { diagnose } from '@/lib/diagnosis'

const mockDiagnose = vi.mocked(diagnose)
const mockCreate = vi.mocked(prisma.consultation.create)

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('POST /api/diagnose', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when symptomOptionIds is empty', async () => {
    const req = makeRequest({
      symptomOptionIds: [],
      patientData: { age: 30, gender: 'Male' },
      complaintId: VALID_UUID,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when patientData is missing', async () => {
    const req = makeRequest({
      symptomOptionIds: [VALID_UUID],
      complaintId: VALID_UUID,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when complaintId is not a valid UUID', async () => {
    const req = makeRequest({
      symptomOptionIds: [VALID_UUID],
      patientData: { age: 30, gender: 'Male' },
      complaintId: 'bad-id',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns diagnosis results on valid input', async () => {
    const fakeResults = [
      {
        id: 'syn-1',
        syndromeId: 'syn-1',
        name: 'Heart Blood Deficiency',
        therapyPrinciple: 'Nourish Heart Blood',
        acupoints: 'HT7',
        cfScore: 0.8,
        confidence: 80,
        confidenceLevel: 'Highly Likely',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    mockDiagnose.mockResolvedValue(fakeResults)
    mockCreate.mockResolvedValue({} as never)

    const req = makeRequest({
      symptomOptionIds: [VALID_UUID],
      patientData: { age: 30, gender: 'Male' },
      complaintId: VALID_UUID,
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('Heart Blood Deficiency')
  })

  it('saves the consultation after diagnosis', async () => {
    mockDiagnose.mockResolvedValue([])
    mockCreate.mockResolvedValue({} as never)

    const req = makeRequest({
      symptomOptionIds: [VALID_UUID],
      patientData: { age: 25, gender: 'Female' },
      complaintId: VALID_UUID,
    })
    await POST(req)

    expect(mockCreate).toHaveBeenCalledOnce()
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          patientAge: 25,
          patientGender: 'Female',
          complaintId: VALID_UUID,
        }),
      })
    )
  })

  it('returns 500 when diagnosis throws an error', async () => {
    mockDiagnose.mockRejectedValue(new Error('DB error'))

    const req = makeRequest({
      symptomOptionIds: [VALID_UUID],
      patientData: { age: 30, gender: 'Male' },
      complaintId: VALID_UUID,
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
