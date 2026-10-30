// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Routing shared by every template (wouter): view-transition navigation,
 * redirects for retired URLs, and the catalog's URL state.
 *
 * Every template has the same routes: /, /products, /products/:id, /about,
 * /contact and a 404. Old links (Ofertas, Servicios, Programas, categories,
 * account pages) resolve through `LegacyOrNotFound`.
 */
import { useCallback, useLayoutEffect, useMemo, type ComponentType, type ReactNode } from 'react';
import { Redirect, Router, useLocation, useSearch } from 'wouter';
import { catalogHref, parseCatalogParams, type CatalogParams } from './catalog-params';
import { legacyRedirect } from './legacy-routes';
import { prefersReducedMotion, viewTransitionNav } from './motion';

export function StoreRouter({ children }: { children: ReactNode }) {
  // Read a `?motion=reduce` override before the first paint, so templates whose
  // motion is CSS only honour it too (core.css keys off `html[data-motion]`).
  useLayoutEffect(() => {
    prefersReducedMotion();
  }, []);
  return <Router aroundNav={viewTransitionNav}>{children}</Router>;
}

/** The catch-all route: an old URL redirects, anything else is a 404. */
export function LegacyOrNotFound({ notFound: NotFound }: { notFound: ComponentType }) {
  const [location] = useLocation();
  const to = legacyRedirect(location);
  return to ? <Redirect to={to} replace /> : <NotFound />;
}

export type SetCatalogParams = (next: Partial<CatalogParams>, options?: { replace?: boolean }) => void;

/** The catalog filters, read from and written to the URL. */
export function useCatalogParams(): [CatalogParams, SetCatalogParams] {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = useMemo(() => parseCatalogParams(search), [search]);
  const set = useCallback<SetCatalogParams>(
    (next, options) => {
      navigate(catalogHref({ ...params, ...next }), { replace: options?.replace ?? false, transition: false });
    },
    [navigate, params],
  );
  return [params, set];
}
