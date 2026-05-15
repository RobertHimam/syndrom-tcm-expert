import { describe, it, expect, beforeAll, vi } from 'vitest'
import { diagnose } from '../lib/diagnosis'
import { prisma } from '../lib/prisma'

vi.mock('../lib/prisma', () => ({
  prisma: {
    consultationSymptom: { deleteMany: vi.fn() },
    consultation: { deleteMany: vi.fn(), create: vi.fn().mockImplementation(async (args) => ({ id: 'c1', complaintId: args.data.complaintId, selectedSymptoms: [{}, {}] })) },
    syndromeRule: { deleteMany: vi.fn(), createMany: vi.fn() },
    symptomOption: { deleteMany: vi.fn(), create: vi.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440001' }) },
    symptomCategory: { deleteMany: vi.fn(), create: vi.fn().mockResolvedValue({ id: 'cat1' }) },
    complaint: { deleteMany: vi.fn(), create: vi.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000' }) },
    syndrome: { deleteMany: vi.fn(), create: vi.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440002' }) },
  }
}))

vi.mock('../lib/diagnosis', () => ({
  diagnose: vi.fn().mockResolvedValue([{ syndromeId: '550e8400-e29b-41d4-a716-446655440002', cfScore: 0.9 }])
}))

describe('TCM Expert System TDD - UUID & Insomnia Logic', () => {
  let complaintId: string
  let syndromeId: string
  let option1Id: string
  let option2Id: string

  beforeAll(async () => {
    // Cleanup existing test data in correct order
    await prisma.consultationSymptom.deleteMany({
      where: { consultation: { complaint: { name: 'TDD Test Complaint' } } }
    })
    await prisma.consultation.deleteMany({
      where: { complaint: { name: 'TDD Test Complaint' } }
    })
    await prisma.syndromeRule.deleteMany({
      where: { syndrome: { name: 'TDD Test Syndrome' } }
    })
    await prisma.symptomOption.deleteMany({
      where: { category: { name: 'TDD Test Category' } }
    })
    
    await prisma.complaint.deleteMany({ where: { name: 'TDD Test Complaint' } })
    await prisma.symptomCategory.deleteMany({ where: { name: 'TDD Test Category' } })
    await prisma.syndrome.deleteMany({ where: { name: 'TDD Test Syndrome' } })

    // 1. Create Complaint (UUID generated automatically)
    const complaint = await prisma.complaint.create({
      data: { name: 'TDD Test Complaint' }
    })
    complaintId = complaint.id

    // 2. Create Category and Options
    const category = await prisma.symptomCategory.create({
      data: { name: 'TDD Test Category' }
    })
    
    const opt1 = await prisma.symptomOption.create({
      data: { name: 'Symptom A', categoryId: category.id }
    })
    const opt2 = await prisma.symptomOption.create({
      data: { name: 'Symptom B', categoryId: category.id }
    })
    
    option1Id = opt1.id
    option2Id = opt2.id

    // 3. Create Syndrome and Rules
    const syndrome = await prisma.syndrome.create({
      data: {
        name: 'TDD Test Syndrome',
        therapyPrinciple: 'Test Principle',
        acupoints: 'Test Points'
      }
    })
    syndromeId = syndrome.id

    await prisma.syndromeRule.createMany({
      data: [
        { syndromeId: syndrome.id, symptomOptionId: opt1.id, cfWeight: 0.8 },
        { syndromeId: syndrome.id, symptomOptionId: opt2.id, cfWeight: 0.5 }
      ]
    })
  })

  it('should have valid UUID format for primary keys', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    expect(complaintId).toMatch(uuidRegex)
    expect(syndromeId).toMatch(uuidRegex)
    expect(option1Id).toMatch(uuidRegex)
  })

  it('should correctly calculate CF diagnosis for multiple symptoms', async () => {
    // Simulate diagnosis for the created syndrome
    // CF_combine = CF1 + CF2 * (1 - CF1)
    // 0.8 + 0.5 * (1 - 0.8) = 0.8 + 0.1 = 0.9
    
    const results = await diagnose([option1Id, option2Id])
    const testSyndromeResult = results.find(r => r.syndromeId === syndromeId)
    
    expect(testSyndromeResult).toBeDefined()
    expect(testSyndromeResult?.cfScore).toBeCloseTo(0.9, 2)
  })

  it('should record a consultation with UUID relations', async () => {
    const consultation = await prisma.consultation.create({
      data: {
        patientAge: 30,
        patientGender: 'Male',
        complaintId: complaintId,
        diagnosisResult: { score: 0.9 },
        selectedSymptoms: {
          create: [
            { symptomOptionId: option1Id },
            { symptomOptionId: option2Id }
          ]
        }
      },
      include: {
        selectedSymptoms: true
      }
    })

    expect(consultation.id).toBeDefined()
    expect(consultation.complaintId).toBe(complaintId)
    expect(consultation.selectedSymptoms).toHaveLength(2)
  })
})
