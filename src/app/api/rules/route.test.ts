import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'
import { prisma } from '@/lib/prisma'
import { syndromeRuleSchema } from '@/lib/validations'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    syndromeRule: {
      upsert: vi.fn(),
    },
  },
}))

describe('POST /api/rules', () => {
  const syndromeId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  const symptomOptionId = '550e8400-e29b-41d4-a716-446655440000'

  it('successfully saves a rule with a negative CF weight', async () => {
    const body = { syndromeId, symptomOptionId, cfWeight: -0.8 }
    
    // Validate with schema first (mimicking what we should add to route.ts)
    const validated = syndromeRuleSchema.parse(body)
    expect(validated.cfWeight).toBe(-0.8)

    vi.mocked(prisma.syndromeRule.upsert).mockResolvedValue({ id: 'rule-1', ...body } as any)

    const request = new Request('http://localhost/api/rules', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.cfWeight).toBe(-0.8)
  })

  it('fails if cfWeight is less than -1', () => {
    const body = { syndromeId, symptomOptionId, cfWeight: -1.1 }
    const result = syndromeRuleSchema.safeParse(body)
    expect(result.success).toBe(false)
  })

  it('fails if cfWeight is greater than 1', () => {
    const body = { syndromeId, symptomOptionId, cfWeight: 1.1 }
    const result = syndromeRuleSchema.safeParse(body)
    expect(result.success).toBe(false)
  })
})
