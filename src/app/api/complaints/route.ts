import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const complaints = await prisma.complaint.findMany({
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
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    const complaint = await prisma.complaint.create({
      data: {
        name: body.name,
        description: body.description
      }
    })
    return NextResponse.json(complaint)
  } catch {
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 })
  }
}
