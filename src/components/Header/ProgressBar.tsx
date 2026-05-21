import { FC } from "react";
import { useTranslations } from "next-intl";

interface ProgressBarProps {
  percent: number;
  area: number;
  total: number;
}

export const ProgressBar: FC<ProgressBarProps> = ({ percent, area, total }) => {
  const t = useTranslations();

  return (
    <div className="w-full flex justify-center items-center">
      <div className="flex min-w-0 mx-20 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-primary/70" />
          <p className="font-display flex-shrink-0 text-5 font-semibold uppercase tracking-[0.3em] text-text">
            {t("hero.buildTogether")}
          </p>
          <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-primary/40 to-primary/70" />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className="glow-dome h-full rounded-full transition-all duration-500"
              style={{
                width: `${percent}%`,
                background:
                  "linear-gradient(90deg, var(--color-dome-line), var(--color-dome-select))",
              }}
            />
          </div>
          <span className="text-glow font-display flex-shrink-0 text-[16px] font-bold tabular-nums text-primary">
            {percent}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[18px] font-bold uppercase tracking-[0.15em] text-primary">
            {t("progress.funded", { percent })}
          </span>
          <span className="text-[18px] font-bold uppercase">
            <span className="text-text-muted">{t("progress.areaLabel")} </span>
            <span className="text-primary">
              {area} {t("progress.areaUnit")} / {total} {t("progress.areaUnit")}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
