// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Catalog rules shared by every template (pure; no React).
 *
 * - The price shown is what the order charges: store-be's `sale_price`
 *   (after Hacienda discounts and taxes) when present, else the net price.
 * - A struck-through reference price appears only when the data has a higher
 *   `original_price`, scaled to the same basis as the shown price.
 * - Availability is shown only when the store tracks inventory.
 * - Services (and retired programs) are never "sold out": they are not stock.
 * - "Destacados" is a rule, not a hand-picked list: offers first, then newest.
 */
import type { StorefrontCategory, StorefrontProduct } from '@chepelcr/tsuru-storefront-sdk';
import type {
  Availability,
  CatalogCategory,
  CatalogFacets,
  CatalogFilters,
  CatalogItem,
  ItemKind,
  SortKey,
} from './types';

const DEFAULT_LOW_STOCK = 5;

const str = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Lowercase, accents and combining marks removed (so "tsiru’" matches "tsiru"). */
export function foldText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[’'`´]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function kindOf(type: string | null | undefined): ItemKind {
  return type === 'service' || type === 'program' ? 'service' : 'product';
}

/** Active rows only: status 1 (live) or an active flag (demo). */
export function isListed(product: StorefrontProduct): boolean {
  return product.status === 1 || (product.status === undefined && product.isActive);
}

export interface PriceView {
  price: number;
  compareAtPrice: number | null;
  percentOff: number | null;
  onOffer: boolean;
  taxIncluded: boolean;
}

export function priceOf(product: StorefrontProduct): PriceView {
  const net = num(product.price) ?? 0;
  const sale = num(product.salePrice);
  const taxIncluded = sale !== null && sale > 0;
  const price = taxIncluded ? sale! : net;
  // The factor that turned the net price into the charged one, applied to
  // the reference price so both read on the same basis.
  const factor = taxIncluded && net > 0 ? sale! / net : 1;

  const original = num(product.originalPrice);
  const compareAtPrice = original !== null && original > net ? Math.round(original * factor) : null;

  let percentOff: number | null = null;
  const discount = num(product.discount);
  if (compareAtPrice !== null) {
    percentOff = discount !== null && discount > 0
      ? Math.round(discount)
      : Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  } else if (discount !== null && discount > 0 && (product.isOffer || product.onSale)) {
    percentOff = Math.round(discount);
  }

  return {
    price: Math.round(price),
    compareAtPrice,
    percentOff: percentOff !== null && percentOff > 0 ? percentOff : null,
    onOffer: compareAtPrice !== null || product.isOffer || product.onSale,
    taxIncluded,
  };
}

export function availabilityOf(product: StorefrontProduct, kind: ItemKind = kindOf(product.type)): Availability {
  if (kind === 'service') return { state: 'untracked' };
  const raw = product.raw ?? {};
  const tracked = raw.track_inventory ?? raw.trackInventory;
  if (tracked === false) return { state: 'untracked' };
  const quantity = num(product.stockQuantity);
  if (tracked === undefined && quantity === null) return { state: 'untracked' };
  const stock = Math.max(0, quantity ?? 0);
  if (stock === 0) return { state: 'sold_out' };
  const threshold = num(raw.low_stock_threshold ?? raw.lowStockThreshold) ?? DEFAULT_LOW_STOCK;
  return stock <= threshold ? { state: 'low', quantity: stock } : { state: 'in_stock', quantity: stock };
}

export const isPurchasable = (item: CatalogItem): boolean => item.availability.state !== 'sold_out';

/** The most the cart may hold of one item; null when there is no stock limit. */
export function maxQuantity(item: CatalogItem): number | null {
  const a = item.availability;
  return a.state === 'in_stock' || a.state === 'low' ? a.quantity : null;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export function toCatalogCategory(category: StorefrontCategory, index = 0): CatalogCategory {
  const raw = category as Record<string, unknown>;
  const slug = str(category.slug);
  return {
    id: String(category.id),
    key: slug ?? String(category.id),
    name: str(category.name) ?? '',
    description: str(category.description),
    imageUrl: str(raw.image_1_url) ?? str(raw.image1_url) ?? str(raw.image1Url) ?? str(category.imageUrl),
    secondImageUrl: str(raw.image_2_url) ?? str(raw.image2_url) ?? str(raw.image2Url),
    backgroundColor: str(raw.background_color) ?? str(raw.backgroundColor),
    buttonColor: str(raw.button_color) ?? str(raw.buttonColor),
    sortOrder: num(raw.sort_order ?? raw.sortOrder) ?? index,
  };
}

export function isCategoryActive(category: StorefrontCategory): boolean {
  const raw = category as Record<string, unknown>;
  const active = raw.is_active ?? raw.isActive ?? category.isActive;
  return active !== false;
}

/** Active categories in the store's order. */
export function prepareCategories(categories: StorefrontCategory[]): CatalogCategory[] {
  return categories
    .filter(isCategoryActive)
    .map((c, i) => toCatalogCategory(c, i))
    .filter((c) => c.name)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es'));
}

export function toCatalogItem(product: StorefrontProduct, categories: Map<string, CatalogCategory>): CatalogItem {
  const kind = kindOf(product.type);
  const pricing = priceOf(product);
  const category = product.categoryId ? categories.get(product.categoryId) : undefined;
  const raw = product.raw ?? {};
  const created = str(raw.created_on) ?? str(raw.createdOn) ?? str(raw.created_at);
  const createdAt = created ? Date.parse(created) : NaN;
  const difficulty = str(product.difficulty);
  return {
    id: String(product.id),
    name: str(product.name) ?? '',
    description: str(product.description) ?? '',
    kind,
    ...pricing,
    imageUrl: str(product.imageUrl),
    categoryId: product.categoryId ? String(product.categoryId) : null,
    availability: availabilityOf(product, kind),
    duration: str(product.duration),
    difficulty: difficulty ? DIFFICULTY_LABELS[difficulty.toLowerCase()] ?? difficulty : null,
    createdAt: Number.isFinite(createdAt) ? createdAt : null,
    searchText: foldText([product.name, product.description, category?.name ?? product.categoryName ?? ''].join(' ')),
    raw: product,
  };
}

/** Listed products as view models, given the store's categories. */
export function prepareCatalog(products: StorefrontProduct[], categories: CatalogCategory[]): CatalogItem[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return products.filter(isListed).map((p) => toCatalogItem(p, byId)).filter((item) => item.name);
}

export function findCategory(categories: CatalogCategory[], key: string | null | undefined): CatalogCategory | undefined {
  if (!key) return undefined;
  return categories.find((c) => c.key === key) ?? categories.find((c) => c.id === key);
}

export function matchesQuery(item: CatalogItem, query: string): boolean {
  const tokens = foldText(query).split(' ').filter(Boolean);
  return tokens.every((token) => item.searchText.includes(token));
}

/** Offers first (deepest first), then newest, then the store's order. */
function featuredCompare(a: CatalogItem, b: CatalogItem): number {
  if (a.onOffer !== b.onOffer) return a.onOffer ? -1 : 1;
  if (a.onOffer && b.onOffer && (a.percentOff ?? 0) !== (b.percentOff ?? 0)) {
    return (b.percentOff ?? 0) - (a.percentOff ?? 0);
  }
  return (b.createdAt ?? 0) - (a.createdAt ?? 0);
}

export function sortItems(items: CatalogItem[], sort: SortKey = 'featured'): CatalogItem[] {
  const list = [...items];
  const soldOutLast = (a: CatalogItem, b: CatalogItem) =>
    Number(!isPurchasable(a)) - Number(!isPurchasable(b));
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name, 'es'));
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name, 'es'));
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    case 'newest':
      return list.sort((a, b) => soldOutLast(a, b) || (b.createdAt ?? 0) - (a.createdAt ?? 0));
    default:
      return list.sort((a, b) => soldOutLast(a, b) || featuredCompare(a, b));
  }
}

/** The home page's highlights: purchasable items, offers first, then newest. */
export function featuredItems(items: CatalogItem[], limit = 8): CatalogItem[] {
  return sortItems(items.filter(isPurchasable), 'featured').slice(0, limit);
}

export function filterItems(
  items: CatalogItem[],
  filters: CatalogFilters,
  categories: CatalogCategory[],
): CatalogItem[] {
  const category = findCategory(categories, filters.category);
  const query = filters.q?.trim();
  const filtered = items.filter((item) => {
    if (filters.kind && item.kind !== filters.kind) return false;
    if (category && item.categoryId !== category.id) return false;
    if (filters.sale && !item.onOffer) return false;
    if (query && !matchesQuery(item, query)) return false;
    return true;
  });
  return sortItems(filtered, filters.sort);
}

export function facetsFor(items: CatalogItem[]): CatalogFacets {
  const facets: CatalogFacets = {
    total: items.length,
    kinds: { product: 0, service: 0 },
    categories: new Map(),
    onOffer: 0,
  };
  for (const item of items) {
    facets.kinds[item.kind] += 1;
    if (item.onOffer) facets.onOffer += 1;
    if (item.categoryId) facets.categories.set(item.categoryId, (facets.categories.get(item.categoryId) ?? 0) + 1);
  }
  return facets;
}

/** Categories that have something to show, in the store's order. */
export function categoriesWithItems(categories: CatalogCategory[], items: CatalogItem[]): CatalogCategory[] {
  const facets = facetsFor(items);
  return categories.filter((c) => (facets.categories.get(c.id) ?? 0) > 0);
}

/** A filter is worth showing only when it changes the result. */
export function showsKindFilter(facets: CatalogFacets): boolean {
  return facets.kinds.product > 0 && facets.kinds.service > 0;
}

export function showsOfferFilter(facets: CatalogFacets): boolean {
  return facets.onOffer > 0 && facets.onOffer < facets.total;
}

/** Items related to one: same category first, then same kind. */
export function relatedItems(items: CatalogItem[], item: CatalogItem, limit = 4): CatalogItem[] {
  const others = items.filter((i) => i.id !== item.id && isPurchasable(i));
  const sameCategory = others.filter((i) => item.categoryId && i.categoryId === item.categoryId);
  const sameKind = others.filter((i) => !sameCategory.includes(i) && i.kind === item.kind);
  return [...sameCategory, ...sameKind].slice(0, limit);
}
