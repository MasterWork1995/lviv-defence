"use client";

import { useEffect, useState, FormEvent } from "react";
import { adminFetch } from "@/lib/admin-fetch";

interface SettingsMap {
  total_goal_uah?: string;
  total_area_m2?: string;
  collected_uah?: string;
  donate_preset_amounts_uah?: string;
}

function fmtUah(n: number) {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(n);
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsMap | null>(null);
  const [goal, setGoal] = useState("");
  const [presets, setPresets] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data: SettingsMap) => {
        setSettings(data);
        setGoal(data.total_goal_uah ?? "");
        const raw = data.donate_preset_amounts_uah ?? "[]";
        try {
          setPresets(JSON.parse(raw).join(", "));
        } catch {
          setPresets(raw);
        }
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    const presetsArr = presets
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);

    if (presetsArr.length === 0) {
      setError("Вкажіть хоча б один пресет");
      setSaving(false);
      return;
    }

    const goalNum = parseInt(goal, 10);
    if (!goalNum || goalNum <= 0) {
      setError("Некоректна ціль збору");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        total_goal_uah: String(goalNum),
        donate_preset_amounts_uah: JSON.stringify(presetsArr),
      }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      const data = await res.json();
      setError(data.error ?? "Помилка збереження");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40" style={{ color: "var(--color-text-muted)" }}>
        Завантаження...
      </div>
    );
  }

  const collected = parseInt(settings?.collected_uah ?? "0");
  const goalVal = parseInt(settings?.total_goal_uah ?? "0");
  const percent = goalVal > 0 ? Math.min(100, Math.round((collected / goalVal) * 100 * 10) / 10) : 0;

  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-xl font-bold mb-6 font-display" style={{ color: "var(--color-text)" }}>
        Налаштування
      </h1>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div
          className="rounded-xl p-4 border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="text-xs mb-1.5" style={{ color: "var(--color-text-muted)" }}>Зібрано (кеш)</div>
          <div className="text-lg font-bold" style={{ color: "var(--color-success)" }}>{fmtUah(collected)}</div>
          <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{percent}% від цілі</div>
        </div>
        <div
          className="rounded-xl p-4 border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="text-xs mb-1.5" style={{ color: "var(--color-text-muted)" }}>Площа куполу</div>
          <div className="text-base font-bold" style={{ color: "var(--color-text)" }}>
            {Number(settings?.total_area_m2 ?? 0).toLocaleString("uk-UA")} м²
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>read-only (в коді)</div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border p-6 flex flex-col gap-5"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-dim)" }}>
            Ціль збору (грн)
          </label>
          <input
            type="number"
            min="1"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
            className="admin-input"
            placeholder="1000000000"
          />
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Поточна: {fmtUah(goalVal)}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-dim)" }}>
            Пресети суми донату (через кому, грн)
          </label>
          <input
            type="text"
            value={presets}
            onChange={(e) => setPresets(e.target.value)}
            placeholder="100, 500, 1000, 5000"
            className="admin-input"
          />
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Приклад: 100, 500, 1000, 5000
          </p>
        </div>

        {error && <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>}
        {success && <p className="text-sm" style={{ color: "var(--color-success)" }}>Збережено успішно</p>}

        <button
          type="submit"
          disabled={saving}
          className="py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 transition-opacity hover:opacity-80"
          style={{ background: "var(--color-primary)", color: "var(--color-bg)" }}
        >
          {saving ? "Збереження..." : "Зберегти налаштування"}
        </button>
      </form>
    </div>
  );
}
