"use client";

import { useEffect, useState } from "react";
import type { AppSettings } from "@/lib/settings";
import { fetchSettings } from "@/lib/client-settings-cache";

export const useDonateSettings = (isOpen: boolean) => {
  const [settings, setSettings] = useState<Pick<
    AppSettings,
    "m2PerUah" | "presetAmountsUah"
  > | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const json = await fetchSettings();
        if (!cancelled && json) {
          setSettings({
            m2PerUah: json.m2PerUah,
            presetAmountsUah: json.presetAmountsUah,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  return {
    m2PerUah: settings?.m2PerUah ?? 0,
    presetAmountsUah: settings?.presetAmountsUah ?? [],
    loading,
    ready: settings !== null,
  };
};
