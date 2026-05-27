"use client";

import { useEffect, useState } from "react";
import type { DomeViewport } from "./hexUtils";

const resolveViewport = (width: number): DomeViewport => {
  if (width < 640) return "mobile";
  if (width < 1280) return "tablet";
  return "desktop";
};

export const useDomeViewport = (): DomeViewport => {
  const [viewport, setViewport] = useState<DomeViewport>(() =>
    typeof window === "undefined"
      ? "desktop"
      : resolveViewport(window.innerWidth),
  );

  useEffect(() => {
    const update = () => setViewport(resolveViewport(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return viewport;
};
