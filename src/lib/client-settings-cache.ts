"use client";

import type { AppSettings } from "./settings";

const CACHE_TTL_MS = 28_000;

let cachedData: AppSettings | null = null;
let fetchedAt = 0;
let inflight: Promise<AppSettings | null> | null = null;

export async function fetchSettings(options?: {
  force?: boolean;
}): Promise<AppSettings | null> {
  const now = Date.now();
  const isStale = now - fetchedAt >= CACHE_TTL_MS;

  if (!options?.force && cachedData && !isStale) return cachedData;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) return cachedData;
      const data = (await res.json()) as AppSettings;
      cachedData = data;
      fetchedAt = Date.now();
      return data;
    } catch {
      return cachedData;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
