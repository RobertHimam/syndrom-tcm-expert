import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { complaintSchema } from '@/lib/validations'
import { Prisma } from '@/generated/prisma-client'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        syndromes: {
          include: { syndrome: true }
        }
      }
    })
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }
    return NextResponse.json(complaint)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch complaint' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    
    // Validate Input
    const validatedData = complaintSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json({ error: validatedData.error.flatten() }, { status: 400 })
    }

    const { name, description, syndromeIds } = validatedData.data

    // Update complaint and its associations
    const complaint = await prisma.complaint.update({
      where: { id },
      data: {
        name,
        description,
        syndromes: syndromeIds ? {
          deleteMany: {},
          create: syndromeIds.map((syndromeId: string) => ({
            syndromeId
          }))
        } : undefined
      },
      include: {
        syndromes: {
          include: { syndrome: true }
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
    console.error('Complaint update error:', error)
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.complaint.delete({
      where: { id }
    })
    return NextResponse.json({ message: 'Complaint deleted' })
  } catch {
    return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 })
  }
}
