import Image from "next/image";
import { useTranslations } from "next-intl";
import { DomePlaceholder } from "@/components/DomePlaceholder";
import { SearchPanel } from "@/components/SearchPanel";

export const Hero = () => {
  const t = useTranslations();

  return (
    <section className="relative h-screen">
      <Image
        src="/Lviv.jpeg"
        alt="Нічний Львів"
        fill
        priority
        className="object-cover object-center"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(4,9,26,0.72) 0%, rgba(4,9,26,0.35) 40%, rgba(4,9,26,0.55) 70%, rgba(4,9,26,0.92) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 50% 60%, rgba(26,101,192,0.22) 0%, transparent 70%)",
        }}
      />

      <div className="absolute inset-0 flex">
        <div className="relative flex flex-1 flex-col">
          <div className="px-5 pt-[140px] lg:px-8">
            <div className="mb-2 flex items-center gap-3">
              <div className="h-px w-8 bg-dome-line opacity-70" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.35em] text-dome-select opacity-75">
                {t("hero.buildTogether")}
              </span>
              <div className="h-px w-14 bg-dome-line opacity-45" />
            </div>
            <h1 className="text-glow text-xl font-bold uppercase tracking-wide text-text lg:text-2xl">
              {t("hero.headline")}
            </h1>
          </div>
          <div className="flex flex-1 items-end justify-center pb-10">
            <div className="h-full w-full max-w-3xl px-4 pt-10">
              <DomePlaceholder />
            </div>
          </div>
          <div className="absolute bottom-5 left-5">
            <div className="flex items-center gap-3 px-3 py-2.5 backdrop-blur-sm">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded border border-primary/30 bg-surface-2/60">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[16px] font-bold text-text">
                  {t("hero.badgeTitle")}
                </span>
                <span className="text-[14px] text-text-muted">
                  {t("hero.badgeSubtitle")}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 border-l border-border bg-transparent mt-[120px] lg:w-72">
          <SearchPanel />
        </div>
      </div>
    </section>
  );
};
