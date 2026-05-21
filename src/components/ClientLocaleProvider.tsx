"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";

type Locale = "uk" | "en";
type Messages = Record<string, unknown>;

interface LocaleSwitchCtx {
  locale: Locale;
  switchLocale: (l: Locale) => void;
}

const LocaleSwitchContext = createContext<LocaleSwitchCtx>({
  locale: "uk",
  switchLocale: () => {},
});

export const useLocaleSwitch = () => useContext(LocaleSwitchContext);

export function ClientLocaleProvider({
  initialLocale,
  allMessages,
  children,
}: {
  initialLocale: Locale;
  allMessages: Record<Locale, Messages>;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // On mount, apply the user's saved preference instantly
  useEffect(() => {
    const saved = localStorage.getItem("preferredLocale") as Locale | null;
    if ((saved === "uk" || saved === "en") && saved !== locale) {
      setLocaleState(saved);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const switchLocale = (l: Locale) => {
    localStorage.setItem("preferredLocale", l);
    setLocaleState(l);
  };

  return (
    <LocaleSwitchContext.Provider value={{ locale, switchLocale }}>
      <NextIntlClientProvider locale={locale} messages={allMessages[locale]}>
        {children}
      </NextIntlClientProvider>
    </LocaleSwitchContext.Provider>
  );
}
