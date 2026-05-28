import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  if (!name) return NextResponse.json({ exists: false, totalAmount: 0, count: 0 });

  const agg = await prisma.donation.aggregate({
    where: { name: { equals: name, mode: "insensitive" }, status: "paid", isHidden: false },
    _sum: { amount: true },
    _count: { id: true },
  });

  return NextResponse.json({
    exists: agg._count.id > 0,
    totalAmount: agg._sum.amount ?? 0,
    count: agg._count.id,
  });
}
