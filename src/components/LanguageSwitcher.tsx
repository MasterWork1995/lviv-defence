"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

const LANGS = [
  { code: "uk", label: "UA" },
  { code: "en", label: "EN" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchTo = (code: "uk" | "en") => {
    if (code === locale) return;
    localStorage.setItem("preferredLocale", code);
    router.replace(pathname, { locale: code });
  };

  return (
    <div className="flex items-center gap-2">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => switchTo(code)}
          className={`cursor-pointer rounded border px-3 py-1 text-[15px] font-semibold uppercase tracking-wider transition-all duration-150 ${
            locale === code
              ? "border-primary bg-primary/20 text-primary"
              : "border-border text-text-dim hover:border-primary/40 hover:text-text"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
