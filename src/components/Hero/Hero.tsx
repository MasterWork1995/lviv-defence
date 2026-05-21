import Image from "next/image";
import { useTranslations } from "next-intl";
import { DomePlaceholder } from "@/components/DomePlaceholder";

export const Hero = () => {
  const t = useTranslations();

  return (
    <div className="relative flex-1 overflow-hidden">
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
      <div className="absolute left-0 right-0 top-0 z-10 px-5 pt-[140px] lg:px-8">
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
      <div className="absolute inset-0 flex items-end justify-center pb-10">
        <div className="h-full w-full max-w-3xl px-4 pt-20">
          <DomePlaceholder />
        </div>
      </div>
      <div className="absolute bottom-3 left-5 z-10">
        <p className="text-[9px] text-text-muted">
          {t("footer.rights", { year: 2025 })}
          <span className="mx-1.5 opacity-40">·</span>
          <button className="cursor-pointer opacity-60 transition-opacity hover:opacity-100 hover:text-text-dim">
            {t("footer.privacy")}
          </button>
        </p>
      </div>
    </div>
  );
};
