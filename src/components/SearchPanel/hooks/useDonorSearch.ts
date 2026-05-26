"use client";

import { useEffect, useRef, useState } from "react";
import type { Donor } from "../types";

const DEBOUNCE_MS = 300;
const POLL_MS = 30_000;

export const useDonorSearch = () => {
  const [query, setQuery] = useState("");
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  const fetchDonors = async (q: string, silent = false) => {
    if (!silent) {
      setLoading(true);
      setFetchError(false);
    }
    try {
      const trimmed = q.trim();
      const url =
        trimmed.length > 1
          ? `/api/donations?q=${encodeURIComponent(trimmed)}`
          : "/api/donations";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { donations: Donor[] };
      setDonors(data.donations ?? []);
      setFetchError(false);
    } catch {
      if (!silent) {
        setFetchError(true);
        setDonors([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDonors(query);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, retryCount]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchDonors(queryRef.current, true);
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const handleRetry = () => setRetryCount((c) => c + 1);

  return {
    query,
    setQuery,
    donors,
    loading,
    fetchError,
    handleRetry,
  };
};
