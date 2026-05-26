import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbError } from "@/lib/api-error";

export const revalidate = 30;

export async function GET() {
  let rows;
  try {
    rows = await prisma.setting.findMany({
      where: { key: { in: ["total_goal_kopecks", "collected_kopecks", "total_area_m2"] } },
    });
  } catch {
    return dbError();
  }

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const goalKopecks = parseInt(map["total_goal_kopecks"] ?? "0", 10);
  const collectedKopecks = parseInt(map["collected_kopecks"] ?? "0", 10);
  const totalAreaM2 = parseFloat(map["total_area_m2"] ?? "0");
  const progressPercent = goalKopecks > 0
    ? Math.min(100, Math.round((collectedKopecks / goalKopecks) * 100))
    : 0;
  const m2PerKopeck = goalKopecks > 0 ? totalAreaM2 / goalKopecks : 0;
  const collectedAreaM2 = collectedKopecks * m2PerKopeck;

  return NextResponse.json({ goalKopecks, collectedKopecks, totalAreaM2, collectedAreaM2, progressPercent });
}
