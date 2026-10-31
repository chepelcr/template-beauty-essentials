// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * The store a template is showing: its config (/config.json), identity,
 * branding and contact. Demo builds show the template's own data; live
 * buckets show the organization's.
 *
 * Only the identity is required to render. Branding and contact failures are
 * not fatal: the template's defaults apply and contact blocks hide.
 */
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  loadStorefrontConfig,
  type StorefrontClient,
  type StorefrontConfig,
  type StorefrontContact,
  type StorefrontOrganization,
  type StorefrontTheme,
} from '@chepelcr/tsuru-storefront-sdk';
import { storefrontClient } from './sdk';
import { applyTheme, setFavicon, type ThemeDefaults } from './theme-bridge';
import { useColorScheme } from './appearance';
import { readStorefrontMetadataSeed, resolveStoreName } from './metadata';

export type StoreStatus = 'loading' | 'ready' | 'unconfigured' | 'error';

export interface StoreValue {
  status: StoreStatus;
  config: StorefrontConfig | null;
  isDemo: boolean;
  client: StorefrontClient | null;
  organization: StorefrontOrganization | null;
  theme: StorefrontTheme | null;
  contact: StorefrontContact | null;
  error: unknown;
  retry: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const HOUR = 60 * 60 * 1000;

export function StoreProvider({
  children,
  theme: defaults,
  configUrl = '/config.json',
}: {
  children: ReactNode;
  theme: ThemeDefaults;
  configUrl?: string;
}) {
  const { scheme } = useColorScheme();
  const configQuery = useQuery({
    queryKey: ['store-config', configUrl],
    queryFn: () => loadStorefrontConfig(configUrl),
    staleTime: Infinity,
    retry: 1,
  });
  const config = configQuery.data ?? null;
  const client = useMemo(() => (config ? storefrontClient(config) : null), [config]);
  const key = config ? [config.mode, config.mode === 'demo' ? config.templateId : config.orgId] : ['none'];

  const orgQuery = useQuery({
    queryKey: ['store', ...key, 'organization'],
    queryFn: () => client!.getOrganization(),
    enabled: Boolean(client),
    staleTime: HOUR,
  });
  const themeQuery = useQuery({
    queryKey: ['store', ...key, 'theme'],
    queryFn: () => client!.getTheme(),
    enabled: Boolean(client),
    staleTime: HOUR,
  });
  const contactQuery = useQuery({
    queryKey: ['store', ...key, 'contact'],
    queryFn: () => client!.getContact(),
    enabled: Boolean(client),
    staleTime: HOUR,
  });

  const theme = themeQuery.data ?? null;
  const organization = orgQuery.data ?? null;

  useLayoutEffect(() => {
    applyTheme(theme, defaults, scheme);
  }, [theme, defaults, scheme]);

  useEffect(() => {
    setFavicon(theme?.faviconUrl ?? theme?.logoUrl ?? organization?.logoUrl);
  }, [theme, organization]);

  let status: StoreStatus = 'loading';
  if (configQuery.isError) status = 'error';
  else if (configQuery.isSuccess && !config) status = 'unconfigured';
  else if (orgQuery.isError) status = 'error';
  else if (organization) status = 'ready';

  const value: StoreValue = {
    status,
    config,
    isDemo: config?.mode === 'demo',
    client,
    organization,
    theme,
    contact: contactQuery.data ?? null,
    error: configQuery.error ?? orgQuery.error ?? null,
    retry: () => {
      if (configQuery.isError) void configQuery.refetch();
      void orgQuery.refetch();
      void themeQuery.refetch();
      void contactQuery.refetch();
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside StoreProvider');
  return value;
}

export const useIsDemo = (): boolean => useStore().isDemo;

/** Keep the publisher's real store identity visible while its API request loads. */
export function useStoreName(): string {
  const { organization } = useStore();
  const seed = typeof document === 'undefined' ? '' : readStorefrontMetadataSeed(document).storeName;
  return resolveStoreName(organization?.name, seed);
}
