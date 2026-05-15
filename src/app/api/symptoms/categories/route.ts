import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    const category = await prisma.symptomCategory.create({
      data: { name: body.name }
    })
    return NextResponse.json(category)
  } catch {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
