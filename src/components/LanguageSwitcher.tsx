"use client";

import { useLocaleSwitch } from "@/components/ClientLocaleProvider";

const LANGS = [
  { code: "uk", label: "UA" },
  { code: "en", label: "EN" },
] as const;

export function LanguageSwitcher() {
  const { locale, switchLocale } = useLocaleSwitch();

  return (
    <div className="flex items-center gap-2">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => switchLocale(code)}
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
