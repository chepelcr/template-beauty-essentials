// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/** A persisted light/dark preference shared by storefront navigation controls. */
import { useSyncExternalStore } from 'react';
import { prefersReducedMotion } from './motion';

export type ColorScheme = 'light' | 'dark';

const STORAGE_KEY = 'tsuru:color-scheme';
const SYSTEM_QUERY = '(prefers-color-scheme: dark)';
const listeners = new Set<() => void>();
let initialized = false;
let scheme: ColorScheme = 'light';
let preference: ColorScheme | null = null;
let system: MediaQueryList | null = null;
let animationTimer: number | undefined;

const validScheme = (value: unknown): ColorScheme | null =>
  value === 'light' || value === 'dark' ? value : null;

function applyScheme(next: ColorScheme, animate: boolean): void {
  const root = document.documentElement;
  const changed = root.dataset.colorScheme !== next;
  if (animationTimer !== undefined) window.clearTimeout(animationTimer);
  delete root.dataset.themeChanging;
  if (changed && animate && !prefersReducedMotion()) {
    root.dataset.themeChanging = 'true';
    // Keep transition declarations present until the longest colour fade ends.
    animationTimer = window.setTimeout(() => {
      delete root.dataset.themeChanging;
      animationTimer = undefined;
    }, 260);
  }
  root.dataset.colorScheme = next;
  root.style.colorScheme = next;
  scheme = next;
  if (changed) listeners.forEach((listener) => listener());
}

/** Call before mounting React so a saved or system preference paints immediately. */
export function initializeColorScheme(): void {
  if (initialized || typeof window === 'undefined' || typeof document === 'undefined') return;
  initialized = true;
  try {
    preference = validScheme(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Private browsing and disabled storage still support a session preference.
    preference = null;
  }
  system = typeof window.matchMedia === 'function' ? window.matchMedia(SYSTEM_QUERY) : null;
  applyScheme(preference ?? (system?.matches ? 'dark' : 'light'), false);
  system?.addEventListener('change', () => {
    if (preference === null) applyScheme(system!.matches ? 'dark' : 'light', true);
  });
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    preference = validScheme(event.newValue);
    applyScheme(preference ?? (system?.matches ? 'dark' : 'light'), true);
  });
}

/** Manual choices take priority over later changes to the operating system. */
export function toggleColorScheme(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  initializeColorScheme();
  preference = scheme === 'dark' ? 'light' : 'dark';
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // The current tab still keeps the selected scheme when storage is blocked.
  }
  applyScheme(preference, true);
}

function subscribe(listener: () => void): () => void {
  initializeColorScheme();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getScheme(): ColorScheme {
  initializeColorScheme();
  return scheme;
}

export function useColorScheme(): { scheme: ColorScheme; toggle: () => void } {
  return {
    scheme: useSyncExternalStore(subscribe, getScheme, () => 'light'),
    toggle: toggleColorScheme,
  };
}
