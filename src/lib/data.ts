import { prisma } from "./prisma";
import { buildSettings, SETTING_KEYS } from "./settings";

export async function getSettings() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return buildSettings(map);
}
