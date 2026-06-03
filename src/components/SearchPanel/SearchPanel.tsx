"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useDomeSelection } from "@/components/Dome/store";
import { useDonorSearch } from "./hooks/useDonorSearch";
import { usePanelStats } from "./hooks/usePanelStats";
import { SearchCard } from "./SearchCard";
import { SelectedSegmentCard } from "./SelectedSegmentCard";
import { CtaCard } from "./CtaCard";

const DonateModal = dynamic(
  () => import("@/components/DonateModal").then((m) => m.DonateModal),
  { ssr: false },
);

export const SearchPanel = () => {
  const selectedId = useDomeSelection();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const stats = usePanelStats();
  const { query, setQuery, donors, loading, fetchError, handleRetry } =
    useDonorSearch();

  const selected = donors.find((d) => d.id === selectedId) ?? null;

  return (
    <>
      <DonateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="flex flex-col gap-3 p-4 xl:h-full xl:overflow-y-auto xl:px-5">
        <SearchCard
          query={query}
          onQueryChange={setQuery}
          donors={donors}
          loading={loading}
          fetchError={fetchError}
          onRetry={handleRetry}
          selectedId={selectedId}
        />
        <SelectedSegmentCard selected={selected} />
        <CtaCard stats={stats} onDonate={() => setIsModalOpen(true)} />
      </div>
    </>
  );
};
