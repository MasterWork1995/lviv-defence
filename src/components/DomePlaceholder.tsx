export function DomePlaceholder() {
  const cx = 300;
  const baseY = 345;
  const apexY = 90;
  const baseRX = 265;
  const baseRY = 27;

  const rings = [0.2, 0.38, 0.55, 0.7, 0.83, 0.93].map((t) => ({
    y: baseY - t * (baseY - apexY),
    rx: baseRX * Math.sqrt(1 - t * t),
    ry: baseRY * Math.sqrt(1 - t * t),
    opacity: 0.18 + t * 0.48,
  }));

  const spokes = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * 2 * Math.PI;
    return {
      x1: cx + baseRX * Math.cos(a),
      y1: baseY + baseRY * Math.sin(a),
    };
  });

  return (
    <svg
      viewBox="0 0 600 380"
      className="h-full w-full"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="domeAtmo" cx="50%" cy="45%" r="52%">
          <stop offset="0%" stopColor="#1a65c0" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#1a65c0" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#1a65c0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="domeApexGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00c8f0" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#00c8f0" stopOpacity="0" />
        </radialGradient>
        <filter id="domeGlowFx" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="baseFx" x="-5%" y="-50%" width="110%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="groundFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#04091a" stopOpacity="0" />
          <stop offset="100%" stopColor="#04091a" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* Atmospheric fill */}
      <ellipse
        cx={cx}
        cy={(baseY + apexY) / 2}
        rx={baseRX * 1.08}
        ry={(baseY - apexY) / 2 + 18}
        fill="url(#domeAtmo)"
      />

      {/* Spokes */}
      {spokes.map((s, i) => (
        <line
          key={i}
          x1={s.x1}
          y1={s.y1}
          x2={cx}
          y2={apexY}
          stroke="#1a65c0"
          strokeWidth="0.55"
          strokeOpacity="0.32"
        />
      ))}

      {/* Horizontal rings */}
      {rings.map((r, i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={r.y}
          rx={r.rx}
          ry={r.ry}
          fill="none"
          stroke="#38b0f0"
          strokeWidth="0.75"
          strokeOpacity={r.opacity}
        />
      ))}

      {/* Base ring */}
      <ellipse
        cx={cx}
        cy={baseY}
        rx={baseRX}
        ry={baseRY}
        fill="none"
        stroke="#1a65c0"
        strokeWidth="1.4"
        strokeOpacity="0.8"
        filter="url(#baseFx)"
      />

      {/* Apex glow halo */}
      <circle cx={cx} cy={apexY} r="26" fill="url(#domeApexGrad)" />

      {/* Apex dot */}
      <circle
        cx={cx}
        cy={apexY}
        r="3"
        fill="#00c8f0"
        fillOpacity="0.95"
        filter="url(#domeGlowFx)"
      />

      {/* Ground gradient fade */}
      <rect x="0" y={baseY - 4} width="600" height="40" fill="url(#groundFade)" />
    </svg>
  );
}
