"use client";

import { useTranslations } from "next-intl";
import type { PanelStats } from "./types";
import { panelCard } from "./styles";
import { ChevronIcon, ShieldIcon } from "./icons";

type CtaCardProps = {
  stats: PanelStats;
  onDonate: () => void;
};

export const CtaCard = ({ stats, onDonate }: CtaCardProps) => {
  const t = useTranslations();

  return (
    <section className={`${panelCard} border-primary/30`}>
      <div className="mb-3 flex items-start gap-2.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded border border-gold/30 bg-surface-2">
          <ShieldIcon className="h-4 w-4 text-gold" />
        </div>
        <div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-text lg:text-[12px]">
            {t("search.ctaTitle")}
          </p>
          <p className="mt-0.5 font-sans text-[11px] text-text-muted">
            {t("search.ctaSubtitle")}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onDonate}
        className="glow-primary group flex w-full cursor-pointer items-center justify-between rounded-lg border border-primary bg-gradient-to-b from-primary/15 to-primary/5 px-4 py-3 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-primary transition-all duration-200 hover:from-primary/25 hover:to-primary/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary lg:text-[12px]"
      >
        <span>{t("search.protectSegment")}</span>
        <ChevronIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatItem
          dotClassName="border-primary/60 bg-primary/15"
          dotGlow="0 0 6px rgba(0,200,240,0.4)"
          value={t("search.areaValue", {
            value: stats.totalKm2,
            unit: t("progress.areaUnit"),
          })}
          label={t("search.totalAreaLabel")}
          valueClassName="text-text"
        />
        <StatItem
          dotClassName="border-gold/70 bg-gold/15"
          dotGlow="0 0 6px rgba(240,180,41,0.45)"
          value={t("search.areaValue", {
            value: stats.collectedKm2,
            unit: t("progress.areaUnit"),
          })}
          label={t("search.protectedAreaLabel")}
          valueClassName="text-gold"
        />
      </div>
    </section>
  );
};

const StatItem = ({
  dotClassName,
  dotGlow,
  value,
  label,
  valueClassName,
}: {
  dotClassName: string;
  dotGlow: string;
  value: string;
  label: string;
  valueClassName: string;
}) => (
  <div className="flex items-center gap-2.5">
    <span
      className={`h-3 w-3 flex-shrink-0 rounded-full border ${dotClassName}`}
      style={{ boxShadow: dotGlow }}
    />
    <div className="min-w-0">
      <div
        className={`font-display text-[13px] font-bold leading-none lg:text-[14px] ${valueClassName}`}
      >
        {value}
      </div>
      <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-text-muted">
        {label}
      </div>
    </div>
  </div>
);
