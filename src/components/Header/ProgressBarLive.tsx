"use client";

import { useEffect, useRef, useState } from "react";
import { ProgressBar } from "./ProgressBar";

interface ProgressData {
  percent: number;
  area: number;
  total: number;
}

const POLL_INTERVAL = 30_000;

export function ProgressBarLive({ initial }: { initial: ProgressData }) {
  const [data, setData] = useState<ProgressData>(initial);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const json = await res.json() as {
          progressPercent: number;
          collectedAreaM2: number;
          totalAreaM2: number;
        };
        setData({
          percent: json.progressPercent,
          area: Math.round(json.collectedAreaM2 / 1_000_000),
          total: Math.round(json.totalAreaM2 / 1_000_000),
        });
      } catch {
        // Мовчки — не скидаємо поточне значення при помилці мережі
      }
    };

    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return <ProgressBar percent={data.percent} area={data.area} total={data.total} />;
}
