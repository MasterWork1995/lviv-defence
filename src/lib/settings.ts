export const SETTING_KEYS = [
  "total_goal_uah",
  "collected_uah",
  "total_area_m2",
  "donate_preset_amounts_uah",
] as const;

export const parsePresetAmountsUah = (raw: string | undefined): number[] => {
  if (!raw?.trim()) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (n): n is number => typeof n === "number" && Number.isInteger(n) && n >= 1,
      );
    }
  } catch {
    return raw
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n >= 1);
  }

  return [];
};

export const computeM2PerUah = (
  goalUah: number,
  totalAreaM2: number,
): number => (goalUah > 0 ? totalAreaM2 / goalUah : 0);

export interface AppSettings {
  goalUah: number;
  collectedUah: number;
  totalAreaM2: number;
  collectedAreaM2: number;
  progressPercent: number;
  m2PerUah: number;
  presetAmountsUah: number[];
}

export const buildSettings = (
  map: Record<string, string | undefined>,
): AppSettings => {
  const goalUah = parseInt(map.total_goal_uah ?? "0", 10);
  const collectedUah = parseInt(map.collected_uah ?? "0", 10);
  const totalAreaM2 = parseFloat(map.total_area_m2 ?? "0");
  const progressPercent =
    goalUah > 0
      ? Math.min(100, Math.round((collectedUah / goalUah) * 100))
      : 0;
  const m2PerUah = computeM2PerUah(goalUah, totalAreaM2);
  const collectedAreaM2 = collectedUah * m2PerUah;

  return {
    goalUah,
    collectedUah,
    totalAreaM2,
    collectedAreaM2,
    progressPercent,
    m2PerUah,
    presetAmountsUah: parsePresetAmountsUah(map.donate_preset_amounts_uah),
  };
};
