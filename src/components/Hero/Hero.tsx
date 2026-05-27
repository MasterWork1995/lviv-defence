import Image from "next/image";
import { useTranslations } from "next-intl";
import { DomeCanvas } from "@/components/Dome/DomeDynamic";
import { SearchPanel } from "@/components/SearchPanel";

const VIGNETTE =
  "linear-gradient(to bottom, rgba(4,9,26,0.92) 0%, rgba(4,9,26,0.55) 28%, rgba(4,9,26,0.72) 65%, rgba(4,9,26,0.95) 100%)";
const RADIAL =
  "radial-gradient(ellipse 70% 55% at 38% 60%, rgba(0,200,240,0.15) 0%, transparent 70%)";

export const Hero = () => {
  const t = useTranslations();

  return (
    // h-full fills the CSS grid's 1fr row — no hardcoded pixel offsets
    <section className="relative h-full overflow-hidden">
      <div className="absolute inset-0 flex flex-col xl:hidden">
        <div className="relative z-0 shrink-0 basis-[clamp(200px,36vh,340px)] overflow-hidden md:basis-[50vh] md:min-h-[50vh] md:max-h-[62vh] lg:basis-[52vh] lg:min-h-[50vh] lg:max-h-[60vh]">
          <div className="absolute inset-0 overflow-hidden">
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
          </div>
          <div className="absolute inset-0 z-[1] flex items-center justify-center overflow-hidden">
            <div className="h-[92%] w-full max-w-[min(100%,720px)] md:h-[96%]">
              <DomeCanvas />
            </div>
          </div>
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col border-t border-primary/10 bg-bg shadow-[0_-12px_40px_rgba(4,9,26,0.85)]">
          <SearchPanel />
        </div>
      </div>

      <div className="absolute inset-0 hidden xl:flex">
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

        {/* Right: search panel — wider for the new card-based layout */}
        <div className="relative z-10 flex w-[400px] flex-shrink-0 flex-col border-l border-primary/15 bg-bg/55 backdrop-blur-xl">
          {/* Top cyan accent line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
          <SearchPanel />
        </div>
      </div>
    </section>
  );
};
