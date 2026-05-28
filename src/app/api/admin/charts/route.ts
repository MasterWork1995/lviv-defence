import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { apiError, dbError } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  const { searchParams } = req.nextUrl;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const days = parseInt(searchParams.get("days") ?? "14", 10);

  const fromDate = fromParam
    ? new Date(fromParam)
    : (() => { const d = new Date(); d.setDate(d.getDate() - (days - 1)); d.setHours(0, 0, 0, 0); return d; })();
  const toDate = toParam
    ? (() => { const d = new Date(toParam); d.setHours(23, 59, 59, 999); return d; })()
    : (() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; })();

  try {
    const [donations, coveredAreaAgg, settings] = await Promise.all([
      prisma.donation.findMany({
        where: { status: "paid", createdAt: { gte: fromDate, lte: toDate } },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.donation.aggregate({
        where: { status: "paid" },
        _sum: { squareM2: true },
      }),
      prisma.setting.findMany({
        where: { key: { in: ["total_goal_uah", "total_area_m2", "collected_uah"] } },
      }),
    ]);

    // Fill every day in range with 0 by default
    const dayMap = new Map<string, { amount: number; count: number }>();
    const cursor = new Date(fromDate);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= toDate) {
      dayMap.set(cursor.toISOString().slice(0, 10), { amount: 0, count: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    for (const d of donations) {
      const key = d.createdAt.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) { entry.amount += d.amount; entry.count += 1; }
    }

    const totalDays = dayMap.size;
    // For long ranges, group into weeks to avoid overcrowded axis
    const dailyDonations = Array.from(dayMap.entries()).map(([date, v]) => ({
      date: new Date(date + "T12:00:00").toLocaleDateString("uk-UA", {
        day: "numeric",
        month: totalDays > 45 ? undefined : "short",
      }),
      amount: v.amount,
      count: v.count,
    }));

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    const totalAreaM2 = parseFloat(settingsMap.total_area_m2 ?? "0");
    const totalGoalUah = parseInt(settingsMap.total_goal_uah ?? "0");
    const collectedUah = parseInt(settingsMap.collected_uah ?? "0");
    const coveredM2 = coveredAreaAgg._sum.squareM2 ?? 0;
    const coveragePercent = totalAreaM2 > 0 ? Math.min(100, (coveredM2 / totalAreaM2) * 100) : 0;
    const goalPercent = totalGoalUah > 0 ? Math.min(100, (collectedUah / totalGoalUah) * 100) : 0;

    return NextResponse.json({
      dailyDonations,
      coverage: {
        coveredM2,
        totalM2: totalAreaM2,
        coveragePercent: Math.round(coveragePercent * 100) / 100,
        collectedUah,
        totalGoalUah,
        goalPercent: Math.round(goalPercent * 100) / 100,
      },
    });
  } catch {
    return dbError();
  }
}
