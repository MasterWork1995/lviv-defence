"use client";

/**
 * Adapter hook — keeps the same shape useDonorSearch returned before
 * (query / setQuery / donors / loading / fetchError / handleRetry), but
 * now reads from the SHARED donor store instead of fetching independently.
 *
 * Result: typing in the search box still triggers the debounced fetch, and
 * polling is centralised in donorsStore — so the dome and the search list
 * always show the same data and we make 1 fetch instead of 4.
 */

import {
  useDonors,
  setSearchQuery,
  retryFetch,
} from "@/components/Dome/donorsStore";

export const useDonorSearch = () => {
  const { donors, query, loading, fetchError } = useDonors();

  return {
    query,
    setQuery: setSearchQuery,
    donors,
    loading,
    fetchError,
    handleRetry: retryFetch,
  };
};
