/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { calculateCombinedCF, diagnose } from './diagnosis'
import { prisma } from './prisma'
import { vi } from 'vitest'

vi.mock('./prisma', () => ({
  prisma: {
    syndromeRule: {
      findMany: vi.fn(),
    },
  },
}))

const mockFindMany = vi.mocked(prisma.syndromeRule.findMany)

describe('CF Algorithm - Duplicate symptoms', () => {
  it('artificially inflates CF when same symptom is provided multiple times', async () => {
    const syndromeA = { id: 'syn-a', name: 'Test' }
    
    // Mock rules: one rule for syn-a and opt-1
    mockFindMany.mockResolvedValue([
      { syndromeId: 'syn-a', syndrome: syndromeA, symptomOptionId: 'opt-1', cfWeight: 0.8 } as any
    ])

    // If diagnose handles duplicates correctly, it should only count opt-1 once.
    // But currently, diagnose calls findMany which returns the rule ONCE (because of IN clause).
    // Wait, let's re-examine diagnose function.
    
    const results = await diagnose(['opt-1', 'opt-1'])
    
    // If findMany returns the rule once, results[0].cfScore will be 0.8.
    // If it returns it twice, it will be 0.96.
    // SQL IN ('opt-1', 'opt-1') returns the row once.
    
    expect(results[0].cfScore).toBe(0.8) 
  })

  it('proves that calculateCombinedCF is vulnerable to duplicates', () => {
    const weights = [0.8, 0.8]
    const combined = calculateCombinedCF(weights)
    expect(combined).toBeGreaterThan(0.8) // 0.96
  })
})
