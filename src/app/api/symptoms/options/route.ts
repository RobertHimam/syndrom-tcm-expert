import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.name || !body.categoryId) {
      return NextResponse.json({ error: 'Name and categoryId are required' }, { status: 400 })
    }
    const option = await prisma.symptomOption.create({
      data: { 
        name: body.name,
        categoryId: body.categoryId
      }
    })
    return NextResponse.json(option)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create option' }, { status: 500 })
  }
}
