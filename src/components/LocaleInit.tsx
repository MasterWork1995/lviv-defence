"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

export function LocaleInit() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("preferredLocale") as "uk" | "en" | null;
    if (saved && saved !== locale && (saved === "uk" || saved === "en")) {
      router.replace(pathname, { locale: saved });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
