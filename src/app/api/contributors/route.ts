import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const contributors = await prisma.contributor.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(contributors)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch contributors' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const contributor = await prisma.contributor.create({
      data: {
        name: body.name,
        title: body.title
      }
    })
    return NextResponse.json(contributor)
  } catch {
    return NextResponse.json({ error: 'Failed to create contributor' }, { status: 500 })
  }
}
