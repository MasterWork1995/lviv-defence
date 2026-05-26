import Image from "next/image";
import { useTranslations } from "next-intl";
import { DomeCanvas } from "@/components/Dome/DomeDynamic";
import { SearchPanel } from "@/components/SearchPanel";

const VIGNETTE =
  "linear-gradient(to bottom, rgba(4,9,26,0.75) 0%, rgba(4,9,26,0.22) 38%, rgba(4,9,26,0.48) 68%, rgba(4,9,26,0.92) 100%)";
const RADIAL =
  "radial-gradient(ellipse 75% 60% at 38% 65%, rgba(26,101,192,0.20) 0%, transparent 70%)";

export const Hero = () => {
  const t = useTranslations();

  return (
    // h-full fills the CSS grid's 1fr row — no hardcoded pixel offsets
    <section className="relative h-full overflow-hidden">
      {/* ══════════════════════════════════════
          MOBILE  (flex-col, stacked)
          ══════════════════════════════════════ */}
      <div className="absolute inset-0 flex flex-col lg:hidden">
        {/* Dome strip — background photo only here */}
        <div className="relative overflow-hidden" style={{ flex: "0 0 42%" }}>
          <Image
            src="/Lviv.jpeg"
            alt="Нічний Львів"
            fill
            priority
            className="object-cover object-center"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: VIGNETTE }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: RADIAL }}
          />
          <DomeCanvas />
        </div>

        {/* Search panel — solid dark, no photo bleed */}
        <div className="flex min-h-0 flex-1 flex-col bg-bg">
          <SearchPanel />
        </div>
      </div>

      {/* ══════════════════════════════════════
          DESKTOP  (flex-row, side-by-side)
          ══════════════════════════════════════ */}
      <div className="absolute inset-0 hidden lg:flex">
        {/* Full-section background */}
        <Image
          src="/Lviv.jpeg"
          alt="Нічний Львів"
          fill
          priority
          className="object-cover object-center"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: VIGNETTE }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: RADIAL }}
        />

        {/* Left: dome fills the panel */}
        <div className="relative flex-1">
          <div className="absolute inset-0">
            <DomeCanvas />
          </div>

          {/* Bottom-left badge */}
          <div className="absolute bottom-5 left-5 z-10">
            <div className="flex items-center gap-3 rounded border border-border/40 bg-surface/50 px-3 py-2.5 backdrop-blur-sm">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded border border-primary/30 bg-surface-2/70">
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
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[13px] font-bold text-text">
                  {t("hero.badgeTitle")}
                </span>
                <span className="text-[11px] text-text-muted">
                  {t("hero.badgeSubtitle")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: search panel — no mt offset, header is now in grid flow */}
        <div className="relative z-10 flex w-[320px] flex-shrink-0 flex-col border-l border-border/60 bg-surface/75 backdrop-blur-xl">
          {/* Top cyan accent line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
          <SearchPanel />
        </div>
      </div>
    </section>
  );
};
