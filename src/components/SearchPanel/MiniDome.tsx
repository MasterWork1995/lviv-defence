import { useTranslations } from "next-intl";

type MiniDomeProps = {
  sector: number | null;
};

const CELLS = [
  { x: 50, y: 14 },
  { x: 30, y: 26 },
  { x: 70, y: 26 },
  { x: 14, y: 40 },
  { x: 50, y: 38 },
  { x: 86, y: 40 },
  { x: 28, y: 52 },
  { x: 72, y: 52 },
];

const HEX = 8;

export const MiniDome = ({ sector }: MiniDomeProps) => {
  const t = useTranslations("search");
  const hi =
    sector !== null
      ? ((sector % CELLS.length) + CELLS.length) % CELLS.length
      : -1;

  return (
    <div className="relative aspect-square w-[88px] flex-shrink-0">
      <svg viewBox="0 0 100 70" className="h-full w-full" aria-hidden="true">
        <path
          d="M 6 62 A 44 44 0 0 1 94 62"
          fill="none"
          stroke="var(--color-accent-hover)"
          strokeWidth="0.7"
        />
        <path
          d="M 22 62 A 28 28 0 0 1 78 62"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="0.5"
        />
        <line
          x1="2"
          y1="62"
          x2="98"
          y2="62"
          stroke="var(--color-accent-hover)"
          strokeWidth="0.6"
        />
        {CELLS.map((c, i) => {
          const pts = Array.from({ length: 6 }, (_, j) => {
            const a = ((j * 60 + 30) * Math.PI) / 180;
            return `${(c.x + HEX * Math.cos(a)).toFixed(1)},${(c.y + HEX * Math.sin(a)).toFixed(1)}`;
          }).join(" ");
          const isHi = i === hi;
          return (
            <polygon
              key={i}
              points={pts}
              fill={isHi ? "var(--color-gold-35)" : "var(--color-excadra-55)"}
              stroke={isHi ? "var(--color-gold)" : "var(--color-accent-dim)"}
              strokeWidth={isHi ? 1.4 : 0.7}
              style={
                isHi
                  ? { filter: "drop-shadow(0 0 4px var(--color-gold))" }
                  : undefined
              }
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 font-mono text-[7px] text-text-muted/70">
        <span className="absolute left-1/2 top-0 -translate-x-1/2">
          {t("compassNorth")}
        </span>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2">
          {t("compassSouth")}
        </span>
        <span className="absolute left-0 top-1/2 -translate-y-1/2">
          {t("compassWest")}
        </span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2">
          {t("compassEast")}
        </span>
      </div>
    </div>
  );
};
