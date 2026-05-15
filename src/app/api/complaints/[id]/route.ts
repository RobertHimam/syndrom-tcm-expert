import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const complaint = await prisma.complaint.findUnique({
      where: { id }
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
    const complaint = await prisma.complaint.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description
      }
    })
    return NextResponse.json(complaint)
  } catch {
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
