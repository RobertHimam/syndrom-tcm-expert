import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from '@/generated/prisma-client';

const uuidSchema = z.string().uuid();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const complaintIdRaw = searchParams.get("complaintId");

    let complaintId: string | null = null;
    if (complaintIdRaw) {
      const result = uuidSchema.safeParse(complaintIdRaw);
      if (result.success) {
        complaintId = result.data;
      } else {
        console.warn("Invalid complaintId provided:", complaintIdRaw);
      }
    }

    let categoryWhere: Prisma.SymptomCategoryWhereInput = {};

    if (complaintId) {
      const syndromes = await prisma.syndrome.findMany({
        where: { complaints: { some: { complaintId } } },
        select: { id: true },
      });

      const syndromeIds = syndromes.map((s) => s.id);

      if (syndromeIds.length === 0) {
        return NextResponse.json([]);
      }

      categoryWhere = {
        options: {
          some: {
            syndromeRules: {
              some: {
                syndromeId: { in: syndromeIds },
              },
            },
          },
        },
      };
    }

    const categories = await prisma.symptomCategory.findMany({
      where: categoryWhere,
      include: {
        options: {
          include: {
            syndromeRules: {
              select: {
                syndromeId: true,
              },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    const categoriesWithFrequency = categories.map((cat) => {
      const uniqueSyndromes = new Set<string>();
      cat.options.forEach((opt) => {
        opt.syndromeRules.forEach((rule) => {
          uniqueSyndromes.add(rule.syndromeId);
        });
      });
      return {
        ...cat,
        syndromeCount: uniqueSyndromes.size,
      };
    });

    categoriesWithFrequency.sort((a, b) => {
      if (b.syndromeCount !== a.syndromeCount) {
        return b.syndromeCount - a.syndromeCount;
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json(categoriesWithFrequency);
  } catch (error: unknown) {
    console.error("Fetch symptoms error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      {
        error: "Failed to fetch symptoms",
        details: message,
        stack: stack,
      },
      { status: 500 },
    );
  }
}
