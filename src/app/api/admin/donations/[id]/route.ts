import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { apiError, dbError } from "@/lib/api-error";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isAdmin) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const { id } = await params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.isHidden === "boolean") data.isHidden = body.isHidden;
    if (body.status && ["pending", "paid", "cancelled"].includes(body.status)) {
      data.status = body.status;
    }
    if (typeof body.name === "string") data.name = body.name.trim();

    if (Object.keys(data).length === 0) {
      return apiError("No valid fields to update", 400, "VALIDATION_ERROR");
    }

    const donation = await prisma.donation.update({ where: { id }, data });

    if ("status" in data) {
      const totalPaid = await prisma.donation.aggregate({
        where: { status: "paid" },
        _sum: { amount: true },
      });
      await prisma.setting.upsert({
        where: { key: "collected_uah" },
        update: { value: String(totalPaid._sum.amount ?? 0) },
        create: { key: "collected_uah", value: String(totalPaid._sum.amount ?? 0) },
      });
    }

    return NextResponse.json(donation);
  } catch {
    return dbError();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isAdmin) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const { id } = await params;
  try {
    await prisma.donation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return dbError();
  }
}
