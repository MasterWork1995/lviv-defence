import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbError } from "@/lib/api-error";

export const revalidate = 30;

const PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const search = searchParams.get("q")?.trim() ?? "";

  const where = {
    status: "paid",
    isHidden: false,
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  let donations, total;
  try {
    [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          amount: true,
          squareM2: true,
          sector: true,
          createdAt: true,
        },
      }),
      prisma.donation.count({ where }),
    ]);
  } catch {
    return dbError();
  }

  return NextResponse.json({
    donations,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}
