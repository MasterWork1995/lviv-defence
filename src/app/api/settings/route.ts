import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbError } from "@/lib/api-error";
import { buildSettings, SETTING_KEYS } from "@/lib/settings";

export const revalidate = 30;

export async function GET() {
  let rows;
  try {
    rows = await prisma.setting.findMany({
      where: { key: { in: [...SETTING_KEYS] } },
    });
  } catch {
    return dbError();
  }

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const settings = buildSettings(map);

  return NextResponse.json(settings);
}
