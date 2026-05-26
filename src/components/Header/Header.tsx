import { LanguageSwitcher } from "../LanguageSwitcher";
import { getTranslations } from "next-intl/server";
import { ProgressBarLive } from "./ProgressBarLive";
import { getSettings } from "@/lib/data";

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current text-gold lg:h-7 lg:w-7"
      aria-hidden="true"
    >
      <path d="M12 2L4 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" />
    </svg>
  );
}

export const Header = async () => {
  const [t, settings] = await Promise.all([getTranslations(), getSettings()]);

  return (
    // NOT absolute — grid takes care of layout; header is always in flow
    <header className="z-50 flex flex-shrink-0 flex-col gap-1.5 border-b border-border/60 bg-bg/96 px-4 py-2.5 backdrop-blur-md lg:flex-row lg:items-center lg:gap-6 lg:px-6 lg:py-3">

      {/* ── Logo row ── */}
      <div className="flex flex-shrink-0 items-center gap-2.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-gold/30 bg-surface-2 lg:h-11 lg:w-11">
          <ShieldIcon />
        </div>
        {/* UA flag stripe */}
        <div className="flex w-[3px] flex-shrink-0 self-stretch flex-col overflow-hidden rounded-full">
          <div className="flex-1 bg-blue-700" />
          <div className="flex-1 bg-yellow-400" />
        </div>
        <div className="flex flex-col leading-none">
          <p className="font-display text-[17px] font-bold uppercase tracking-[0.18em] text-text lg:text-[22px]">
            {t("header.title")}
          </p>
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted lg:text-[15px]">
            {t("header.subTitle")}
          </p>
        </div>
        {/* Language on mobile — same row as logo */}
        <div className="ml-auto lg:hidden">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Desktop divider */}
      <div className="hidden h-10 w-px flex-shrink-0 bg-border lg:block" />

      {/* ── Progress bar (hidden on mobile to reduce header height) ── */}
      <div className="hidden min-w-0 flex-1 lg:block">
        <ProgressBarLive
          initial={{
            percent: settings.progressPercent,
            area: Math.round(settings.collectedAreaM2 / 1_000_000),
            total: Math.round(settings.totalAreaM2 / 1_000_000),
            collectedUah: settings.collectedUah,
            goalUah: settings.goalUah,
          }}
        />
      </div>

      {/* Mobile progress bar — compact single-line version */}
      <div className="lg:hidden">
        <ProgressBarLive
          initial={{
            percent: settings.progressPercent,
            area: Math.round(settings.collectedAreaM2 / 1_000_000),
            total: Math.round(settings.totalAreaM2 / 1_000_000),
            collectedUah: settings.collectedUah,
            goalUah: settings.goalUah,
          }}
        />
      </div>

      {/* Desktop divider + language */}
      <div className="hidden h-10 w-px flex-shrink-0 bg-border lg:block" />
      <div className="hidden flex-shrink-0 lg:block">
        <LanguageSwitcher />
      </div>
    </header>
  );
};
