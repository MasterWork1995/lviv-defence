import { FC } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatUah } from "@/lib/format";

interface ProgressBarProps {
  percent: number;
  area: number;
  total: number;
  collectedUah: number;
  goalUah: number;
}

export const ProgressBar: FC<ProgressBarProps> = ({
  percent,
  area,
  total,
  collectedUah,
  goalUah,
}) => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-primary/70" />
        <p className="flex-shrink-0 font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-text lg:text-[18px]">
          {t("hero.buildTogether")}
        </p>
        <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-primary/40 to-primary/70" />
      </div>
      <div className="flex items-center gap-3">
        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-surface-3 lg:h-4">
          <div
            className="glow-dome h-full rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              background:
                "linear-gradient(90deg, var(--color-dome-line), var(--color-dome-select))",
            }}
          />
        </div>
        <span className="text-glow flex-shrink-0 font-display text-[12px] font-bold tabular-nums text-primary lg:text-[16px]">
          {percent}%
        </span>
      </div>
      <div className="flex flex-col gap-0.5 lg:flex-row lg:items-center lg:justify-between lg:gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] lg:text-[18px]">
          <span className="text-text-muted">{t("progress.fundedLabel")} </span>
          <span className="text-primary">
            {formatUah(collectedUah, locale)} ₴ / {formatUah(goalUah, locale)} ₴
          </span>
        </span>
        <span className="text-[10px] font-bold uppercase lg:text-[18px]">
          <span className="text-text-muted">{t("progress.areaLabel")} </span>
          <span className="text-primary">
            {area} {t("progress.areaUnit")} / {total} {t("progress.areaUnit")}
          </span>
        </span>
      </div>
    </div>
  );
};
