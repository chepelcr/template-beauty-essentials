// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Data hooks every template uses. One query loads the whole catalog (products,
 * services and categories); pages filter it client-side, so the catalog,
 * the home highlights and the category navigation always agree.
 */
import { useEffect } from 'react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { prepareCatalog, prepareCategories } from './catalog';
import { deliveryMethodsFromShipping, LIVE_DELIVERY_METHODS, type DeliveryMethod } from './checkout';
import { parseCmsPage, type CmsPage, type ContractPage } from './cms';
import { fetchLiveCategories, fetchLiveProducts, fetchTemplateShipping } from './sdk';
import { useStore, useStoreName } from './store-context';
import { updatePageMetadata } from './metadata';
import type { CatalogCategory, CatalogItem } from './types';

const MINUTE = 60 * 1000;

export function createStoreQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5 * MINUTE, retry: 1, refetchOnWindowFocus: false },
    },
  });
}

const isNotFound = (error: unknown): boolean => error instanceof Error && /\b404\b/.test(error.message);

export interface CatalogState {
  items: CatalogItem[];
  categories: CatalogCategory[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useCatalog(): CatalogState {
  const { config, client } = useStore();
  const id = config?.mode === 'demo' ? config.templateId : config?.orgId;
  const query = useQuery({
    queryKey: ['catalog', config?.mode, id],
    enabled: Boolean(client && id),
    staleTime: 2 * MINUTE,
    queryFn: async () => {
      const [products, categories] =
        config!.mode === 'demo'
          ? await Promise.all([client!.getProducts(), client!.getCategories()])
          : await Promise.all([fetchLiveProducts(id!), fetchLiveCategories(id!)]);
      const prepared = prepareCategories(categories);
      return { categories: prepared, items: prepareCatalog(products, prepared) };
    },
  });
  return {
    items: query.data?.items ?? [],
    categories: query.data?.categories ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}

export function useCatalogItem(id: string | undefined): { item: CatalogItem | null; catalog: CatalogState } {
  const catalog = useCatalog();
  return { item: catalog.items.find((i) => i.id === id) ?? null, catalog };
}

export interface CmsPageState {
  page: CmsPage | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useCmsPage(slug: ContractPage): CmsPageState {
  const { config, client } = useStore();
  const id = config?.mode === 'demo' ? config.templateId : config?.orgId;
  const query = useQuery({
    queryKey: ['cms', config?.mode, id, slug],
    enabled: Boolean(client && id),
    queryFn: async () => {
      try {
        return parseCmsPage(await client!.getPage(slug));
      } catch (error) {
        // A page the store never created is not an error: its blocks hide.
        if (isNotFound(error)) return null;
        throw error;
      }
    },
  });
  return {
    page: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}

export function useDeliveryMethods(): DeliveryMethod[] {
  const { config } = useStore();
  const isDemo = config?.mode === 'demo';
  const query = useQuery({
    queryKey: ['delivery', config?.templateId],
    enabled: Boolean(isDemo && config?.templateId),
    staleTime: 60 * MINUTE,
    queryFn: () => fetchTemplateShipping(config!.templateId!),
  });
  if (!isDemo) return [...LIVE_DELIVERY_METHODS];
  return query.data ? deliveryMethodsFromShipping(query.data) : [...LIVE_DELIVERY_METHODS];
}

/** Keep the page title and share preview consistent with the current store. */
export function usePageMeta(title: string | null | undefined, description?: string | null): void {
  const { organization } = useStore();
  const storeName = useStoreName();
  const [location] = useLocation();
  const storeDescription = organization?.description;
  useEffect(() => {
    updatePageMetadata(document, { title, description, storeName, storeDescription });
  }, [title, description, storeName, storeDescription, location]);
}
