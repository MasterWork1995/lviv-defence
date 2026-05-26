import { LanguageSwitcher } from "../LanguageSwitcher";
import { getTranslations } from "next-intl/server";
import { ProgressBarLive } from "./ProgressBarLive";
import { getSettings } from "@/lib/data";

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 fill-current text-gold"
      aria-hidden="true"
    >
      <path d="M12 2L4 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" />
    </svg>
  );
}

export const Header = async () => {
  const [t, settings] = await Promise.all([getTranslations(), getSettings()]);

  return (
    <header className="absolute inset-x-0 top-0 z-50 flex min-h-[120px] flex-shrink-0 items-center gap-4 border-b border-border bg-transparent px-5 py-4 lg:gap-6 lg:px-6">
      <div className="flex flex-shrink-0 flex-col gap-0.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-14 w-14 items-center justify-center rounded border border-gold/30 bg-surface-2">
            <ShieldIcon />
          </div>
          <div className="flex w-[3px] self-stretch flex-col overflow-hidden rounded-full">
            <div className="flex-1 bg-blue-700" />
            <div className="flex-1 bg-yellow-400" />
          </div>
          <div className="flex flex-col leading-none">
            <p className="font-display text-[35px] font-bold uppercase tracking-[0.18em] text-text">
              {t("header.title")}
            </p>
            <p className="font-display text-[25px] font-medium uppercase tracking-[0.22em] text-text-muted">
              {t("header.subTitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="h-15 w-px flex-shrink-0 bg-border" />
      <ProgressBarLive
        initial={{
          percent: settings.progressPercent,
          area: Math.round(settings.collectedAreaM2 / 1_000_000),
          total: Math.round(settings.totalAreaM2 / 1_000_000),
        }}
      />
      <div className="h-15 w-px flex-shrink-0 bg-border" />
      <LanguageSwitcher />
    </header>
  );
};
