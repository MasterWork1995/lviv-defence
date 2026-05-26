"use client";

import { useTranslations } from "next-intl";
import { formatArea } from "@/components/DonateModal/utils";
import { setSelected as setDomeSelected } from "@/components/Dome/store";
import type { Donor } from "./types";
import { panelCard, panelGhostButton } from "./styles";
import { CheckIcon, HexIcon, PinIcon } from "./icons";
import { PanelSectionTitle } from "./PanelSectionTitle";
import { MiniDome } from "./MiniDome";

type SelectedSegmentCardProps = {
  selected: Donor | null;
};

export const SelectedSegmentCard = ({ selected }: SelectedSegmentCardProps) => {
  const t = useTranslations();

  return (
    <section
      className={[
        panelCard,
        "transition-opacity duration-300",
        selected ? "border-primary/40 opacity-100" : "opacity-75",
      ].join(" ")}
    >
      <PanelSectionTitle
        action={
          selected ? (
            <button
              type="button"
              onClick={() => setDomeSelected(null)}
              className={panelGhostButton}
            >
              ← {t("search.rotateAgain")}
            </button>
          ) : null
        }
      >
        {t("search.selectedTitle")}
      </PanelSectionTitle>

      {selected ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div
                className="mb-2 flex h-9 w-10 items-center justify-center"
                style={{ filter: "drop-shadow(0 0 6px rgba(0,200,240,0.4))" }}
              >
                <HexIcon className="h-9 w-9 text-primary" />
              </div>
              <p className="truncate font-sans text-[14px] font-semibold text-text">
                {selected.name}
              </p>
              <p className="text-glow font-display text-[22px] font-bold leading-tight text-primary lg:text-[24px]">
                {formatArea(selected.squareM2, t)}
              </p>
            </div>
            <MiniDome sector={selected.sector} />
          </div>

          <div className="mt-3 space-y-1.5 font-mono text-[10px] uppercase tracking-[0.06em]">
            <div className="flex items-center gap-2">
              <span className="text-text-muted">
                {t("donationCard.statusLabel")}:
              </span>
              <span className="font-semibold text-success">
                {t("donationCard.status.paid")}
              </span>
            </div>
            {selected.sector !== null && (
              <div className="flex items-center gap-2">
                <span className="text-text-muted">
                  {t("search.locationLabel")}
                </span>
                <span className="text-text">
                  {t("search.sector", { sector: selected.sector })}
                </span>
                <PinIcon className="h-3 w-3 text-text-muted" />
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="flex-1 cursor-pointer rounded-md border border-border/60 px-2 py-1.5 font-display text-[9px] font-semibold uppercase tracking-[0.12em] text-text-muted transition-all hover:border-primary/40 hover:text-primary"
            >
              {t("donationCard.downloadStories")}
            </button>
            <button
              type="button"
              className="flex-1 cursor-pointer rounded-md border border-border/60 px-2 py-1.5 font-display text-[9px] font-semibold uppercase tracking-[0.12em] text-text-muted transition-all hover:border-primary/40 hover:text-primary"
            >
              {t("donationCard.downloadCert")}
            </button>
          </div>
        </>
      ) : (
        <p className="py-3 text-center font-sans text-[12px] text-text-muted">
          {t("search.emptySelected")}
        </p>
      )}
    </section>
  );
};
