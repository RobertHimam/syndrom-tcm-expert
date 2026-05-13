import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { POST } from './route'
import { NextRequest } from 'next/server'

describe('Syndrome API - Duplicate Name Validation (TDD)', () => {
  const TEST_SYNDROME_NAME = 'Duplicate Test Syndrome'

  beforeAll(async () => {
    // Cleanup
    await prisma.syndromeRule.deleteMany({
      where: { syndrome: { name: TEST_SYNDROME_NAME } }
    })
    await prisma.syndrome.deleteMany({
      where: { name: TEST_SYNDROME_NAME }
    })
  })

  it('should fail when creating a syndrome with an existing name', async () => {
    // 1. Create first syndrome
    const req1 = new NextRequest('http://localhost:3000/api/syndromes', {
      method: 'POST',
      body: JSON.stringify({
        name: TEST_SYNDROME_NAME,
        therapyPrinciple: 'Test Principle',
        acupoints: 'Test Points'
      })
    })
    const res1 = await POST(req1)
    expect(res1.status).toBe(200)

    // 2. Try to create another with same name
    const req2 = new NextRequest('http://localhost:3000/api/syndromes', {
      method: 'POST',
      body: JSON.stringify({
        name: TEST_SYNDROME_NAME,
        therapyPrinciple: 'Another Principle',
        acupoints: 'Another Points'
      })
    })
    const res2 = await POST(req2)

    expect(res2.status).toBe(400)
    const data = await res2.json()
    expect(data.error).toMatch(/already exists/i)
  })

  it('should fail with 400 when input is invalid (Zod)', async () => {
    const req = new NextRequest('http://localhost:3000/api/syndromes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'S', // Too short (min 2 in schema)
        therapyPrinciple: 'Short',
        acupoints: 'P'
      })
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
    expect(data.error.fieldErrors.name).toBeDefined()
  })
})
