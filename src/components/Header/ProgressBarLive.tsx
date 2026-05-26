"use client";

import { useEffect, useState } from "react";
import { ProgressBar } from "./ProgressBar";
import { fetchSettings } from "@/lib/client-settings-cache";

interface ProgressData {
  percent: number;
  area: number;
  total: number;
}

const POLL_INTERVAL = 30_000;

function toProgressData(json: {
  progressPercent: number;
  collectedAreaM2: number;
  totalAreaM2: number;
}): ProgressData {
  return {
    percent: json.progressPercent,
    area: Math.round(json.collectedAreaM2 / 1_000_000),
    total: Math.round(json.totalAreaM2 / 1_000_000),
  };
}

export function ProgressBarLive({ initial }: { initial: ProgressData }) {
  const [data, setData] = useState<ProgressData>(initial);

  useEffect(() => {
    const poll = async () => {
      const json = await fetchSettings({ force: true });
      if (json) setData(toProgressData(json));
    };

    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return <ProgressBar percent={data.percent} area={data.area} total={data.total} />;
}
