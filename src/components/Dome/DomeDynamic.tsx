"use client";

import dynamic from "next/dynamic";

function DomeLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative flex h-32 w-32 items-center justify-center">
        {/* Radar-ping rings staggered */}
        {([96, 64, 36] as const).map((d, i) => (
          <span
            key={d}
            className="absolute animate-ping rounded-full border border-primary/50"
            style={{
              width: d,
              height: d,
              animationDelay: `${i * 0.35}s`,
              animationDuration: "1.8s",
            }}
          />
        ))}
        {/* Glowing centre dot */}
        <span
          className="relative h-3 w-3 rounded-full bg-primary"
          style={{
            boxShadow:
              "0 0 16px var(--color-primary), 0 0 40px var(--color-gold-50)",
          }}
        />
      </div>
    </div>
  );
}

export const DomeCanvas = dynamic(() => import("./DomeCanvas"), {
  ssr: false,
  loading: DomeLoader,
});
