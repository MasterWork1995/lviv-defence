"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { ModalWrapper } from "./ModalWrapper";
import { Field } from "./Field";

function fmtUah(n: number) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtM2(m2: number) {
  if (m2 >= 1_000_000) return `${(m2 / 1_000_000).toFixed(4)} км²`;
  if (m2 >= 1_000) return `${(m2 / 1_000).toFixed(2)} тис. м²`;
  return `${m2.toFixed(4)} м²`;
}

export function ManualDonationModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [m2PerUah, setM2PerUah] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nameExists, setNameExists] = useState<{ totalAmount: number } | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (!s) return;
        const goal = parseInt(s.total_goal_uah ?? "0");
        const area = parseFloat(s.total_area_m2 ?? "0");
        if (goal > 0) setM2PerUah(area / goal);
      });
  }, []);

  useEffect(() => {
    setNameExists(null);
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/donations/check-name?name=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists) setNameExists({ totalAmount: data.totalAmount });
        }
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [name]);

  const amountNum = parseFloat(amount) || 0;
  const previewM2 = m2PerUah !== null && amountNum > 0 ? amountNum * m2PerUah : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await adminFetch("/api/admin/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), amount: parseFloat(amount) }),
    });
    if (res.ok) {
      onSaved();
      onClose();
    } else {
      const d = await res.json();
      setError(d.error ?? "Помилка");
    }
    setLoading(false);
  }

  return (
    <ModalWrapper onClose={onClose} title="Додати донат вручну">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Ім'я донора" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="admin-input"
          />
        </Field>

        <Field label="Сума (грн)" required>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="admin-input"
          />
        </Field>

        {previewM2 !== null && (
          <div
            className="flex items-center justify-between rounded-lg px-3 py-2.5"
            style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
          >
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Площа куполу</span>
            <span className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
              {fmtM2(previewM2)}
            </span>
          </div>
        )}

        {nameExists && (
          <p
            className="text-sm rounded-lg px-3 py-2.5 border"
            style={{ background: "#422006", borderColor: "#854d0e", color: "#fde68a" }}
          >
            Донор «{name.trim()}» вже є у базі ({fmtUah(nameExists.totalAmount)}). Сума буде додана до існуючого запису.
          </p>
        )}

        {error && (
          <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>
        )}

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm border"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-dim)" }}
          >
            Скасувати
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
            style={{ background: "var(--color-primary)", color: "var(--color-bg)" }}
          >
            {loading ? "Збереження..." : "Зберегти"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
