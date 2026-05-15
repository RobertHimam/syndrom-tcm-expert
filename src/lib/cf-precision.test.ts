import { describe, it, expect, vi } from 'vitest'
import { calculateCombinedCF } from './diagnosis'

vi.mock('./prisma', () => ({
  prisma: {},
}))

describe('CF Algorithm - Floating Point Commutativity', () => {
  it('is commutative with arbitrary floating point weights', () => {
    const w1 = 0.123456789
    const w2 = 0.987654321
    const res1 = calculateCombinedCF([w1, w2])
    const res2 = calculateCombinedCF([w2, w1])
    
    // Check if they are exactly equal in JS
    expect(res1).toBe(res2)
  })

  it('is associative with arbitrary floating point weights', () => {
    const w1 = 0.1
    const w2 = 0.2
    const w3 = 0.3
    const res1 = calculateCombinedCF([w1, w2, w3])
    const res2 = calculateCombinedCF([w1, w3, w2])
    const res3 = calculateCombinedCF([w2, w1, w3])
    const res4 = calculateCombinedCF([w2, w3, w1])
    const res5 = calculateCombinedCF([w3, w1, w2])
    const res6 = calculateCombinedCF([w3, w2, w1])
    
    expect(res1).toBeCloseTo(res2)
    expect(res1).toBeCloseTo(res3)
    expect(res1).toBeCloseTo(res4)
    expect(res1).toBeCloseTo(res5)
    expect(res1).toBeCloseTo(res6)
  })
})
