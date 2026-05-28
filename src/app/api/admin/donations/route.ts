import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { apiError, dbError } from "@/lib/api-error";
import { getSettings } from "@/lib/data";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const status = searchParams.get("status") ?? "";
  const hidden = searchParams.get("hidden") ?? "";
  const search = searchParams.get("q")?.trim() ?? "";

  const where: Record<string, unknown> = {};
  if (status && ["pending", "paid", "cancelled"].includes(status)) where.status = status;
  if (hidden === "true") where.isHidden = true;
  if (hidden === "false") where.isHidden = false;
  if (search) where.name = { contains: search, mode: "insensitive" };

  try {
    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.donation.count({ where }),
    ]);

    return NextResponse.json({
      donations,
      pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
    });
  } catch {
    return dbError();
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const { name, amount } = await req.json();

    if (!name || typeof amount !== "number" || amount <= 0) {
      return apiError("Missing required fields", 400, "VALIDATION_ERROR");
    }

    const trimmedName = String(name).trim();
    const roundedAmount = Math.round(amount);
    const { m2PerUah } = await getSettings();

    const existing = await prisma.donation.findFirst({
      where: { name: { equals: trimmedName, mode: "insensitive" }, status: "paid" },
      orderBy: { createdAt: "desc" },
    });

    let donation;
    if (existing) {
      const newAmount = existing.amount + roundedAmount;
      const newM2 = parseFloat((newAmount * m2PerUah).toFixed(4));
      donation = await prisma.donation.update({
        where: { id: existing.id },
        data: { amount: newAmount, squareM2: newM2 },
      });
    } else {
      donation = await prisma.donation.create({
        data: {
          name: trimmedName,
          amount: roundedAmount,
          squareM2: parseFloat((roundedAmount * m2PerUah).toFixed(4)),
          status: "paid",
          isManual: true,
        },
      });
    }

    const totalPaid = await prisma.donation.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
    });
    await prisma.setting.upsert({
      where: { key: "collected_uah" },
      update: { value: String(totalPaid._sum.amount ?? 0) },
      create: { key: "collected_uah", value: String(totalPaid._sum.amount ?? 0) },
    });

    return NextResponse.json(donation, { status: existing ? 200 : 201 });
  } catch {
    return dbError();
  }
}
