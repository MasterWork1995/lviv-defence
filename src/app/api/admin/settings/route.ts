import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { apiError, dbError } from "@/lib/api-error";

export async function GET() {
  const session = await getSession();
  if (!session.isAdmin) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const settings = await prisma.setting.findMany();
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return NextResponse.json(map);
  } catch {
    return dbError();
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const body = await req.json();
    const allowed = ["total_goal_uah", "donate_preset_amounts_uah"];
    const updates = Object.entries(body).filter(([k]) => allowed.includes(k));

    if (updates.length === 0) {
      return apiError("No valid settings to update", 400, "VALIDATION_ERROR");
    }

    await Promise.all(
      updates.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch {
    return dbError();
  }
}
