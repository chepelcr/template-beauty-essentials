import { useRoute } from 'wouter';
import type { StorefrontProduct } from '@chepelcr/tsuru-storefront-sdk';
import { useProducts } from '@/hooks/useContent';

/** The store's live product for the current /products/:id page (null while loading or unknown). */
export function useRouteProduct(): StorefrontProduct | null {
  const [, params] = useRoute('/products/:id');
  const { data: products = [] } = useProducts();
  return products.find((p) => p.id === params?.id) ?? null;
}
