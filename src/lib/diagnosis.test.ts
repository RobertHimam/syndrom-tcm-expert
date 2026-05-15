import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateCombinedCF, mapConfidenceToLevel, diagnose } from './diagnosis'

vi.mock('./prisma', () => ({
  prisma: {
    syndromeRule: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from './prisma'

const mockFindMany = vi.mocked(prisma.syndromeRule.findMany)

describe('calculateCombinedCF', () => {
  it('should return 0 for empty weights', () => {
    expect(calculateCombinedCF([])).toBe(0)
  })

  it('should return the weight if only one weight is provided', () => {
    expect(calculateCombinedCF([0.8])).toBe(0.8)
  })

  it('should correctly combine two weights', () => {
    // 0.8 + 0.6 * (1 - 0.8) = 0.8 + 0.6 * 0.2 = 0.8 + 0.12 = 0.92
    expect(calculateCombinedCF([0.8, 0.6])).toBeCloseTo(0.92)
  })

  it('should correctly combine two negative weights', () => {
    // CF1 < 0, CF2 < 0: CF1 + CF2 * (1 + CF1)
    // -0.8 + (-0.6) * (1 + (-0.8)) = -0.8 - 0.6 * 0.2 = -0.8 - 0.12 = -0.92
    expect(calculateCombinedCF([-0.8, -0.6])).toBeCloseTo(-0.92)
  })

  it('should correctly combine mixed signs (positive and negative)', () => {
    // CF1 * CF2 < 0: (CF1 + CF2) / (1 - min(|CF1|, |CF2|))
    // (0.8 + (-0.6)) / (1 - 0.6) = 0.2 / 0.4 = 0.5
    expect(calculateCombinedCF([0.8, -0.6])).toBeCloseTo(0.5)

    // (-0.8 + 0.6) / (1 - 0.6) = -0.2 / 0.4 = -0.5
    expect(calculateCombinedCF([-0.8, 0.6])).toBeCloseTo(-0.5)
  })

  it('should correctly combine weights when one is 1 and another is -1', () => {
    // Special case: contradictory absolute certainty
    // Formula (1 + -1) / (1 - 1) is undefined, but practically it should handle it.
    // However, the standard formula handles it as 1.0 (if we process sequentially)
    // Actually, in some systems this is an error, but let's see how we handle it.
    expect(calculateCombinedCF([1.0, -1.0])).toBe(0) 
  })

  it('should correctly combine three mixed weights', () => {
    // (0.8, 0.6) -> 0.92
    // (0.92, -0.5) -> (0.92 - 0.5) / (1 - 0.5) = 0.42 / 0.5 = 0.84
    expect(calculateCombinedCF([0.8, 0.6, -0.5])).toBeCloseTo(0.84)
  })

  it('should correctly combine three weights', () => {
    // (0.8, 0.6) -> 0.92
    // (0.92, 0.4) -> 0.92 + 0.4 * (1 - 0.92) = 0.92 + 0.4 * 0.08 = 0.92 + 0.032 = 0.952
    expect(calculateCombinedCF([0.8, 0.6, 0.4])).toBeCloseTo(0.952)
  })

  it('should handle weights of 1 correctly', () => {
    expect(calculateCombinedCF([1.0, 0.5])).toBe(1.0)
  })
})

describe('mapConfidenceToLevel', () => {
  it('should return "Highly Likely" for confidence >= 80', () => {
    expect(mapConfidenceToLevel(80)).toBe('Highly Likely')
    expect(mapConfidenceToLevel(95)).toBe('Highly Likely')
  })

  it('should return "Likely" for confidence between 50 and 79', () => {
    expect(mapConfidenceToLevel(50)).toBe('Likely')
    expect(mapConfidenceToLevel(79)).toBe('Likely')
  })

  it('should return "Possible" for confidence between 20 and 49', () => {
    expect(mapConfidenceToLevel(20)).toBe('Possible')
    expect(mapConfidenceToLevel(49)).toBe('Possible')
  })

  it('should return "Unlikely" for confidence < 20', () => {
    expect(mapConfidenceToLevel(0)).toBe('Unlikely')
    expect(mapConfidenceToLevel(19)).toBe('Unlikely')
  })
})

describe('diagnose()', () => {
  const syndromeA = {
    id: 'syn-a',
    name: 'Heart Blood Deficiency',
    therapyPrinciple: 'Nourish Heart Blood',
    acupoints: 'HT7, PC6',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const syndromeB = {
    id: 'syn-b',
    name: 'Liver Fire',
    therapyPrinciple: 'Drain Liver Fire',
    acupoints: 'LV2, GB20',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when no matching rules exist', async () => {
    mockFindMany.mockResolvedValue([])
    const result = await diagnose(['opt-1'])
    expect(result).toEqual([])
  })

  it('returns a single syndrome with correct cfScore from one matching symptom', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeRules: any[] = [
      { id: 'r1', syndromeId: 'syn-a', syndrome: syndromeA, symptomOptionId: 'opt-1', cfWeight: 0.8, createdAt: new Date(), updatedAt: new Date() },
    ]
    mockFindMany.mockResolvedValue(fakeRules)

    const result = await diagnose(['opt-1'])

    expect(result).toHaveLength(1)
    expect(result[0].syndromeId).toBe('syn-a')
    expect(result[0].cfScore).toBeCloseTo(0.8)
    expect(result[0].confidence).toBe(80)
    expect(result[0].confidenceLevel).toBe('Highly Likely')
  })

  it('combines multiple matching symptoms for the same syndrome using CF formula', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeRules: any[] = [
      { id: 'r1', syndromeId: 'syn-a', syndrome: syndromeA, symptomOptionId: 'opt-1', cfWeight: 0.8, createdAt: new Date(), updatedAt: new Date() },
      { id: 'r2', syndromeId: 'syn-a', syndrome: syndromeA, symptomOptionId: 'opt-2', cfWeight: 0.6, createdAt: new Date(), updatedAt: new Date() },
    ]
    mockFindMany.mockResolvedValue(fakeRules)

    const result = await diagnose(['opt-1', 'opt-2'])

    expect(result).toHaveLength(1)
    // CF_combine = 0.8 + 0.6 * (1 - 0.8) = 0.92
    expect(result[0].cfScore).toBeCloseTo(0.92)
    expect(result[0].confidence).toBe(92)
  })

  it('returns syndromes sorted by cfScore descending', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeRules: any[] = [
      { id: 'r1', syndromeId: 'syn-b', syndrome: syndromeB, symptomOptionId: 'opt-1', cfWeight: 0.5, createdAt: new Date(), updatedAt: new Date() },
      { id: 'r2', syndromeId: 'syn-a', syndrome: syndromeA, symptomOptionId: 'opt-2', cfWeight: 0.9, createdAt: new Date(), updatedAt: new Date() },
    ]
    mockFindMany.mockResolvedValue(fakeRules)

    const result = await diagnose(['opt-1', 'opt-2'])

    expect(result).toHaveLength(2)
    expect(result[0].syndromeId).toBe('syn-a')
    expect(result[1].syndromeId).toBe('syn-b')
  })

  it('handles multiple syndromes independently', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeRules: any[] = [
      { id: 'r1', syndromeId: 'syn-a', syndrome: syndromeA, symptomOptionId: 'opt-1', cfWeight: 0.8, createdAt: new Date(), updatedAt: new Date() },
      { id: 'r2', syndromeId: 'syn-b', syndrome: syndromeB, symptomOptionId: 'opt-2', cfWeight: 0.6, createdAt: new Date(), updatedAt: new Date() },
    ]
    mockFindMany.mockResolvedValue(fakeRules)

    const result = await diagnose(['opt-1', 'opt-2'])

    expect(result).toHaveLength(2)
    const a = result.find((r) => r.syndromeId === 'syn-a')
    const b = result.find((r) => r.syndromeId === 'syn-b')
    expect(a?.cfScore).toBeCloseTo(0.8)
    expect(b?.cfScore).toBeCloseTo(0.6)
  })

  it('correctly handles a syndrome with both supporting and conflicting symptoms', async () => {
    // Syndrome A: Symptom 1 (0.8 support), Symptom 3 (-0.5 conflict)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeRules: any[] = [
      { id: 'r1', syndromeId: 'syn-a', syndrome: syndromeA, symptomOptionId: 'opt-1', cfWeight: 0.8, createdAt: new Date(), updatedAt: new Date() },
      { id: 'r3', syndromeId: 'syn-a', syndrome: syndromeA, symptomOptionId: 'opt-3', cfWeight: -0.5, createdAt: new Date(), updatedAt: new Date() },
    ]
    mockFindMany.mockResolvedValue(fakeRules)

    const result = await diagnose(['opt-1', 'opt-3'])

    expect(result).toHaveLength(1)
    expect(result[0].syndromeId).toBe('syn-a')
    // (0.8 - 0.5) / (1 - 0.5) = 0.3 / 0.5 = 0.6
    expect(result[0].cfScore).toBeCloseTo(0.6)
    expect(result[0].confidence).toBe(60)
    expect(result[0].confidenceLevel).toBe('Likely')
  })

  it('queries only rules matching the provided symptom option ids', async () => {
    mockFindMany.mockResolvedValue([])
    await diagnose(['opt-x', 'opt-y'])
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { symptomOptionId: { in: ['opt-x', 'opt-y'] } },
      })
    )
  })
})
