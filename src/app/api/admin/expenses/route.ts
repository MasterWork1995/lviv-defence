import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { apiError, dbError } from "@/lib/api-error";

export async function GET() {
  const session = await getSession();
  if (!session.isAdmin) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const expenses = await prisma.expense.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ expenses });
  } catch (err) {
    console.error("[expenses GET]", err);
    return dbError();
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const { description, category, amount } = await req.json();

    if (!description || !category || typeof amount !== "number" || !isFinite(amount) || amount <= 0) {
      return apiError("Missing required fields", 400, "VALIDATION_ERROR");
    }
    if (!["equipment", "services", "other"].includes(category)) {
      return apiError("Invalid category", 400, "VALIDATION_ERROR");
    }

    const expense = await prisma.expense.create({
      data: {
        description: String(description).trim(),
        category,
        amount: Math.round(amount),
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    console.error("[expenses POST]", err);
    return dbError();
  }
}
