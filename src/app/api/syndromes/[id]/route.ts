import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { syndromeSchema } from '@/lib/validations'
import { Prisma } from '@/generated/prisma-client'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    
    // Validate Input
    const validatedData = syndromeSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json({ error: validatedData.error.flatten() }, { status: 400 })
    }

    const { name, therapyPrinciple, acupoints, complaintIds } = validatedData.data
    
    const syndrome = await prisma.syndrome.update({
      where: { id },
      data: {
        name,
        therapyPrinciple,
        acupoints,
        complaints: complaintIds ? {
          deleteMany: {},
          create: complaintIds.map((complaintId: string) => ({
            complaintId
          }))
        } : undefined
      },
      include: {
        complaints: {
          include: { complaint: true }
        }
      }
    })
    return NextResponse.json(syndrome)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: `Syndrome with name "${(error.meta?.target as string[])?.[0] || "this name"}" already exists.` },
          { status: 400 }
        )
      }
    }
    console.error('Syndrome update error:', error)
    return NextResponse.json({ error: 'Failed to update syndrome' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // First delete related SyndromeRules
    await prisma.syndromeRule.deleteMany({
      where: { syndromeId: id }
    })
    
    // Then delete syndrome
    await prisma.syndrome.delete({
      where: { id }
    })
    return NextResponse.json({ message: 'Syndrome deleted' })
  } catch {
    return NextResponse.json({ error: 'Failed to delete syndrome' }, { status: 500 })
  }
}
