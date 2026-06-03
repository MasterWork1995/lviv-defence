"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { adminFetch } from "@/lib/admin-fetch";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyEntry {
  date: string;
  amount: number;
  count: number;
}

interface Coverage {
  coveredM2: number;
  totalM2: number;
  coveragePercent: number;
  collectedUah: number;
  totalGoalUah: number;
  goalPercent: number;
}

interface ChartsData {
  dailyDonations: DailyEntry[];
  coverage: Coverage;
}

// ─── Period config ────────────────────────────────────────────────────────────

type PeriodId = "7" | "14" | "30" | "90" | "custom";

const PERIODS: { id: PeriodId; label: string }[] = [
  { id: "7", label: "Тиждень" },
  { id: "14", label: "2 тижні" },
  { id: "30", label: "Місяць" },
  { id: "90", label: "Квартал" },
  { id: "custom", label: "Свій" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtUah(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₴`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ₴`;
  return `${n} ₴`;
}

function fmtM2(m2: number) {
  if (m2 >= 1_000_000) return `${(m2 / 1_000_000).toFixed(2)} км²`;
  return `${m2.toFixed(1)} м²`;
}

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// ─── Circular progress ────────────────────────────────────────────────────────

function CircularProgress({
  percent,
  label,
  sub,
  color = "var(--color-primary)",
}: {
  percent: number;
  label: string;
  sub: string;
  color?: string;
}) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const filled = circ * Math.min(1, percent / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 128, height: 128 }}>
        <svg width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke="var(--color-surface-3)"
            strokeWidth="10"
          />
          <circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circ}`}
            strokeDashoffset="0"
            style={{
              transition: "stroke-dasharray 0.6s ease",
              filter: `drop-shadow(0 0 6px ${color}80)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-xl font-bold font-display leading-none"
            style={{ color }}
          >
            {percent < 0.01 ? "0" : percent < 1 ? `<1` : percent.toFixed(1)}%
          </span>
        </div>
      </div>
      <p
        className="text-xs font-medium text-center"
        style={{ color: "var(--color-text)" }}
      >
        {label}
      </p>
      <p
        className="text-xs text-center"
        style={{ color: "var(--color-text-muted)" }}
      >
        {sub}
      </p>
    </div>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs border"
      style={{
        background: "var(--color-surface-2)",
        borderColor: "var(--color-border)",
        color: "var(--color-text)",
      }}
    >
      <p className="mb-1 font-medium">{label}</p>
      <p style={{ color: "var(--color-primary)" }}>
        {fmtUah(payload[0]?.value ?? 0)}
      </p>
      {payload[1] && (
        <p style={{ color: "var(--color-text-dim)" }}>
          {payload[1].value} донатів
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminCharts({
  refreshKey = 0,
}: {
  refreshKey?: number;
}) {
  const [period, setPeriod] = useState<PeriodId>("14");
  const [customFrom, setCustomFrom] = useState(
    toIsoDate(
      (() => {
        const d = new Date();
        d.setDate(d.getDate() - 29);
        return d;
      })(),
    ),
  );
  const [customTo, setCustomTo] = useState(toIsoDate(new Date()));
  const [data, setData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let url = "/api/admin/charts";
    if (period === "custom") {
      url += `?from=${customFrom}&to=${customTo}`;
    } else {
      url += `?days=${period}`;
    }
    const res = await adminFetch(url);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [period, customFrom, customTo]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const hasActivity = data?.dailyDonations.some((d) => d.amount > 0);

  return (
    <div className="mb-8">
      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Період:
        </span>
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
            style={{
              background:
                period === p.id
                  ? "var(--color-primary)"
                  : "var(--color-surface)",
              color:
                period === p.id ? "var(--color-bg)" : "var(--color-text-dim)",
              border: `1px solid ${period === p.id ? "transparent" : "var(--color-border)"}`,
            }}
          >
            {p.label}
          </button>
        ))}

        {period === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              max={customTo}
              className="rounded-lg px-2 py-1 text-xs border outline-none"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
            />
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              —
            </span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              min={customFrom}
              max={toIsoDate(new Date())}
              className="rounded-lg px-2 py-1 text-xs border outline-none"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
            />
          </div>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Area chart — 3/4 width */}
        <div
          className="lg:col-span-3 rounded-xl border p-5 flex flex-col"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
            minHeight: 340,
          }}
        >
          <p
            className="text-xs font-medium mb-4 uppercase tracking-wide"
            style={{ color: "var(--color-text-muted)" }}
          >
            Донати за період
          </p>

          {!data ? (
            <div
              className="flex flex-1 items-center justify-center"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span className="text-sm">Завантаження...</span>
            </div>
          ) : !hasActivity ? (
            <div
              className="flex flex-1 items-center justify-center text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Немає донатів за цей період
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={370}
              style={{
                opacity: loading ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <AreaChart
                data={data!.dailyDonations}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.22}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={fmtUah}
                  tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={58}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  name="amount"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "var(--color-primary)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Coverage circles — 1/4 width */}
        <div
          className="rounded-xl border p-5 flex flex-col justify-center gap-6"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <p
            className="text-xs font-medium uppercase tracking-wide text-center"
            style={{ color: "var(--color-text-muted)" }}
          >
            Покриття куполу
          </p>

          {!data ? (
            <div className="flex justify-center gap-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="w-28 h-28 rounded-full"
                  style={{ background: "var(--color-surface-2)" }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <CircularProgress
                percent={data.coverage.goalPercent}
                label="Зібрано коштів"
                sub={`${fmtUah(data.coverage.collectedUah)} з ${fmtUah(data.coverage.totalGoalUah)}`}
                color="var(--color-primary)"
              />
              <CircularProgress
                percent={data.coverage.coveragePercent}
                label="Площа покрита"
                sub={`${fmtM2(data.coverage.coveredM2)} з ${fmtM2(data.coverage.totalM2)}`}
                color="var(--color-accent-hover)"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
