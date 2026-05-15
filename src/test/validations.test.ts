import { describe, it, expect } from 'vitest'
import {
  diagnoseSchema,
  loginSchema,
  syndromeSchema,
  syndromeRuleSchema,
  patientSchema,
} from '@/lib/validations'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('patientSchema', () => {
  it('accepts valid patient data', () => {
    expect(patientSchema.safeParse({ age: 30, gender: 'Male' }).success).toBe(true)
    expect(patientSchema.safeParse({ age: 0, gender: 'Female' }).success).toBe(true)
    expect(patientSchema.safeParse({ age: 120, gender: 'Male' }).success).toBe(true)
  })

  it('coerces string age to number', () => {
    expect(patientSchema.safeParse({ age: '25', gender: 'Female' }).success).toBe(true)
  })

  it('rejects age below 0', () => {
    expect(patientSchema.safeParse({ age: -1, gender: 'Male' }).success).toBe(false)
  })

  it('rejects age above 120', () => {
    expect(patientSchema.safeParse({ age: 121, gender: 'Male' }).success).toBe(false)
  })

  it('rejects invalid gender value', () => {
    expect(patientSchema.safeParse({ age: 30, gender: 'Unknown' }).success).toBe(false)
  })
})

describe('syndromeSchema', () => {
  it('accepts valid syndrome data', () => {
    const result = syndromeSchema.safeParse({
      name: 'Heart Blood Deficiency',
      therapyPrinciple: 'Nourish Heart Blood, calm Shen.',
      acupoints: 'HT7, PC6',
    })
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 characters', () => {
    const result = syndromeSchema.safeParse({
      name: 'A',
      therapyPrinciple: 'Valid principle here',
      acupoints: 'HT7',
    })
    expect(result.success).toBe(false)
  })

  it('rejects therapyPrinciple shorter than 5 characters', () => {
    const result = syndromeSchema.safeParse({
      name: 'Valid Name',
      therapyPrinciple: 'Hi',
      acupoints: 'HT7',
    })
    expect(result.success).toBe(false)
  })

  it('rejects acupoints shorter than 2 characters', () => {
    const result = syndromeSchema.safeParse({
      name: 'Valid Name',
      therapyPrinciple: 'Valid principle here',
      acupoints: 'H',
    })
    expect(result.success).toBe(false)
  })
})

describe('syndromeRuleSchema', () => {
  it('accepts valid rule with cfWeight in range', () => {
    expect(
      syndromeRuleSchema.safeParse({
        syndromeId: VALID_UUID,
        symptomOptionId: VALID_UUID,
        cfWeight: 0.75,
      }).success
    ).toBe(true)
  })

  it('accepts cfWeight of exactly 0', () => {
    expect(
      syndromeRuleSchema.safeParse({
        syndromeId: VALID_UUID,
        symptomOptionId: VALID_UUID,
        cfWeight: 0,
      }).success
    ).toBe(true)
  })

  it('accepts cfWeight of exactly 1', () => {
    expect(
      syndromeRuleSchema.safeParse({
        syndromeId: VALID_UUID,
        symptomOptionId: VALID_UUID,
        cfWeight: 1,
      }).success
    ).toBe(true)
  })

  it('rejects cfWeight below -1', () => {
    expect(
      syndromeRuleSchema.safeParse({
        syndromeId: VALID_UUID,
        symptomOptionId: VALID_UUID,
        cfWeight: -1.1,
      }).success
    ).toBe(false)
  })

  it('rejects cfWeight above 1', () => {
    expect(
      syndromeRuleSchema.safeParse({
        syndromeId: VALID_UUID,
        symptomOptionId: VALID_UUID,
        cfWeight: 1.1,
      }).success
    ).toBe(false)
  })

  it('rejects non-UUID syndromeId', () => {
    expect(
      syndromeRuleSchema.safeParse({
        syndromeId: 'not-a-uuid',
        symptomOptionId: VALID_UUID,
        cfWeight: 0.5,
      }).success
    ).toBe(false)
  })

  it('rejects non-UUID symptomOptionId', () => {
    expect(
      syndromeRuleSchema.safeParse({
        syndromeId: VALID_UUID,
        symptomOptionId: 'not-a-uuid',
        cfWeight: 0.5,
      }).success
    ).toBe(false)
  })
})

describe('diagnoseSchema', () => {
  it('accepts valid payload with multiple symptoms', () => {
    const result = diagnoseSchema.safeParse({
      symptomOptionIds: [VALID_UUID, VALID_UUID],
      patientData: { age: 25, gender: 'Male' },
      complaintId: VALID_UUID,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty symptomOptionIds array', () => {
    const result = diagnoseSchema.safeParse({
      symptomOptionIds: [],
      patientData: { age: 25, gender: 'Male' },
      complaintId: VALID_UUID,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Select at least one symptom')
    }
  })

  it('rejects invalid UUID in symptomOptionIds', () => {
    expect(
      diagnoseSchema.safeParse({
        symptomOptionIds: ['not-a-uuid'],
        patientData: { age: 25, gender: 'Male' },
        complaintId: VALID_UUID,
      }).success
    ).toBe(false)
  })

  it('rejects invalid complaintId', () => {
    expect(
      diagnoseSchema.safeParse({
        symptomOptionIds: [VALID_UUID],
        patientData: { age: 25, gender: 'Male' },
        complaintId: 'not-a-uuid',
      }).success
    ).toBe(false)
  })

  it('rejects invalid patient age in nested patientData', () => {
    expect(
      diagnoseSchema.safeParse({
        symptomOptionIds: [VALID_UUID],
        patientData: { age: 200, gender: 'Male' },
        complaintId: VALID_UUID,
      }).success
    ).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid username and password', () => {
    const result = loginSchema.safeParse({ username: 'admin', password: 'password123' })
    expect(result.success).toBe(true)
  })

  it('rejects empty username', () => {
    const result = loginSchema.safeParse({ username: '', password: 'password123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Username is required')
    }
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ username: 'admin', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password is required')
    }
  })
})
