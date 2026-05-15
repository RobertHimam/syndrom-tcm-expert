/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { diagnose } from './diagnosis'
import { prisma } from './prisma'

vi.mock('./prisma', () => ({
  prisma: {
    syndromeRule: {
      findMany: vi.fn(),
    },
  },
}))

const mockFindMany = vi.mocked(prisma.syndromeRule.findMany)

describe('Diagnosis - Complaint Scoping', () => {
  it('currently returns syndromes from ALL complaints (the bug)', async () => {
    const syndromeInsomnia = { id: 'syn-insomnia', name: 'Insomnia Pattern' }
    const syndromeHeadache = { id: 'syn-headache', name: 'Headache Pattern' }
    
    // Mock rules: opt-1 points to both an Insomnia syndrome and a Headache syndrome
    mockFindMany.mockResolvedValue([
      { syndromeId: 'syn-insomnia', syndrome: syndromeInsomnia, symptomOptionId: 'opt-1', cfWeight: 0.8 } as any,
      { syndromeId: 'syn-headache', syndrome: syndromeHeadache, symptomOptionId: 'opt-1', cfWeight: 0.5 } as any
    ])

    // When diagnosing for Insomnia, we might only want syn-insomnia.
    // But currently diagnose() has no concept of complaintId.
    const results = await diagnose(['opt-1'])
    
    expect(results).toHaveLength(2)
    expect(results.find(r => r.name === 'Insomnia Pattern')).toBeDefined()
    expect(results.find(r => r.name === 'Headache Pattern')).toBeDefined()
  })
})
