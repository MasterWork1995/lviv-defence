"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { DonateModal } from "@/components/DonateModal";
import { fetchSettings } from "@/lib/client-settings-cache";
import {
  useDomeSelection,
  toggleSelected,
  setSelected as setDomeSelected,
} from "@/components/Dome/store";

interface Donor {
  id: string;
  name: string;
  squareM2: number;
  sector: number | null;
  amount?: number;
}

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */
function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-3.5-3.5" />
    </svg>
  );
}
function PersonIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" />
      <path strokeLinecap="round" d="M4 21c1-4.4 4-6.4 8-6.4s7 2 8 6.4" />
    </svg>
  );
}
function BuildingIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
    </svg>
  );
}
function HexIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path strokeLinejoin="round" d="M12 2.5l8 4.62v9.25L12 21.5l-8-5.13V7.12z" />
    </svg>
  );
}
function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5 9-10" />
    </svg>
  );
}
function PinIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function ShieldIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2L4 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" />
    </svg>
  );
}
function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
function CrossIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/* ═══════════════════════════════════════════
   MINI DOME SVG — shown in "Selected segment" card.
   Schematic top-half dome with hex grid + a highlight at the donor's sector.
   ═══════════════════════════════════════════ */
function MiniDome({ sector }: { sector: number | null }) {
  const cells = [
    { x: 50, y: 14 },
    { x: 30, y: 26 }, { x: 70, y: 26 },
    { x: 14, y: 40 }, { x: 50, y: 38 }, { x: 86, y: 40 },
    { x: 28, y: 52 }, { x: 72, y: 52 },
  ];
  const hi =
    sector !== null
      ? ((sector % cells.length) + cells.length) % cells.length
      : -1;
  const HEX = 8;

  return (
    <div className="relative aspect-square w-[88px] flex-shrink-0">
      <svg viewBox="0 0 100 70" className="h-full w-full" aria-hidden="true">
        {/* Dome outline arcs */}
        <path d="M 6 62 A 44 44 0 0 1 94 62" fill="none" stroke="rgba(0,200,240,0.55)" strokeWidth="0.7" />
        <path d="M 22 62 A 28 28 0 0 1 78 62" fill="none" stroke="rgba(0,200,240,0.3)" strokeWidth="0.5" />
        {/* Ground line */}
        <line x1="2" y1="62" x2="98" y2="62" stroke="rgba(0,200,240,0.6)" strokeWidth="0.6" />
        {/* Hex grid */}
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
              fill={isHi ? "rgba(240,180,41,0.35)" : "rgba(7,20,40,0.55)"}
              stroke={isHi ? "var(--color-gold)" : "rgba(26,101,192,0.7)"}
              strokeWidth={isHi ? 1.4 : 0.7}
              style={isHi ? { filter: "drop-shadow(0 0 4px var(--color-gold))" } : undefined}
            />
          );
        })}
      </svg>
      {/* Compass marks */}
      <div className="pointer-events-none absolute inset-0 font-mono text-[7px] text-text-muted/70">
        <span className="absolute left-1/2 top-0 -translate-x-1/2">N</span>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2">S</span>
        <span className="absolute left-0 top-1/2 -translate-y-1/2">W</span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2">E</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════ */
function DonorSkeleton() {
  return (
    <div className="space-y-1" aria-hidden="true">
      {[62, 48, 75, 40, 58].map((w, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md px-3 py-3">
          <div className="h-[18px] w-[18px] flex-shrink-0 animate-pulse rounded-full bg-surface-2" />
          <div className="h-2.5 animate-pulse rounded bg-surface-2" style={{ width: `${w}%` }} />
          <div className="ml-auto h-2.5 w-10 flex-shrink-0 animate-pulse rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
function fmtArea(m2: number): string {
  if (m2 <= 0) return "";
  if (m2 < 100_000)
    return new Intl.NumberFormat("uk-UA").format(Math.round(m2)) + " м²";
  const km2 = m2 / 1_000_000;
  return (km2 >= 1 ? km2.toFixed(2) : km2.toFixed(3)) + " км²";
}

function isCompany(d: Donor) {
  return (
    (d.amount !== undefined && d.amount >= 10_000) ||
    /ТОВ|ФОП|ПАТ|ПрАТ|ГО |МО |LLC|Ltd|&|corp/i.test(d.name)
  );
}

/* ═══════════════════════════════════════════
   PANEL SECTION TITLE
   ═══════════════════════════════════════════ */
function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <p className="font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/85">
        {children}
      </p>
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export function SearchPanel() {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const selectedId = useDomeSelection();
  const selected = donors.find((d) => d.id === selectedId) ?? null;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [totalKm2, setTotalKm2] = useState(50);
  const [collectedKm2, setCollectedKm2] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  /* Stats */
  useEffect(() => {
    fetchSettings()
      .then((s) => {
        if (!s) return;
        setTotalKm2(Math.round(s.totalAreaM2 / 1_000_000));
        setCollectedKm2(+(s.collectedAreaM2 / 1_000_000).toFixed(1));
      })
      .catch(() => {});
  }, []);

  /* Debounced search */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setFetchError(false);
      try {
        const url =
          query.trim().length > 1
            ? `/api/donations?q=${encodeURIComponent(query.trim())}`
            : "/api/donations";
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { donations: Donor[] };
        setDonors(data.donations ?? []);
      } catch {
        setFetchError(true);
        setDonors([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, retryCount]);

  /* Background polling */
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const q = queryRef.current.trim();
        const url =
          q.length > 1
            ? `/api/donations?q=${encodeURIComponent(q)}`
            : "/api/donations";
        const res = await fetch(url);
        if (!res.ok) return;
        const data = (await res.json()) as { donations: Donor[] };
        setDonors(data.donations ?? []);
        setFetchError(false);
      } catch {
        /* silent */
      }
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <DonateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
        {/* ════════════════════════════════════
            CARD 1 — Search + Results
            ════════════════════════════════════ */}
        <section className="rounded-xl border border-primary/20 bg-surface/60 p-4 backdrop-blur-xl">
          <SectionTitle>Пошук власника сегмента</SectionTitle>

          <label htmlFor="donor-search" className="sr-only">
            {t("search.hint")}
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-bg/60 px-3 py-2.5 transition-all focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(0,200,240,0.1)]">
            <SearchIcon className="h-4 w-4 flex-shrink-0 text-text-muted" />
            <input
              id="donor-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
              placeholder={t("search.hint")}
              autoComplete="off"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="cursor-pointer text-text-muted transition-colors hover:text-primary"
                aria-label={t("common.close")}
              >
                <CrossIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="mt-3">
            <p className="mb-1.5 font-display text-[9px] font-semibold uppercase tracking-[0.22em] text-text-muted">
              Результати пошуку
            </p>

            {loading ? (
              <DonorSkeleton />
            ) : fetchError ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <p className="text-center text-xs text-red-400">
                  {t("errors.loadFailed")}
                </p>
                <button
                  onClick={() => setRetryCount((c) => c + 1)}
                  className="cursor-pointer text-[10px] uppercase tracking-wider text-text-muted underline hover:text-primary"
                >
                  {t("errors.retry")}
                </button>
              </div>
            ) : donors.length === 0 ? (
              <p className="py-6 text-center text-xs text-text-muted">
                {t("search.notFound")}
              </p>
            ) : (
              <ul className="max-h-[240px] space-y-1 overflow-y-auto pr-1">
                {donors.map((donor) => {
                  const active = selected?.id === donor.id;
                  return (
                    <li key={donor.id}>
                      <button
                        onClick={() => toggleSelected(donor.id)}
                        className={[
                          "group grid w-full cursor-pointer grid-cols-[22px_1fr_auto_12px] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-150",
                          active
                            ? "border-primary bg-primary/12 shadow-[0_0_0_2px_rgba(0,200,240,0.15)]"
                            : "border-transparent bg-surface-2/40 hover:border-primary/30 hover:bg-surface-2/70",
                        ].join(" ")}
                      >
                        {isCompany(donor) ? (
                          <BuildingIcon className={`h-[22px] w-[22px] ${active ? "text-gold" : "text-primary/70"}`} />
                        ) : (
                          <PersonIcon className={`h-[22px] w-[22px] ${active ? "text-primary" : "text-primary/70"}`} />
                        )}
                        <span className={`min-w-0 truncate text-[13px] font-medium ${active ? "text-text" : "text-text/85"}`}>
                          {donor.name}
                        </span>
                        <span className={`flex-shrink-0 font-mono text-[12px] tabular-nums ${active ? "text-dome-select" : "text-primary/80"}`}>
                          {fmtArea(donor.squareM2)}
                        </span>
                        <ChevronIcon className={`h-3 w-3 transition-colors ${active ? "text-dome-select" : "text-text-muted group-hover:text-primary"}`} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════
            CARD 2 — Selected segment
            ════════════════════════════════════ */}
        <section
          className={[
            "rounded-xl border bg-surface/60 p-4 backdrop-blur-xl transition-opacity duration-300",
            selected ? "border-primary/30 opacity-100" : "border-border/40 opacity-70",
          ].join(" ")}
        >
          <SectionTitle
            action={
              selected ? (
                <button
                  onClick={() => setDomeSelected(null)}
                  className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted transition-colors hover:text-primary"
                >
                  ← обертати знову
                </button>
              ) : null
            }
          >
            Обраний сегмент
          </SectionTitle>

          {selected ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* Hex icon */}
                  <div className="mb-2 flex h-9 w-10 items-center justify-center" style={{ filter: "drop-shadow(0 0 6px rgba(0,200,240,0.5))" }}>
                    <HexIcon className="h-9 w-9 text-primary" />
                  </div>
                  <p className="truncate text-[14px] font-semibold text-text">{selected.name}</p>
                  <p className="text-glow font-display text-[24px] font-bold leading-tight text-dome-select">
                    {fmtArea(selected.squareM2)}
                  </p>
                </div>

                <MiniDome sector={selected.sector} />
              </div>

              {/* Status row */}
              <div className="mt-3 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-text-muted">Статус:</span>
                  <span className="font-semibold text-success">Оплачено</span>
                  <CheckIcon className="h-3 w-3 text-success" />
                </div>
                {selected.sector !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">Розташування:</span>
                    <span className="text-text">Сектор {selected.sector}</span>
                    <PinIcon className="h-3 w-3 text-text-muted" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-3 flex gap-2">
                <button className="cursor-pointer flex-1 rounded-md border border-border/60 px-2 py-1.5 font-display text-[9px] font-semibold uppercase tracking-[0.12em] text-text-muted transition-all hover:border-primary/50 hover:text-primary">
                  {t("donationCard.downloadStories")}
                </button>
                <button className="cursor-pointer flex-1 rounded-md border border-border/60 px-2 py-1.5 font-display text-[9px] font-semibold uppercase tracking-[0.12em] text-text-muted transition-all hover:border-primary/50 hover:text-primary">
                  {t("donationCard.downloadCert")}
                </button>
              </div>
            </>
          ) : (
            <p className="py-3 text-center text-[12px] text-text-muted">
              Натисни гекс або імʼя у списку, щоб переглянути сегмент.
            </p>
          )}
        </section>

        {/* ════════════════════════════════════
            CARD 3 — CTA + footer stats
            ════════════════════════════════════ */}
        <section className="rounded-xl border border-primary/25 bg-surface/60 p-4 backdrop-blur-xl">
          <div className="mb-3 flex items-start gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
              <ShieldIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-text">
                Приєднуйтесь до захисту Львівщини
              </p>
              <p className="mt-0.5 text-[11px] text-text-muted">
                Кожен метр має значення
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="glow-primary group flex w-full cursor-pointer items-center justify-between rounded-lg border border-primary bg-gradient-to-b from-primary/15 to-primary/5 px-4 py-3 font-display text-[12px] font-semibold uppercase tracking-[0.18em] text-primary transition-all duration-200 hover:from-primary/25 hover:to-primary/10 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <span>Захистити свій сегмент</span>
            <ChevronIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="h-3 w-3 flex-shrink-0 rounded-full border border-primary/60 bg-primary/15"
                style={{ boxShadow: "0 0 6px rgba(0,200,240,0.4)" }}
              />
              <div className="min-w-0">
                <div className="font-display text-[14px] font-bold leading-none text-text">
                  {totalKm2} км²
                </div>
                <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-text-muted">
                  Загальна площа
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="h-3 w-3 flex-shrink-0 rounded-full border border-gold/70 bg-gold/15"
                style={{ boxShadow: "0 0 6px rgba(240,180,41,0.45)" }}
              />
              <div className="min-w-0">
                <div className="font-display text-[14px] font-bold leading-none text-gold">
                  {collectedKm2} км²
                </div>
                <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-text-muted">
                  Уже захищено
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
