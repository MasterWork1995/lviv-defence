import type { useTranslations } from "next-intl";
import { formatUah } from "@/lib/format";

type Translate = ReturnType<typeof useTranslations>;

export { formatUah };

export const formatArea = (m2: number, t: Translate): string => {
  if (m2 === 0) return "";
  if (m2 < 100_000) {
    return t("donateModal.areaUnitM2", {
      value: new Intl.NumberFormat("uk-UA").format(Math.round(m2)),
    });
  }
  const km2 = m2 / 1_000_000;
  return t("donateModal.areaUnitKm2", {
    value: km2 >= 1 ? km2.toFixed(2) : km2.toFixed(3),
  });
};
