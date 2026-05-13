import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const syndromeId = searchParams.get('syndromeId')

  try {
    const rules = await prisma.syndromeRule.findMany({
      where: syndromeId ? { syndromeId } : {},
      include: {
        symptomOption: {
          include: { category: true }
        }
      }
    })
    return NextResponse.json(rules)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Upsert rule
    const rule = await prisma.syndromeRule.upsert({
      where: {
        syndromeId_symptomOptionId: {
          syndromeId: body.syndromeId,
          symptomOptionId: body.symptomOptionId
        }
      },
      update: {
        cfWeight: body.cfWeight
      },
      create: {
        syndromeId: body.syndromeId,
        symptomOptionId: body.symptomOptionId,
        cfWeight: body.cfWeight
      }
    })
    return NextResponse.json(rule)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save rule' }, { status: 500 })
  }
}
