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

    if (typeof body.description === "string") data.description = body.description.trim();
    if (body.category && ["equipment", "services", "other"].includes(body.category)) {
      data.category = body.category;
    }
    if (typeof body.amount === "number" && isFinite(body.amount) && body.amount > 0) {
      data.amount = Math.round(body.amount);
    }

    if (Object.keys(data).length === 0) {
      return apiError("No valid fields to update", 400, "VALIDATION_ERROR");
    }

    const expense = await prisma.expense.update({ where: { id }, data });
    return NextResponse.json(expense);
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
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return dbError();
  }
}
