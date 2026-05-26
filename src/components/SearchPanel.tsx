"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { DonateModal } from "@/components/DonateModal";
import { fetchSettings } from "@/lib/client-settings-cache";

interface Donor {
  id: string;
  name: string;
  squareM2: number;
  sector: number | null;
  amount?: number;
}

/* ─────────────────────────────────────────
   Mini dome SVG — shown in "Обраний сегмент"
   ───────────────────────────────────────── */
function MiniDomeSVG({ sector }: { sector: number | null }) {
  const cells = [
    { x: 40, y: 13 },
    { x: 24, y: 25 }, { x: 56, y: 25 },
    { x: 10, y: 38 }, { x: 40, y: 36 }, { x: 70, y: 38 },
    { x: 23, y: 49 }, { x: 57, y: 49 },
  ];
  const hi = sector !== null ? ((sector % cells.length) + cells.length) % cells.length : -1;
  const HEX = 7;

  return (
    <svg viewBox="0 0 80 58" className="h-[52px] w-[76px] flex-shrink-0" aria-hidden="true">
      <path d="M 4 54 A 36 36 0 0 1 76 54" fill="none" stroke="#1a3a6e" strokeWidth="1.5" opacity="0.7" />
      {cells.map((c, i) => {
        const pts = Array.from({ length: 6 }, (_, j) => {
          const a = ((j * 60 + 30) * Math.PI) / 180;
          return `${(c.x + HEX * Math.cos(a)).toFixed(1)},${(c.y + HEX * Math.sin(a)).toFixed(1)}`;
        }).join(" ");
        const isHi = i === hi;
        return (
          <polygon
            key={i}
            points={pts}
            fill={isHi ? "rgba(0,212,255,0.28)" : "rgba(4,9,26,0.55)"}
            stroke={isHi ? "#00d4ff" : "#1a3060"}
            strokeWidth={isHi ? 1.5 : 0.8}
          />
        );
      })}
      <line x1="4" y1="54" x2="76" y2="54" stroke="#1a65c0" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

/* ─────────────────────────────────────────
   Donor icons
   ───────────────────────────────────────── */
function PersonIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "text-primary" : "text-text-muted"}`} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
    </svg>
  );
}

function BuildingIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "text-gold" : "text-text-muted"}`} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function HexOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 flex-shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinejoin="round" d="M12 2.5l8 4.62v9.25L12 21.5l-8-5.13V7.12z" />
    </svg>
  );
}

function ShieldSmIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0 text-primary" fill="currentColor" aria-hidden="true">
      <path d="M12 2L4 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" />
    </svg>
  );
}

/* ─────────────────────────────────────────
   Skeleton
   ───────────────────────────────────────── */
function DonorSkeleton() {
  return (
    <div className="space-y-0.5 px-1" aria-hidden="true">
      {[62, 48, 75, 40, 58].map((w, i) => (
        <div key={i} className="flex items-center gap-3 rounded px-2 py-2.5">
          <div className="h-[18px] w-[18px] animate-pulse rounded-full bg-surface-2 flex-shrink-0" />
          <div className="h-2.5 animate-pulse rounded bg-surface-2" style={{ width: `${w}%` }} />
          <div className="ml-auto h-2.5 w-10 animate-pulse rounded bg-surface-2 flex-shrink-0" />
          <div className="h-3 w-3 animate-pulse rounded bg-surface-2 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Helpers
   ───────────────────────────────────────── */
function fmtArea(m2: number): string {
  if (m2 <= 0) return "";
  if (m2 < 100_000) return new Intl.NumberFormat("uk-UA").format(Math.round(m2)) + " м²";
  const km2 = m2 / 1_000_000;
  return (km2 >= 1 ? km2.toFixed(2) : km2.toFixed(3)) + " км²";
}

function isCompany(d: Donor) {
  return (d.amount !== undefined && d.amount >= 10_000) ||
    /ТОВ|ФОП|ПАТ|ПрАТ|ГО |МО |LLC|Ltd|&|corp/i.test(d.name);
}

/* ═══════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════ */
export function SearchPanel() {
  const t = useTranslations();
  const [query, setQuery]             = useState("");
  const [donors, setDonors]           = useState<Donor[]>([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState(false);
  const [selected, setSelected]       = useState<Donor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [retryCount, setRetryCount]   = useState(0);
  const [totalKm2, setTotalKm2]       = useState(50);
  const [collectedKm2, setCollectedKm2] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  // Area stats
  useEffect(() => {
    fetchSettings().then((s) => {
      if (!s) return;
      setTotalKm2(Math.round(s.totalAreaM2 / 1_000_000));
      setCollectedKm2(+(s.collectedAreaM2 / 1_000_000).toFixed(1));
    }).catch(() => {});
  }, []);

  // Debounced search
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

  // Background polling
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const q = queryRef.current.trim();
        const url = q.length > 1 ? `/api/donations?q=${encodeURIComponent(q)}` : "/api/donations";
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json() as { donations: Donor[] };
        setDonors(data.donations ?? []);
        setFetchError(false);
      } catch { /* silent */ }
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const toggle = (d: Donor) => setSelected((prev) => (prev?.id === d.id ? null : d));

  return (
    <>
      <DonateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="flex h-full flex-col">

        {/* ── Search header ── */}
        <div className="flex-shrink-0 px-4 pb-2.5 pt-3.5">
          <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.32em] text-text-muted">
            Пошук власника сегмента
          </p>
          <label htmlFor="donor-search" className="sr-only">{t("search.hint")}</label>
          <div className="flex items-center gap-2 rounded border border-border bg-surface-2/80 px-3 py-2 transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_0_2px_rgba(0,200,240,0.08)]">
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="donor-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[12px] text-text outline-none placeholder:text-text-muted"
              placeholder={t("search.hint")}
            />
            {query && (
              <button onClick={() => setQuery("")} className="cursor-pointer text-text-muted hover:text-text" aria-label={t("common.close")}>
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Results ── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-1">
          <p className="mb-1 px-2 text-[8px] font-bold uppercase tracking-[0.28em] text-text-muted">
            Результати пошуку
          </p>

          {loading ? (
            <DonorSkeleton />
          ) : fetchError ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <p className="text-center text-xs text-red-400">{t("errors.loadFailed")}</p>
              <button onClick={() => setRetryCount((c) => c + 1)} className="cursor-pointer text-[10px] uppercase tracking-wider text-text-muted underline hover:text-primary">
                {t("errors.retry")}
              </button>
            </div>
          ) : donors.length === 0 ? (
            <p className="py-8 text-center text-xs text-text-muted">{t("search.notFound")}</p>
          ) : (
            <div className="space-y-0.5">
              {donors.map((donor) => {
                const active = selected?.id === donor.id;
                return (
                  <button
                    key={donor.id}
                    onClick={() => toggle(donor)}
                    className={`group flex w-full cursor-pointer items-center gap-2.5 rounded border px-2.5 py-2.5 text-left transition-all duration-150 ${
                      active
                        ? "border-primary/40 bg-primary/12 shadow-[inset_0_0_0_1px_rgba(0,200,240,0.15)]"
                        : "border-transparent hover:border-border/60 hover:bg-surface-2/60"
                    }`}
                  >
                    {isCompany(donor)
                      ? <BuildingIcon active={active} />
                      : <PersonIcon active={active} />}

                    <span className={`min-w-0 flex-1 truncate text-[12px] font-medium ${active ? "text-text" : "text-text/80"}`}>
                      {donor.name}
                    </span>
                    <span className={`flex-shrink-0 text-[11px] font-bold ${active ? "text-dome-select" : "text-primary/80"}`}>
                      — {fmtArea(donor.squareM2)}
                    </span>
                    <svg className={`h-3.5 w-3.5 flex-shrink-0 transition-colors ${active ? "text-dome-select" : "text-text-muted group-hover:text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Selected segment ── */}
        {selected && (
          <div className="flex-shrink-0 border-t border-border/60 px-4 py-3">
            <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.3em] text-text-muted">
              Обраний сегмент
            </p>
            <div className="relative overflow-hidden rounded border border-border/50 bg-surface-2/50 p-3">
              {/* Mini dome — top right */}
              <div className="absolute right-2 top-2 opacity-90">
                <MiniDomeSVG sector={selected.sector} />
              </div>

              {/* Name + area */}
              <div className="flex items-start gap-2 pr-20">
                <HexOutlineIcon />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold text-text">{selected.name}</p>
                  <p className="text-[20px] font-bold leading-tight text-dome-select">
                    {fmtArea(selected.squareM2)}
                  </p>
                </div>
              </div>

              {/* Status + location */}
              <div className="mt-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-text-muted">Статус:</span>
                  <span className="font-semibold text-success">Оплачено</span>
                  <svg className="h-3 w-3 text-success" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                {selected.sector !== null && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-text-muted">Розташування:</span>
                    <span className="text-text">Сектор {selected.sector}</span>
                    <svg className="h-3 w-3 text-text-muted" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Download actions */}
              <div className="mt-2.5 flex gap-1.5">
                <button className="cursor-pointer flex-1 rounded border border-border/60 px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-text-muted transition-all hover:border-primary/40 hover:text-primary">
                  {t("donationCard.downloadStories")}
                </button>
                <button className="cursor-pointer flex-1 rounded border border-border/60 px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-text-muted transition-all hover:border-primary/40 hover:text-primary">
                  {t("donationCard.downloadCert")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div className="flex-shrink-0 border-t border-border/60 px-4 py-3">
          <div className="mb-2.5 flex items-start gap-2.5">
            <ShieldSmIcon />
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-text-muted">
                Приєднуйтесь до захисту Львівщини
              </p>
              <p className="mt-0.5 text-[10px] text-text-muted">
                Кожен метр має значення
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="glow-primary flex w-full cursor-pointer items-center justify-between rounded border border-primary bg-primary/10 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-primary transition-all duration-200 hover:bg-primary hover:text-bg focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <span>Захистити свій сегмент</span>
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* ── Stats footer ── */}
        <div className="flex flex-shrink-0 items-stretch border-t border-border/60">
          <div className="flex flex-1 flex-col items-center justify-center py-3">
            <div className="flex items-baseline gap-1">
              <span className="text-[18px] font-bold leading-none text-gold">{totalKm2}</span>
              <span className="text-[9px] font-semibold text-gold/70">км²</span>
            </div>
            <span className="mt-0.5 text-center text-[7px] font-semibold uppercase leading-tight tracking-[0.18em] text-text-muted">
              Загальна площа купола
            </span>
          </div>
          <div className="w-px bg-border/60" />
          <div className="flex flex-1 flex-col items-center justify-center py-3">
            <div className="flex items-baseline gap-1">
              <span className="text-[18px] font-bold leading-none text-primary">{collectedKm2}</span>
              <span className="text-[9px] font-semibold text-primary/70">км²</span>
            </div>
            <span className="mt-0.5 text-center text-[7px] font-semibold uppercase leading-tight tracking-[0.18em] text-text-muted">
              Вже захищено
            </span>
          </div>
        </div>

      </div>
    </>
  );
}
