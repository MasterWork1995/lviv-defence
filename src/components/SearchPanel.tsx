"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { DonateModal } from "@/components/DonateModal";

const SKELETON_WIDTHS = ["60%", "45%", "72%", "38%", "55%", "68%", "42%"];

function DonorListSkeleton() {
  return (
    <div className="space-y-0.5" aria-hidden="true">
      {SKELETON_WIDTHS.map((w, i) => (
        <div key={i} className="rounded border border-transparent px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div
              className="h-2.5 animate-pulse rounded bg-surface-2"
              style={{ width: w }}
            />
            <div className="h-2.5 w-12 animate-pulse rounded bg-surface-2" />
          </div>
          {i % 3 === 0 && (
            <div className="mt-1.5 h-2 w-14 animate-pulse rounded bg-surface-2 opacity-60" />
          )}
        </div>
      ))}
    </div>
  );
}

interface Donor {
  id: string;
  name: string;
  squareM2: number;
  sector: number | null;
}

export function SearchPanel() {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selected, setSelected] = useState<Donor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  // Debounced fetch при зміні query або retry
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setFetchError(false);
      try {
        const url = query.trim().length > 1
          ? `/api/donations?q=${encodeURIComponent(query.trim())}`
          : "/api/donations";
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { donations: Donor[] };
        setDonors(data.donations ?? []);
      } catch {
        setFetchError(true);
        setDonors([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, retryCount]);

  // Polling кожні 30 секунд — завжди використовує актуальний query через ref
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const q = queryRef.current.trim();
        const url = q.length > 1
          ? `/api/donations?q=${encodeURIComponent(q)}`
          : "/api/donations";
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json() as { donations: Donor[] };
        setDonors(data.donations ?? []);
        setFetchError(false);
      } catch {
        // Мовчки — не скидаємо список при тимчасовій помилці мережі
      }
    }, 30_000);

    return () => clearInterval(id);
  }, []);

  const toggle = (donor: Donor) =>
    setSelected((prev) => (prev?.id === donor.id ? null : donor));

  const formatArea = (m2: number) => {
    const km2 = m2 / 1_000_000;
    return km2 >= 0.01
      ? `${km2.toFixed(2)} км²`
      : `${m2.toFixed(2)} м²`;
  };

  return (
    <>
      <DonateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="flex min-h-0 flex-1 flex-col gap-3 bg-transparent p-4">
        <div>
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-text-dim">
            {t("search.placeholder")}
          </p>
          <label htmlFor="donor-search" className="sr-only">{t("search.hint")}</label>
          <div className="flex items-center gap-2 rounded border border-border bg-surface-2 px-3 py-2 transition-colors focus-within:border-primary/50">
            <svg className="h-3 w-3 flex-shrink-0 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="donor-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs text-text outline-none placeholder:text-text-muted"
              placeholder={t("search.hint")}
            />
            {query && (
              <button onClick={() => setQuery("")} className="cursor-pointer text-text-muted transition-colors hover:text-text" aria-label={t("common.close")}>
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results list */}
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {loading ? (
            <DonorListSkeleton />
          ) : fetchError ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <p className="text-center text-xs text-red-400">{t("errors.loadFailed")}</p>
              <button
                onClick={() => setRetryCount((c) => c + 1)}
                className="text-[10px] uppercase tracking-wider text-text-muted underline hover:text-primary"
              >
                {t("errors.retry")}
              </button>
            </div>
          ) : donors.length === 0 ? (
            <p className="py-6 text-center text-xs text-text-muted">{t("search.notFound")}</p>
          ) : (
            donors.map((donor) => (
              <button
                key={donor.id}
                onClick={() => toggle(donor)}
                className={`w-full cursor-pointer rounded border px-3 py-2 text-left transition-all duration-150 ${
                  selected?.id === donor.id
                    ? "border-primary/40 bg-primary/10"
                    : "border-transparent hover:border-border hover:bg-surface-2"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-medium text-text">{donor.name}</span>
                  <span className="flex-shrink-0 text-[10px] font-bold text-primary">
                    {formatArea(donor.squareM2)}
                  </span>
                </div>
                {donor.sector !== null && (
                  <p className="mt-0.5 text-[9px] uppercase tracking-wider text-text-muted">
                    Сектор&nbsp;{donor.sector}
                  </p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Selected donor card */}
        {selected && (
          <div className="rounded border border-dome-select/25 bg-surface-2 p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-text">{selected.name}</p>
                {selected.sector !== null && (
                  <p className="text-[9px] uppercase tracking-wider text-text-muted">
                    Сектор&nbsp;{selected.sector}
                  </p>
                )}
              </div>
              <span className="flex-shrink-0 rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                {formatArea(selected.squareM2)}
              </span>
            </div>
            <div className="mb-2 h-px bg-border" />
            <div className="flex gap-1.5">
              <button className="cursor-pointer flex-1 rounded border border-border px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-text-dim transition-all duration-150 hover:border-primary/40 hover:text-primary">
                {t("donationCard.downloadStories")}
              </button>
              <button className="cursor-pointer flex-1 rounded border border-border px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-text-dim transition-all duration-150 hover:border-primary/40 hover:text-primary">
                {t("donationCard.downloadCert")}
              </button>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="glow-primary w-full cursor-pointer rounded border border-primary bg-primary/15 py-3 text-xs font-bold uppercase tracking-wider text-primary transition-all duration-200 hover:bg-primary hover:text-bg focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {t("common.donate")}
        </button>

        <p className="text-center text-[9px] text-text-muted">
          {t("search.notFound")}&nbsp;
          <button className="cursor-pointer text-text-dim transition-colors hover:text-primary">
            {t("search.contactCta")}
          </button>
        </p>
      </div>
    </>
  );
}
