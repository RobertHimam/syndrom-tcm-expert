import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { syndromeSchema } from "@/lib/validations";
import { Prisma } from '@/generated/prisma-client';

export async function GET() {
  try {
    const syndromes = await prisma.syndrome.findMany({
      include: {
        complaints: {
          include: {
            complaint: true
          }
        }
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(syndromes);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch syndromes" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validate Input
    const validatedData = syndromeSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.flatten() },
        { status: 400 },
      );
    }

    const { name, therapyPrinciple, acupoints } = validatedData.data;

    // 2. Create Syndrome
    const syndrome = await prisma.syndrome.create({
      data: {
        name,
        therapyPrinciple,
        acupoints,
      },
    });
    return NextResponse.json(syndrome);
  } catch (error) {
    // Handle Prisma unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            error: `Syndrome with name "${(error.meta?.target as string[])?.[0] || "this name"}" already exists.`,
          },
          { status: 400 },
        );
      }
    }

    console.error("Syndrome creation error:", error);
    return NextResponse.json(
      { error: "Failed to create syndrome" },
      { status: 500 },
    );
  }
}
