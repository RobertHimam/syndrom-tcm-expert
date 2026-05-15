import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.contributor.delete({
      where: { id }
    })
    return NextResponse.json({ message: 'Contributor deleted' })
  } catch {
    return NextResponse.json({ error: 'Failed to delete contributor' }, { status: 500 })
  }
}
