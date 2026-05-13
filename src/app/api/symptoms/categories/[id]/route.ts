import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const category = await prisma.symptomCategory.update({
      where: { id },
      data: { name: body.name }
    })
    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Options will be deleted automatically if cascade is set in schema
    // In schema.prisma it's not explicitly set, so we should check
    // Actually Prisma defaults to restrict if not specified usually, 
    // but let's assume we want to delete related options too.
    
    // First delete related SyndromeRules
    const options = await prisma.symptomOption.findMany({
      where: { categoryId: id }
    })
    const optionIds = options.map(o => o.id)
    
    await prisma.syndromeRule.deleteMany({
      where: { symptomOptionId: { in: optionIds } }
    })
    
    // Then delete options
    await prisma.symptomOption.deleteMany({
      where: { categoryId: id }
    })
    
    // Finally delete category
    await prisma.symptomCategory.delete({
      where: { id }
    })
    return NextResponse.json({ message: 'Category deleted' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
