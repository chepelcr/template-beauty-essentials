/**
 * Storefront API — thin adapter over @chepelcr/tsuru-storefront-sdk.
 *
 * The SDK owns the contract: guest SigV4 signing, demo-vs-live URL resolution,
 * and response normalization. This module only maps the template's existing
 * `getApiClient(mode, id)` surface onto the SDK so the hooks stay unchanged.
 */
import {
  createStorefrontClient,
  type StorefrontConfig,
} from '@chepelcr/tsuru-storefront-sdk';

const REGION = (import.meta.env.VITE_AWS_REGION as string | undefined) ?? 'us-east-1';
// Optional host override; the SDK defaults to https://public-api.tsuru.jcampos.dev
const HOST = import.meta.env.VITE_PUBLIC_API_URL as string | undefined;

function toConfig(mode: string, id: string): StorefrontConfig {
  return mode === 'demo'
    ? { mode: 'demo', templateId: id }
    : { mode: 'prod', orgId: id };
}

/** Create an API client for the given mode ('demo' | 'prod') and id (templateId | orgId). */
export function getApiClient(mode: string, id: string) {
  const client = createStorefrontClient({ config: toConfig(mode, id), host: HOST, region: REGION });
  return {
    getTheme: () => client.getTheme(),
    getContact: () => client.getContact(),
    getCategories: () => client.getCategories(),
    getPages: () => client.getPages(),
    getProducts: (filters?: Record<string, any>) => client.getProducts(filters),
    getPage: (slug: string) => client.getPage(slug),
  };
}

// Legacy export retained for backward compatibility.
export const api = {
  getTheme: () => { throw new Error('Use getApiClient instead'); },
  getContact: () => { throw new Error('Use getApiClient instead'); },
  getCategories: () => { throw new Error('Use getApiClient instead'); },
  getPages: () => { throw new Error('Use getApiClient instead'); },
  getProducts: () => { throw new Error('Use getApiClient instead'); },
};
