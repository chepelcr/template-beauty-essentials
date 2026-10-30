// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * The cart store (zustand, persisted in this browser) and its UI flags.
 * Rules live in cart.ts; this file only holds state.
 */
import { useEffect, useMemo, useRef } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { announce } from './a11y';
import {
  addToLines,
  cartTotals,
  lineKeyFor,
  migrateLegacyCart,
  reconcileCart,
  removeLine,
  setLineQuantity,
  type CartLine,
  type CartTotals,
} from './cart';
import type { CatalogItem } from './types';

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  checkoutOpen: boolean;
  /** Returns how many units were actually added after applying stock limits. */
  add: (item: CatalogItem, quantity?: number) => number;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  replaceLines: (lines: CartLine[]) => void;
  open: () => void;
  close: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
}

const memoryStorage = (): Storage => {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => Array.from(data.keys())[i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
};

function safeStorage(): Storage {
  try {
    const probe = '__tsuru_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    // Private mode or blocked storage: the cart still works for this visit.
    return memoryStorage();
  }
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      checkoutOpen: false,
      add: (item, quantity = 1) => {
        const current = get().lines;
        const key = lineKeyFor(item);
        const before = current.find((line) => line.key === key)?.quantity ?? 0;
        const lines = addToLines(current, item, quantity);
        const after = lines.find((line) => line.key === key)?.quantity ?? 0;
        set({ lines });
        return Math.max(0, after - before);
      },
      setQuantity: (key, quantity) => set((s) => ({ lines: setLineQuantity(s.lines, key, quantity) })),
      remove: (key) => set((s) => ({ lines: removeLine(s.lines, key) })),
      clear: () => set({ lines: [] }),
      replaceLines: (lines) => set({ lines }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      openCheckout: () => set({ isOpen: false, checkoutOpen: true }),
      closeCheckout: () => set({ checkoutOpen: false }),
    }),
    {
      name: 'tsuru-cart',
      version: 2,
      storage: createJSONStorage(() => (typeof window === 'undefined' ? memoryStorage() : safeStorage())),
      partialize: (s) => ({ lines: s.lines }),
      migrate: (persisted) => ({ lines: migrateLegacyCart(persisted) }) as unknown as CartState,
    },
  ),
);

export function useCartTotals(): CartTotals {
  const lines = useCart((s) => s.lines);
  return useMemo(() => cartTotals(lines), [lines]);
}

/**
 * Keep the stored cart true to the catalog: refresh prices and names, cap
 * quantities to stock, drop what is gone or sold out (and say so).
 * `removedMessage` receives the dropped names, e.g. "Ya no está disponible: X".
 */
export function useCartReconciliation(items: CatalogItem[], ready: boolean, removedMessage: (names: string) => string): void {
  const lastItems = useRef<CatalogItem[] | null>(null);
  useEffect(() => {
    if (!ready || lastItems.current === items) return;
    lastItems.current = items;
    const { lines, replaceLines } = useCart.getState();
    if (!lines.length) return;
    const result = reconcileCart(lines, items);
    if (result.changed) replaceLines(result.lines);
    if (result.removed.length) announce(removedMessage(result.removed.join(', ')));
  }, [items, ready, removedMessage]);
}
