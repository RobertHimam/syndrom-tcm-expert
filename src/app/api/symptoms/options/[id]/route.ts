import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const option = await prisma.symptomOption.update({
      where: { id },
      data: { name: body.name }
    })
    return NextResponse.json(option)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update option' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Delete related SyndromeRules first
    await prisma.syndromeRule.deleteMany({
      where: { symptomOptionId: id }
    })
    
    await prisma.symptomOption.delete({
      where: { id }
    })
    return NextResponse.json({ message: 'Option deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete option' }, { status: 500 })
  }
}
