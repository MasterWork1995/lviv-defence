"use client";

import { useEffect, useState } from "react";
import { fetchSettings } from "@/lib/client-settings-cache";
import type { PanelStats } from "../types";

export const usePanelStats = () => {
  const [stats, setStats] = useState<PanelStats>({
    totalKm2: 50,
    collectedKm2: 0,
  });

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        if (!s) return;
        setStats({
          totalKm2: Math.round(s.totalAreaM2 / 1_000_000),
          collectedKm2: +(s.collectedAreaM2 / 1_000_000).toFixed(1),
        });
      })
      .catch(() => {});
  }, []);

  return stats;
};
