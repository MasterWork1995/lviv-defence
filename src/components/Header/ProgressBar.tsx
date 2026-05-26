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

/* Decorative line with a glowing dot at one end — used on both sides of the title */
function DecoLine({ side }: { side: "left" | "right" }) {
  return (
    <div className="relative hidden h-px flex-1 lg:block">
      <div
        className={
          side === "left"
            ? "absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-primary/80"
            : "absolute inset-0 bg-gradient-to-l from-transparent via-primary/40 to-primary/80"
        }
      />
      <span
        className={
          "absolute top-1/2 -translate-y-1/2 h-[5px] w-[5px] rounded-full bg-primary " +
          (side === "left" ? "right-0" : "left-0")
        }
        style={{ boxShadow: "0 0 8px var(--color-primary)" }}
      />
    </div>
  );
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
    <div className="flex w-full flex-col gap-2">
      {/* ── Title with decorative dotted lines on both sides ── */}
      <div className="flex items-center gap-3 lg:gap-4">
        <DecoLine side="left" />
        <p className="text-glow flex-shrink-0 font-display text-[12px] font-semibold uppercase tracking-[0.32em] text-text lg:text-[18px] lg:tracking-[0.28em]">
          {t("hero.buildTogether")}
        </p>
        <DecoLine side="right" />
      </div>

      {/* ── Progress bar + big percent ── */}
      <div className="flex items-center gap-3 lg:gap-4">
        <div className="relative h-3 flex-1 overflow-hidden rounded-full border border-primary/40 bg-surface-3/80 lg:h-[18px]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              background:
                "linear-gradient(90deg, var(--color-dome-line) 0%, var(--color-primary) 55%, var(--color-dome-select) 100%)",
              boxShadow:
                "0 0 16px rgba(0, 200, 240, 0.55), inset 0 0 6px rgba(255,255,255,0.25)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-full opacity-50"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
              backgroundSize: "40% 100%",
              backgroundRepeat: "no-repeat",
              animation: "progress-shimmer 3s linear infinite",
            }}
          />
        </div>
        <span className="text-glow flex-shrink-0 font-display text-[14px] font-bold tabular-nums text-primary lg:text-[24px]">
          {percent}%
        </span>
      </div>

      {/* ── Footer stats row ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.06em] lg:text-[11px]">
        <span className="whitespace-nowrap">
          <span className="text-text-muted">{t("progress.fundedLabel")}</span>{" "}
          <span className="font-semibold text-primary">
            {formatUah(collectedUah, locale)} ₴ / {formatUah(goalUah, locale)} ₴
          </span>
        </span>
        <span className="whitespace-nowrap">
          <span className="text-text-muted">{t("progress.areaLabel")}</span>{" "}
          <span className="font-semibold text-primary">
            {area} {t("progress.areaUnit")}
          </span>
          <span className="text-text-muted"> / </span>
          <span className="text-text-dim">
            {total} {t("progress.areaUnit")}
          </span>
        </span>
      </div>
    </div>
  );
};
