// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Build-time configuration (Vite env) with the public defaults the template
 * workflows use. Nothing here is secret: the guest identity pool and the API
 * hosts are shipped to every visitor.
 *
 * Local development against a local management-be: run the dev server with
 * `TSURU_DEV_API=http://localhost:5000` (vite.config.ts proxies /api there) and
 * `VITE_PUBLIC_API_URL=http://localhost:<dev port>`. Location catalogs keep
 * using the public API (`VITE_LOCATIONS_API_URL` overrides it).
 */

type ViteEnv = Record<string, string | boolean | undefined>;

const viteEnv: ViteEnv = ((import.meta as unknown as { env?: ViteEnv }).env) ?? {};

const read = (key: string): string | undefined => {
  const value = viteEnv[key];
  return typeof value === 'string' && value.trim() ? value.trim().replace(/\/$/, '') : undefined;
};

export const DEFAULT_PUBLIC_API = 'https://public-api.tsuru.jcampos.dev';
const DEFAULT_IDENTITY_POOL = 'us-east-1:be94bc45-883e-44ff-9eb7-3e58c23ea9e8';

export const env = {
  region: read('VITE_AWS_REGION') ?? 'us-east-1',
  identityPoolId: read('VITE_IDENTITY_POOL_ID') ?? DEFAULT_IDENTITY_POOL,
  /** Content and catalog reads; the SDK default when unset. */
  apiHost: read('VITE_PUBLIC_API_URL') ?? DEFAULT_PUBLIC_API,
  /** Costa Rica location catalogs (data-be). */
  locationsHost: read('VITE_LOCATIONS_API_URL') ?? read('VITE_PUBLIC_API_URL') ?? DEFAULT_PUBLIC_API,
  dev: viteEnv.DEV === true,
};
