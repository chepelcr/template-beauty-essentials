// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * The catalog's state lives in the URL, so filters survive reloads, can be
 * shared and work with the back button:
 *
 *   /products?type=service&category=panes&sale=1&q=pan&sort=price-asc
 *
 * The retired Ofertas/Servicios pages redirect here (see legacy-routes.ts).
 */
import type { CatalogFilters, ItemKind, SortKey } from './types';

const SORTS: readonly SortKey[] = ['featured', 'newest', 'price-asc', 'price-desc', 'name'];

export interface CatalogParams {
  kind: ItemKind | null;
  category: string | null;
  sale: boolean;
  q: string;
  sort: SortKey;
}

export const EMPTY_CATALOG_PARAMS: CatalogParams = {
  kind: null,
  category: null,
  sale: false,
  q: '',
  sort: 'featured',
};

export function parseCatalogParams(search: string): CatalogParams {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const type = params.get('type');
  const sort = params.get('sort') as SortKey | null;
  return {
    kind: type === 'service' || type === 'program' ? 'service' : type === 'product' ? 'product' : null,
    category: params.get('category')?.trim() || null,
    sale: params.get('sale') === '1' || params.get('sale') === 'true',
    q: params.get('q')?.trim() ?? '',
    sort: sort && SORTS.includes(sort) ? sort : 'featured',
  };
}

/** Query string without defaults, in a stable order; '' when nothing is set. */
export function serializeCatalogParams(params: Partial<CatalogParams>): string {
  const out = new URLSearchParams();
  if (params.kind) out.set('type', params.kind);
  if (params.category) out.set('category', params.category);
  if (params.sale) out.set('sale', '1');
  if (params.q?.trim()) out.set('q', params.q.trim());
  if (params.sort && params.sort !== 'featured') out.set('sort', params.sort);
  const s = out.toString();
  return s ? `?${s}` : '';
}

export function catalogHref(params: Partial<CatalogParams> = {}, base = '/products'): string {
  return `${base}${serializeCatalogParams(params)}`;
}

export function toFilters(params: CatalogParams): CatalogFilters {
  return {
    kind: params.kind ?? undefined,
    category: params.category ?? undefined,
    sale: params.sale || undefined,
    q: params.q || undefined,
    sort: params.sort,
  };
}

export function hasActiveFilters(params: CatalogParams): boolean {
  return Boolean(params.kind || params.category || params.sale || params.q);
}
