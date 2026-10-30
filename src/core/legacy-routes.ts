// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Old storefront URLs and where they live now (pure).
 *
 * The standalone Ofertas, Servicios and Programas pages were folded into the
 * catalog, the category pages became a catalog filter, and the beauty
 * template's merchant-pool account pages were removed. Bookmarks, shared links
 * and search results keep working through these redirects.
 */

const exact: Record<string, string> = {
  '/deals': '/products?sale=1',
  '/offers': '/products?sale=1',
  '/sale': '/products?sale=1',
  '/sales': '/products?sale=1',
  '/ofertas': '/products?sale=1',
  '/promociones': '/products?sale=1',
  '/services': '/products?type=service',
  '/servicios': '/products?type=service',
  '/programs': '/products?type=service',
  '/programas': '/products?type=service',
  '/categories': '/products',
  '/categorias': '/products',
  '/catalog': '/products',
  '/catalogo': '/products',
  '/shop': '/products',
  '/tienda': '/products',
  '/productos': '/products',
  '/menu': '/products',
  '/contacto': '/contact',
  '/nosotros': '/about',
  '/acerca': '/about',
  '/login': '/',
  '/register': '/',
  '/signup': '/',
  '/verify-email': '/',
  '/forgot-password': '/',
  '/reset-password': '/',
  '/account': '/',
  '/cuenta': '/',
};

const patterns: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^\/(?:category|categories|categoria|categorias)\/([^/]+)$/, (m) => `/products?category=${encodeURIComponent(decodeURIComponent(m[1]))}`],
  [/^\/(?:product|producto|productos|services|servicios|programs|programas|deals|ofertas)\/([^/]+)$/, (m) => `/products/${m[1]}`],
];

/** Where an old path lives now, or null when it is not an old path. */
export function legacyRedirect(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const lower = path.toLowerCase();
  if (exact[lower]) return exact[lower];
  for (const [pattern, to] of patterns) {
    const match = path.match(pattern);
    if (match) return to(match);
  }
  return null;
}
