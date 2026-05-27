"use client";

/**
 * Single shared source of truth for donor data.
 *
 * BEFORE: DomeCanvas had its own setInterval(fetch, 30s), and SearchPanel's
 *         useDonorSearch had its own debounce + setInterval(fetch, 30s).
 *         Result: 4 calls to /api/donations on every mount + polling drift.
 *
 * NOW:    Module-level cache.  Whatever component subscribes first triggers
 *         a single fetch + a single polling timer.  All others read the
 *         same snapshot.  Re-renders are gated through useSyncExternalStore
 *         so React only re-renders subscribers when the snapshot actually
 *         changes.
 *
 * The search query lives here too — typing in the search box debounces
 * a single fetch that both the panel list AND the dome use.
 */

import { useSyncExternalStore } from "react";
import type { DonorData } from "./hexUtils";

type State = {
  donors: DonorData[];
  query: string;
  loading: boolean;
  fetchError: boolean;
};

const DEBOUNCE_MS = 300;
const POLL_MS = 30_000;

let state: State = {
  donors: [],
  query: "",
  loading: true,
  fetchError: false,
};

const listeners = new Set<() => void>();
let pollTimer: ReturnType<typeof setInterval> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let activeSubscribers = 0;
/** Last in-flight fetch's promise — lets late subscribers skip duplicate work. */
let pendingFetch: Promise<void> | null = null;

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

async function doFetch(q: string, silent = false): Promise<void> {
  if (pendingFetch) return pendingFetch;
  if (!silent) setState({ loading: true, fetchError: false });

  pendingFetch = (async () => {
    try {
      const trimmed = q.trim();
      const url =
        trimmed.length > 1
          ? `/api/donations?q=${encodeURIComponent(trimmed)}`
          : "/api/donations";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { donations?: DonorData[] };
      setState({ donors: data.donations ?? [], fetchError: false, loading: false });
    } catch {
      if (!silent) setState({ fetchError: true, donors: [], loading: false });
    } finally {
      pendingFetch = null;
    }
  })();

  return pendingFetch;
}

export function setSearchQuery(q: string): void {
  state = { ...state, query: q };
  listeners.forEach((l) => l());
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { void doFetch(state.query); }, DEBOUNCE_MS);
}

export function retryFetch(): void {
  void doFetch(state.query);
}

function getSnapshot(): State { return state; }

/** MUST return a stable reference — otherwise React loops forever on the
 *  server / during hydration ("getServerSnapshot should be cached"). */
const SERVER_SNAPSHOT: State = {
  donors: [], query: "", loading: true, fetchError: false,
};
function getServerSnapshot(): State { return SERVER_SNAPSHOT; }
function subscribe(l: () => void): () => void {
  listeners.add(l);
  activeSubscribers++;
  if (activeSubscribers === 1) {
    void doFetch(state.query);
    pollTimer = setInterval(() => { void doFetch(state.query, true); }, POLL_MS);
  }
  return () => {
    listeners.delete(l);
    activeSubscribers--;
    if (activeSubscribers === 0 && pollTimer) {
      clearInterval(pollTimer); pollTimer = null;
    }
  };
}

export function useDonors(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
