"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const MOCK_DONORS = [
  { id: "1", name: "Родина Коваль", area: 4.5, sector: 7 },
  { id: "2", name: "ТзОВ «Галичина»", area: 23.0, sector: 12 },
  { id: "3", name: "Іванченко М. В.", area: 1.1, sector: 3 },
  { id: "4", name: "Громада с. Рясне", area: 8.2, sector: 19 },
  { id: "5", name: "Бізнес-центр «Форум»", area: 14.5, sector: 8 },
  { id: "6", name: "Іваненко О. П.", area: 0.8, sector: 5 },
];

type Donor = (typeof MOCK_DONORS)[0];

export function SearchPanel() {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Donor | null>(null);

  const results =
    query.trim().length > 1
      ? MOCK_DONORS.filter((d) =>
          d.name.toLowerCase().includes(query.toLowerCase())
        )
      : MOCK_DONORS;

  const toggle = (donor: Donor) =>
    setSelected((prev) => (prev?.id === donor.id ? null : donor));

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {/* Search */}
      <div>
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-text-dim">
          {t("search.placeholder")}
        </p>
        <label htmlFor="donor-search" className="sr-only">
          {t("search.hint")}
        </label>
        <div className="flex items-center gap-2 rounded border border-border bg-surface-2 px-3 py-2 transition-colors focus-within:border-primary/50">
          <svg
            className="h-3 w-3 flex-shrink-0 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="donor-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-text outline-none placeholder:text-text-muted"
            placeholder={t("search.hint")}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="cursor-pointer text-text-muted transition-colors hover:text-text"
              aria-label={t("common.close")}
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results list */}
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {results.length === 0 ? (
          <p className="py-6 text-center text-xs text-text-muted">
            {t("search.notFound")}
          </p>
        ) : (
          results.map((donor) => (
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
                <span className="truncate text-[11px] font-medium text-text">
                  {donor.name}
                </span>
                <span className="flex-shrink-0 text-[10px] font-bold text-primary">
                  {donor.area}&nbsp;км²
                </span>
              </div>
              <p className="mt-0.5 text-[9px] uppercase tracking-wider text-text-muted">
                Сектор&nbsp;{donor.sector}
              </p>
            </button>
          ))
        )}
      </div>

      {/* Selected donor card */}
      {selected && (
        <div className="rounded border border-dome-select/25 bg-surface-2 p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-text">
                {selected.name}
              </p>
              <p className="text-[9px] uppercase tracking-wider text-text-muted">
                Сектор&nbsp;{selected.sector}
              </p>
            </div>
            <span className="flex-shrink-0 rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
              {selected.area}&nbsp;км²
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
      <button className="glow-primary w-full cursor-pointer rounded border border-primary bg-primary/15 py-3 text-xs font-bold uppercase tracking-wider text-primary transition-all duration-200 hover:bg-primary hover:text-bg focus:outline-none focus:ring-1 focus:ring-primary">
        {t("common.donate")}
      </button>

      <p className="text-center text-[9px] text-text-muted">
        {t("search.notFound")}&nbsp;
        <button className="cursor-pointer text-text-dim transition-colors hover:text-primary">
          {t("search.contactCta")}
        </button>
      </p>
    </div>
  );
}
