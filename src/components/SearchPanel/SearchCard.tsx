"use client";

import { useTranslations } from "next-intl";
import { formatArea } from "@/components/DonateModal/utils";
import { toggleSelected } from "@/components/Dome/store";
import type { Donor } from "./types";
import { isCompany } from "./utils";
import {
  panelCard,
  panelGhostButton,
  panelInput,
  panelSubLabel,
} from "./styles";
import {
  BuildingIcon,
  ChevronIcon,
  CrossIcon,
  PersonIcon,
  SearchIcon,
} from "./icons";
import { PanelSectionTitle } from "./PanelSectionTitle";
import { DonorSkeleton } from "./DonorSkeleton";

type SearchCardProps = {
  query: string;
  onQueryChange: (value: string) => void;
  donors: Donor[];
  loading: boolean;
  fetchError: boolean;
  onRetry: () => void;
  selectedId: string | null;
};

export const SearchCard = ({
  query,
  onQueryChange,
  donors,
  loading,
  fetchError,
  onRetry,
  selectedId,
}: SearchCardProps) => {
  const t = useTranslations();

  return (
    <section className={panelCard}>
      <PanelSectionTitle>{t("search.title")}</PanelSectionTitle>

      <label htmlFor="donor-search" className="sr-only">
        {t("search.hint")}
      </label>
      <div className={panelInput}>
        <SearchIcon className="h-4 w-4 flex-shrink-0 text-text-muted" />
        <input
          id="donor-search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="flex-1 bg-transparent font-sans text-[13px] text-text outline-none placeholder:text-text-muted"
          placeholder={t("search.hint")}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="cursor-pointer text-text-muted transition-colors hover:text-primary"
            aria-label={t("common.close")}
          >
            <CrossIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-3">
        <p className={`mb-1.5 ${panelSubLabel}`}>{t("search.resultsTitle")}</p>

        {loading ? (
          <DonorSkeleton />
        ) : fetchError ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <p className="text-center font-mono text-[10px] uppercase tracking-wider text-error">
              {t("errors.loadFailed")}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className={panelGhostButton}
            >
              {t("errors.retry")}
            </button>
          </div>
        ) : donors.length === 0 ? (
          <p className="py-6 text-center font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {t("search.noResults")}
          </p>
        ) : (
          <ul className="max-h-[240px] space-y-1 overflow-y-auto pr-1">
            {donors.map((donor) => {
              const active = selectedId === donor.id;
              return (
                <li key={donor.id}>
                  <button
                    type="button"
                    onClick={() => toggleSelected(donor.id)}
                    className={[
                      "group grid w-full cursor-pointer grid-cols-[22px_1fr_auto_12px] items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition-all duration-150",
                      active
                        ? "border-primary/50 bg-primary/10 shadow-[0_0_0_1px_rgba(0,200,240,0.2)]"
                        : "border-border/40 bg-surface-2/30 hover:border-primary/30 hover:bg-surface-2/60",
                    ].join(" ")}
                  >
                    {isCompany(donor) ? (
                      <BuildingIcon
                        className={`h-[22px] w-[22px] ${active ? "text-gold" : "text-primary/70"}`}
                      />
                    ) : (
                      <PersonIcon
                        className={`h-[22px] w-[22px] ${active ? "text-primary" : "text-primary/70"}`}
                      />
                    )}
                    <span
                      className={`min-w-0 truncate text-[13px] font-medium ${active ? "text-text" : "text-text-dim"}`}
                    >
                      {donor.name}
                    </span>
                    <span
                      className={`flex-shrink-0 font-mono text-[11px] tabular-nums uppercase tracking-wide ${active ? "text-primary" : "text-text-muted"}`}
                    >
                      {formatArea(donor.squareM2, t)}
                    </span>
                    <ChevronIcon
                      className={`h-3 w-3 transition-colors ${active ? "text-primary" : "text-text-muted group-hover:text-primary"}`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
