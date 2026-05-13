import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      complaintsCount,
      syndromesCount,
      rulesCount,
      contributorsCount,
      recentConsultations
    ] = await Promise.all([
      prisma.complaint.count(),
      prisma.syndrome.count(),
      prisma.syndromeRule.count(),
      prisma.contributor.count(),
      prisma.consultation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          complaint: true,
        }
      })
    ])

    return NextResponse.json({
      complaintsCount,
      syndromesCount,
      rulesCount,
      contributorsCount,
      recentConsultations
    })
  } catch (error) {
    console.error('Stats API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
