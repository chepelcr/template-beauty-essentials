// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Cart rules (pure; the zustand store lives in cart-store.ts).
 *
 * Lines are keyed by `key`, which is the product id today. Variants and
 * presentations (TSR-390/391) will extend the key without changing how lines
 * merge. Prices stored in the browser are never trusted: `reconcileCart`
 * refreshes every line from the live catalog before totals are shown.
 */
import { isPurchasable, maxQuantity } from './catalog';
import type { CatalogItem, ItemKind } from './types';

export const MAX_LINE_QUANTITY = 99;

export interface CartLine {
  key: string;
  productId: string;
  name: string;
  /** Per unit, the same price the catalog shows (see catalog.ts). */
  unitPrice: number;
  imageUrl: string | null;
  kind: ItemKind;
  quantity: number;
  /** Stock limit when the store tracks inventory; null when unlimited. */
  maxQuantity: number | null;
}

export const lineKeyFor = (item: Pick<CatalogItem, 'id'>): string => item.id;

const clamp = (quantity: number, max: number | null): number =>
  Math.max(1, Math.min(Math.floor(quantity), max ?? MAX_LINE_QUANTITY, MAX_LINE_QUANTITY));

export function lineFromItem(item: CatalogItem, quantity = 1): CartLine {
  const max = maxQuantity(item);
  return {
    key: lineKeyFor(item),
    productId: item.id,
    name: item.name,
    unitPrice: item.price,
    imageUrl: item.imageUrl,
    kind: item.kind,
    quantity: clamp(quantity, max),
    maxQuantity: max,
  };
}

export function addToLines(lines: CartLine[], item: CatalogItem, quantity = 1): CartLine[] {
  if (!isPurchasable(item) || quantity <= 0) return lines;
  const incoming = lineFromItem(item, quantity);
  const existing = lines.find((l) => l.key === incoming.key);
  if (!existing) return [...lines, incoming];
  return lines.map((l) =>
    l.key === incoming.key ? { ...incoming, quantity: clamp(l.quantity + quantity, incoming.maxQuantity) } : l,
  );
}

export function setLineQuantity(lines: CartLine[], key: string, quantity: number): CartLine[] {
  if (quantity <= 0) return removeLine(lines, key);
  return lines.map((l) => (l.key === key ? { ...l, quantity: clamp(quantity, l.maxQuantity) } : l));
}

export function removeLine(lines: CartLine[], key: string): CartLine[] {
  return lines.filter((l) => l.key !== key);
}

export interface CartTotals {
  /** Units across all lines. */
  count: number;
  lines: number;
  total: number;
}

export function cartTotals(lines: CartLine[]): CartTotals {
  return lines.reduce<CartTotals>(
    (acc, l) => ({ count: acc.count + l.quantity, lines: acc.lines + 1, total: acc.total + l.unitPrice * l.quantity }),
    { count: 0, lines: 0, total: 0 },
  );
}

export interface ReconcileResult {
  lines: CartLine[];
  /** Names of lines dropped because the item is gone or sold out. */
  removed: string[];
  /** True when any price, name, stock limit or quantity changed. */
  changed: boolean;
}

/** Refresh lines from the current catalog: prices, names, stock limits. */
export function reconcileCart(lines: CartLine[], items: CatalogItem[]): ReconcileResult {
  const byId = new Map(items.map((i) => [i.id, i]));
  const removed: string[] = [];
  let changed = false;
  const next: CartLine[] = [];
  for (const line of lines) {
    const item = byId.get(line.productId);
    if (!item || !isPurchasable(item)) {
      removed.push(line.name);
      changed = true;
      continue;
    }
    const fresh = lineFromItem(item, line.quantity);
    if (
      fresh.unitPrice !== line.unitPrice ||
      fresh.name !== line.name ||
      fresh.quantity !== line.quantity ||
      fresh.maxQuantity !== line.maxQuantity ||
      fresh.imageUrl !== line.imageUrl
    ) {
      changed = true;
    }
    next.push({ ...fresh, key: line.key });
  }
  return { lines: next, removed, changed };
}

/**
 * Read a persisted cart from an older template build. Old carts stored
 * `items: [{ id, name, price, imageUrl, quantity }]`; their prices are kept
 * only until the catalog loads and `reconcileCart` replaces them.
 */
export function migrateLegacyCart(state: unknown): CartLine[] {
  const s = (state ?? {}) as Record<string, unknown>;
  const source = Array.isArray(s.lines) ? s.lines : Array.isArray(s.items) ? s.items : [];
  return (source as Record<string, unknown>[])
    .map((raw) => {
      const id = String(raw.productId ?? raw.id ?? '');
      const quantity = Number(raw.quantity ?? 1);
      return {
        key: String(raw.key ?? id),
        productId: id,
        name: String(raw.name ?? ''),
        unitPrice: Number(raw.unitPrice ?? raw.price ?? 0),
        imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : null,
        kind: raw.kind === 'service' ? 'service' : 'product',
        quantity: Number.isFinite(quantity) && quantity > 0 ? Math.min(Math.floor(quantity), MAX_LINE_QUANTITY) : 1,
        maxQuantity: null,
      } satisfies CartLine;
    })
    .filter((l) => l.productId && l.name);
}
