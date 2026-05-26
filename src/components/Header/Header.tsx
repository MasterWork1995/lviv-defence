import { LanguageSwitcher } from "../LanguageSwitcher";
import { getTranslations } from "next-intl/server";
import { ProgressBarLive } from "./ProgressBarLive";
import { getSettings } from "@/lib/data";

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-current text-gold lg:h-8 lg:w-8"
      aria-hidden="true"
    >
      <path d="M12 2L4 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" />
    </svg>
  );
}

export const Header = async () => {
  const [t, settings] = await Promise.all([getTranslations(), getSettings()]);

  return (
    <header className="absolute inset-x-0 top-0 z-50 flex flex-col gap-2 border-b border-border bg-transparent px-4 py-3 lg:min-h-[120px] lg:flex-row lg:items-center lg:gap-6 lg:px-6 lg:py-4">
      {/* Row 1: logo + language switcher (mobile only in this row) */}
      <div className="flex flex-shrink-0 items-center gap-2.5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border border-gold/30 bg-surface-2 lg:h-14 lg:w-14">
          <ShieldIcon />
        </div>
        <div className="flex w-[3px] self-stretch flex-col overflow-hidden rounded-full">
          <div className="flex-1 bg-blue-700" />
          <div className="flex-1 bg-yellow-400" />
        </div>
        <div className="flex flex-col leading-none">
          <p className="font-display text-[20px] font-bold uppercase tracking-[0.18em] text-text lg:text-[35px]">
            {t("header.title")}
          </p>
          <p className="font-display text-[13px] font-medium uppercase tracking-[0.22em] text-text-muted lg:text-[25px]">
            {t("header.subTitle")}
          </p>
        </div>
        <div className="ml-auto lg:hidden">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Divider — desktop only */}
      <div className="hidden h-15 w-px flex-shrink-0 bg-border lg:block" />

      {/* Row 2 (mobile) / center (desktop): progress bar */}
      <div className="pb-1 lg:min-w-0 lg:flex-1 lg:pb-0">
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

      {/* Divider + language switcher — desktop only */}
      <div className="hidden h-15 w-px flex-shrink-0 bg-border lg:block" />
      <div className="hidden lg:block">
        <LanguageSwitcher />
      </div>
    </header>
  );
};
