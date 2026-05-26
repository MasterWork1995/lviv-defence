"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS: number[] = [100, 500, 1000, 5000];
const M2_PER_UAH = 21_833_000_000 / 1_000_000_000;

function formatArea(m2: number): string {
  if (m2 === 0) return "";
  if (m2 < 1_000_000) return `${m2.toFixed(0)} м²`;
  return `${(m2 / 1_000_000).toFixed(2)} км²`;
}

export function DonateModal({ isOpen, onClose }: DonateModalProps) {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [preset, setPreset] = useState<number | null>(null);
  const [customStr, setCustomStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Активна сума завжди ціле число гривень
  const activeUah: number = preset ?? (customStr ? parseInt(customStr, 10) : 0);
  const areaPreview = activeUah > 0 ? formatArea(activeUah * M2_PER_UAH) : "";

  function handleCustomChange(val: string) {
    // Дозволяємо лише цифри
    const digits = val.replace(/\D/g, "");
    setCustomStr(digits);
    setPreset(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(t("donateModal.errorName"));
      return;
    }
    if (!activeUah || activeUah < 1) {
      setError(t("donateModal.errorMinAmount"));
      return;
    }

    setLoading(true);
    try {
      let res: Response;
      try {
        res = await fetch("/api/donate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), amountUah: activeUah }),
        });
      } catch {
        setError(t("errors.network"));
        return;
      }

      const data = await res.json() as {
        invoiceUrl?: string;
        error?: string;
        code?: string;
        retryAfterSeconds?: number;
      };

      if (!res.ok) {
        if (res.status === 429) {
          const minutes = data.retryAfterSeconds
            ? Math.ceil(data.retryAfterSeconds / 60)
            : 10;
          setError(t("errors.tooManyRequests", { minutes }));
        } else if (res.status === 422) {
          setError(t("errors.validation"));
        } else if (res.status >= 500) {
          setError(t("errors.server"));
        } else {
          setError(t("common.error"));
        }
        return;
      }

      window.location.href = data.invoiceUrl!;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded border border-border bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-muted transition-colors hover:text-text"
          aria-label={t("common.close")}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-primary">
          {t("donateModal.title")}
        </p>
        <h2 className="mb-1 font-display text-xl font-bold uppercase tracking-wide text-text">
          {t("hero.headline")}
        </h2>
        <p className="mb-5 text-xs text-text-muted">{t("donateModal.subtitle")}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Ім'я */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {t("donateModal.nameLabel")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("donateModal.namePlaceholder")}
              className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none placeholder:text-text-muted focus:border-primary/50"
            />
          </div>

          {/* Пресети */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {t("donateModal.tiersTitle")}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => { setPreset(amt); setCustomStr(""); }}
                  className={`rounded border py-2 text-xs font-bold transition-all ${
                    preset === amt
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-text-muted hover:border-primary/40 hover:text-text"
                  }`}
                >
                  {amt.toLocaleString("uk-UA")} ₴
                </button>
              ))}
            </div>
          </div>

          {/* Довільна сума */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {t("donateModal.customLabel")}
            </label>
            <div className="flex items-center gap-2 rounded border border-border bg-surface-2 px-3 py-2 focus-within:border-primary/50">
              <input
                type="text"
                inputMode="numeric"
                value={customStr}
                onChange={(e) => handleCustomChange(e.target.value)}
                placeholder={t("donateModal.customPlaceholder")}
                className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
              />
              <span className="flex-shrink-0 text-xs font-semibold text-text-muted">₴</span>
            </div>
          </div>

          {/* Прев'ю площі */}
          {areaPreview && (
            <div className="rounded border border-primary/20 bg-primary/5 px-3 py-2 text-center">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">
                {t("donateModal.areaLabel", { area: areaPreview })}
              </p>
              <p className="mt-0.5 text-lg font-bold text-primary">
                {activeUah.toLocaleString("uk-UA")} ₴
              </p>
            </div>
          )}

          {error && (
            <p className="text-center text-[11px] text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="glow-primary mt-1 w-full rounded border border-primary bg-primary/15 py-3 text-xs font-bold uppercase tracking-wider text-primary transition-all duration-200 hover:bg-primary hover:text-bg disabled:opacity-50"
          >
            {loading ? t("donateModal.submitting") : t("donateModal.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
