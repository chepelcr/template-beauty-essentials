// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * View models the storefront templates render. The SDK's canonical DTOs
 * (StorefrontProduct, StorefrontCategory…) are turned into these once, in
 * catalog.ts, so every template applies the same data-truth rules: the price
 * shown is the price charged, availability only when inventory is tracked,
 * service fields only when present.
 */
import type { StorefrontProduct } from '@chepelcr/tsuru-storefront-sdk';

/** Programs (a retired product type) are presented as services. */
export type ItemKind = 'product' | 'service';

export type Availability =
  | { state: 'untracked' }
  | { state: 'in_stock'; quantity: number }
  | { state: 'low'; quantity: number }
  | { state: 'sold_out' };

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  kind: ItemKind;
  /** What one unit costs at checkout: the store's sale price when it has one, else the net price. */
  price: number;
  /** The "before" price, on the same basis as `price`; null when the item is not on offer. */
  compareAtPrice: number | null;
  /** Whole percent off, from the data; null when unknown. */
  percentOff: number | null;
  /** True when the item carries an offer flag or a higher reference price. */
  onOffer: boolean;
  /** True when `price` is the store-computed sale price (taxes included). */
  taxIncluded: boolean;
  imageUrl: string | null;
  categoryId: string | null;
  availability: Availability;
  /** Service length as the store wrote it ("2 horas"); null when absent. */
  duration: string | null;
  /** Retired program field, still shown on old rows. */
  difficulty: string | null;
  /** Creation time in ms, for "most recent"; null when unknown. */
  createdAt: number | null;
  /** Accent-folded name + description + category, for search. */
  searchText: string;
  raw: StorefrontProduct;
}

export interface CatalogCategory {
  id: string;
  /** URL key (`?category=`): the slug, or the id when the slug is empty. */
  key: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  secondImageUrl: string | null;
  backgroundColor: string | null;
  buttonColor: string | null;
  sortOrder: number;
}

export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name';

export interface CatalogFilters {
  kind?: ItemKind;
  /** A category key (slug or id). */
  category?: string;
  sale?: boolean;
  q?: string;
  sort?: SortKey;
}

export interface CatalogFacets {
  total: number;
  kinds: Record<ItemKind, number>;
  /** Item count per category id. */
  categories: Map<string, number>;
  onOffer: number;
}

/** One `{icon, title, description}` entry of a list section. */
export interface ContentItem {
  icon: string | null;
  title: string;
  description: string | null;
}
