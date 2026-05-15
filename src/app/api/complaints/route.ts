import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { complaintSchema } from '@/lib/validations'
import { Prisma } from '@/generated/prisma-client'

export async function GET() {
  try {
    const complaints = await prisma.complaint.findMany({
      include: {
        syndromes: {
          include: {
            syndrome: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(complaints)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Validate Input
    const validatedData = complaintSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json({ error: validatedData.error.flatten() }, { status: 400 })
    }

    const { name, description, syndromeIds } = validatedData.data

    const complaint = await prisma.complaint.create({
      data: {
        name,
        description,
        syndromes: syndromeIds ? {
          create: syndromeIds.map((syndromeId: string) => ({
            syndromeId
          }))
        } : undefined
      },
      include: {
        syndromes: {
          include: {
            syndrome: true
          }
        }
      }
    })
    return NextResponse.json(complaint)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: `Complaint with name "${(error.meta?.target as string[])?.[0] || "this name"}" already exists.` },
          { status: 400 }
        )
      }
    }
    console.error('Complaint creation error:', error)
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 })
  }
}
