// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * The one storefront client per store, plus the paged reads the SDK does not
 * do yet (it requests a single page and does not filter inactive products —
 * a known SDK gap, tracked in the roadmap).
 */
import {
  configureStorefrontAmplify,
  createStorefrontClient,
  normalizeCategory,
  normalizeProduct,
  signedFetch,
  unwrapList,
  type StorefrontCategory,
  type StorefrontClient,
  type StorefrontConfig,
  type StorefrontProduct,
} from '@chepelcr/tsuru-storefront-sdk';
import { env } from './env';

export class StorefrontApiError extends Error {
  constructor(public readonly status: number, public readonly path: string) {
    super(`Storefront API ${status} for ${path}`);
    this.name = 'StorefrontApiError';
  }
}

let authReady = false;

/** Guest (anonymous) credentials for the SigV4-signed public API. Idempotent. */
export function initStorefrontAuth(): void {
  if (authReady) return;
  configureStorefrontAmplify({ identityPoolId: env.identityPoolId, region: env.region });
  authReady = true;
}

const clients = new Map<string, StorefrontClient>();

export function storefrontClient(config: StorefrontConfig): StorefrontClient {
  const key = `${config.mode}:${config.mode === 'demo' ? config.templateId : config.orgId}`;
  let client = clients.get(key);
  if (!client) {
    client = createStorefrontClient({ config, host: env.apiHost, region: env.region });
    clients.set(key, client);
  }
  return client;
}

let locations: StorefrontClient | null = null;

/** Costa Rica location catalogs are global, not per store. */
export function locationsClient(): StorefrontClient {
  locations ??= createStorefrontClient({ config: { mode: 'prod' }, host: env.locationsHost, region: env.region });
  return locations;
}

export async function signedGetJson<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(env.apiHost + path);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const res = await signedFetch(url.toString(), env.region);
  if (!res.ok) throw new StorefrontApiError(res.status, path);
  return (await res.json()) as T;
}

interface Paged<T> {
  data?: T[];
  pagination?: { total_pages?: number; totalPages?: number };
}

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

async function readAllPages<T>(path: string, params: Record<string, string> = {}): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await signedGetJson<Paged<T> | T[]>(path, { ...params, page, page_size: PAGE_SIZE });
    const batch = unwrapList(res) as T[];
    rows.push(...batch);
    const totalPages = Array.isArray(res) ? 1 : res.pagination?.total_pages ?? res.pagination?.totalPages;
    if (batch.length < PAGE_SIZE || (totalPages !== undefined && page >= totalPages)) break;
  }
  return rows;
}

/** Every active product of a live store (store-be, `search=status:1`). */
export async function fetchLiveProducts(orgId: string): Promise<StorefrontProduct[]> {
  const rows = await readAllPages<Record<string, unknown>>(`/api/organizations/${orgId}/products`, { search: 'status:1' });
  return rows.map(normalizeProduct);
}

/** Every category of a live store; inactive ones are dropped by catalog.ts. */
export async function fetchLiveCategories(orgId: string): Promise<StorefrontCategory[]> {
  const rows = await readAllPages<Record<string, unknown>>(`/api/organizations/${orgId}/categories`);
  return rows.map(normalizeCategory);
}

/** A demo template's shipping flags (management-be). */
export function fetchTemplateShipping(templateId: string): Promise<Record<string, unknown>> {
  return signedGetJson<Record<string, unknown>>(`/api/templates/${templateId}/shipping`);
}
