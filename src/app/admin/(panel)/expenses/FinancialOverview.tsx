"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";

function fmtUah(n: number) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(n);
}

const tooltipStyle = {
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--color-text)",
};

const C_RAISED = "#00c8f0";
const C_SPENT = "#ef4444";

export function FinancialOverview({
  totalRaised,
  totalSpentUah,
  balance,
}: {
  totalRaised: number;
  totalSpentUah: number;
  balance: number;
}) {
  const C_BALANCE = balance >= 0 ? "#22c55e" : "#ef4444";

  const barData = [
    { name: "Зібрано",   value: totalRaised,          fill: C_RAISED },
    { name: "Витрачено", value: totalSpentUah,         fill: C_SPENT },
    { name: "Залишок",   value: Math.max(0, balance),  fill: C_BALANCE },
  ];
  const pieData = [
    { name: "Витрачено", value: totalSpentUah,         fill: C_SPENT },
    { name: "Залишок",   value: Math.max(0, balance),  fill: C_BALANCE },
  ];

  return (
    <div className="mb-6">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: "Зібрано",   value: totalRaised,   color: C_RAISED },
          { label: "Витрачено", value: totalSpentUah, color: C_SPENT },
          { label: "Залишок",   value: balance,       color: C_BALANCE },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border p-4 text-center"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
            <p className="text-base font-bold" style={{ color }}>{fmtUah(value)}</p>
          </div>
        ))}
      </div>

      {/* Chart containers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="rounded-xl border p-5"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <p className="text-xs font-medium uppercase tracking-wide mb-4" style={{ color: "var(--color-text-muted)" }}>
            Порівняння
          </p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#4a6d8c" }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) =>
                    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` :
                    v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)
                  }
                  tick={{ fontSize: 10, fill: "#4a6d8c" }} axisLine={false} tickLine={false} width={52}
                />
                <Tooltip
                  cursor={false}
                  formatter={(v) => [fmtUah(Number(v ?? 0)), ""]}
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "var(--color-text)" }}
                  itemStyle={{ color: "var(--color-text-muted)" }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="rounded-xl border p-5"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <p className="text-xs font-medium uppercase tracking-wide mb-4" style={{ color: "var(--color-text-muted)" }}>
            Розподіл бюджету
          </p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="45%"
                  innerRadius={52} outerRadius={76}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip
                  formatter={(v) => [fmtUah(Number(v ?? 0)), ""]}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "var(--color-text-muted)" }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
