import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    
    const syndrome = await prisma.syndrome.update({
      where: { id },
      data: {
        name: body.name,
        therapyPrinciple: body.therapyPrinciple,
        acupoints: body.acupoints
      }
    })
    return NextResponse.json(syndrome)
  } catch (error) {
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete syndrome' }, { status: 500 })
  }
}
