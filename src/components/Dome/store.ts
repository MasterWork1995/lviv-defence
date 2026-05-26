"use client";

/**
 * Tiny external store that lets the dome canvas and the search panel share
 * the currently-selected donor without adding zustand / context boilerplate.
 *
 * Both sides read with `useDomeSelection()` and write with `setSelected(id)`.
 *
 * Why this file exists (and not a Context):
 *   - DomeCanvas lives inside a dynamic-imported, ssr:false subtree.
 *   - SearchPanel lives in the same Hero but is its own client component.
 *   - Wrapping both in a provider would force lifting state into Hero, which
 *     is a server component. A module-level store side-steps that entirely.
 */

import { useSyncExternalStore } from "react";

type Listener = () => void;

let selectedId: string | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function setSelected(id: string | null): void {
  if (selectedId === id) return;
  selectedId = id;
  emit();
}

export function getSelected(): string | null {
  return selectedId;
}

export function toggleSelected(id: string): void {
  setSelected(selectedId === id ? null : id);
}

function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot(): string | null {
  return selectedId;
}

function getServerSnapshot(): string | null {
  return null;
}

export function useDomeSelection(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
