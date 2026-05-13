import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { diagnoseSchema } from '@/lib/validations'
import { diagnose } from '@/lib/diagnosis'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 1. Validate Input
    const validatedData = diagnoseSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json({ error: validatedData.error.flatten() }, { status: 400 })
    }

    const { symptomOptionIds, patientData, complaintId } = validatedData.data

    // 2. Perform Diagnosis using verified utility
    const diagnosisResults = await diagnose(symptomOptionIds)

    // 3. Save consultation
    await prisma.consultation.create({
      data: {
        patientAge: patientData.age,
        patientGender: patientData.gender,
        complaintId: complaintId,
        diagnosisResult: diagnosisResults,
        selectedSymptoms: {
          create: symptomOptionIds.map(id => ({
            symptomOptionId: id
          }))
        }
      }
    })

    return NextResponse.json(diagnosisResults)
  } catch (error) {
    console.error('Diagnosis error:', error)
    return NextResponse.json({ error: 'Failed to perform diagnosis' }, { status: 500 })
  }
}

