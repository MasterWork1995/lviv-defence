import { prisma } from "./prisma";

export async function getSettings() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["total_goal_kopecks", "collected_kopecks", "total_area_m2"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const goalKopecks = parseInt(map["total_goal_kopecks"] ?? "0", 10);
  const collectedKopecks = parseInt(map["collected_kopecks"] ?? "0", 10);
  const totalAreaM2 = parseFloat(map["total_area_m2"] ?? "0");
  const progressPercent = goalKopecks > 0
    ? Math.min(100, Math.round((collectedKopecks / goalKopecks) * 100))
    : 0;
  const m2PerKopeck = goalKopecks > 0 ? totalAreaM2 / goalKopecks : 0;
  const collectedAreaM2 = collectedKopecks * m2PerKopeck;

  return { goalKopecks, collectedKopecks, totalAreaM2, collectedAreaM2, progressPercent };
}
