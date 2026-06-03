import Image from "next/image";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { getTranslations } from "next-intl/server";
import { ProgressBarLive } from "./ProgressBarLive";
import { getSettings } from "@/lib/data";

export const Header = async () => {
  const [t, settings] = await Promise.all([getTranslations(), getSettings()]);

  return (
    <header className="z-50 flex flex-shrink-0 flex-col gap-2 border-b border-border/60 bg-bg/96 px-4 py-3 backdrop-blur-md lg:flex-row lg:items-center lg:gap-6 lg:px-6 lg:py-4">
      <div className="flex flex-shrink-0 items-center gap-3">
        <Image
          src="/assets/LogoMark.svg"
          alt={t("header.title")}
          width={80}
          height={80}
          priority
        />
        <div className="flex w-[3px] flex-shrink-0 self-stretch flex-col overflow-hidden rounded-full">
          <div className="flex-1 bg-blue-700" />
          <div className="flex-1 bg-yellow-400" />
        </div>
        <div className="flex flex-col leading-none">
          <p className="font-display text-[19px] font-bold uppercase tracking-[0.18em] text-text lg:text-[24px]">
            {t("header.title")}
          </p>
          <p className="font-display text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted lg:text-[15px]">
            {t("header.subTitle")}
          </p>
        </div>
        <div className="ml-auto lg:hidden">
          <LanguageSwitcher />
        </div>
      </div>

      <div className="hidden h-12 w-px flex-shrink-0 bg-border lg:block" />
      <div className="hidden min-w-0 flex-1 lg:block">
        <ProgressBarLive
          initial={{
            percent: settings.progressPercent,
            area: +(settings.collectedAreaM2 / 1_000_000).toFixed(1),
            total: Math.round(settings.totalAreaM2 / 1_000_000),
            collectedUah: settings.collectedUah,
            goalUah: settings.goalUah,
          }}
        />
      </div>

      <div className="lg:hidden">
        <ProgressBarLive
          initial={{
            percent: settings.progressPercent,
            area: +(settings.collectedAreaM2 / 1_000_000).toFixed(1),
            total: Math.round(settings.totalAreaM2 / 1_000_000),
            collectedUah: settings.collectedUah,
            goalUah: settings.goalUah,
          }}
        />
      </div>

      <div className="hidden h-12 w-px flex-shrink-0 bg-border lg:block" />
      <div className="hidden flex-shrink-0 lg:block">
        <LanguageSwitcher />
      </div>
    </header>
  );
};
