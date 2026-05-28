import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { apiError, dbError } from "@/lib/api-error";

export async function GET() {
  const session = await getSession();
  if (!session.isAdmin) return apiError("Unauthorized", 401, "UNAUTHORIZED");

  try {
    const [
      totalDonations,
      paidDonations,
      pendingDonations,
      hiddenDonations,
      manualDonations,
      raisedAgg,
      expensesAgg,
      expensesCount,
      settings,
      recentDonations,
    ] = await Promise.all([
      prisma.donation.count(),
      prisma.donation.count({ where: { status: "paid" } }),
      prisma.donation.count({ where: { status: "pending" } }),
      prisma.donation.count({ where: { isHidden: true } }),
      prisma.donation.count({ where: { isManual: true } }),
      prisma.donation.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.expense.count(),
      prisma.setting.findMany({ where: { key: { in: ["total_goal_uah"] } } }),
      prisma.donation.findMany({
        where: { status: "paid" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, amount: true, squareM2: true, createdAt: true, isManual: true },
      }),
    ]);

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    const totalRaised = raisedAgg._sum.amount ?? 0;
    const goal = parseInt(settingsMap.total_goal_uah ?? "0");

    return NextResponse.json({
      totalDonations,
      paidDonations,
      pendingDonations,
      hiddenDonations,
      manualDonations,
      totalRaised,
      totalExpenses: expensesAgg._sum.amount ?? 0,
      expensesCount,
      goal,
      goalPercent: goal > 0 ? Math.min(100, Math.round((totalRaised / goal) * 100 * 10) / 10) : 0,
      recentDonations,
    });
  } catch {
    return dbError();
  }
}
