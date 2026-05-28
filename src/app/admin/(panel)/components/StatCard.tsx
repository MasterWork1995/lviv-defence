"use client";

import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <div
      className="rounded-xl p-5 border flex gap-4 items-start"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div
        className="rounded-lg p-2.5"
        style={{ background: accent ? `${accent}20` : "var(--color-surface-2)" }}
      >
        <Icon size={20} style={{ color: accent ?? "var(--color-text-dim)" }} />
      </div>
      <div>
        <div className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</div>
        <div className="text-xl font-bold" style={{ color: "var(--color-text)" }}>{value}</div>
        {sub && (
          <div className="text-xs mt-0.5" style={{ color: "var(--color-text-dim)" }}>{sub}</div>
        )}
      </div>
    </div>
  );
}
