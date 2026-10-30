// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Responsive image attributes (pure). Unsplash URLs (the demo catalogs) get a
 * width-based `srcset`; any other URL — an owner's upload — is used as is.
 */

const UNSPLASH = /^https:\/\/images\.unsplash\.com\//;

export const DEFAULT_WIDTHS = [400, 640, 960, 1280, 1600] as const;

export function withWidth(url: string, width: number): string {
  if (!UNSPLASH.test(url)) return url;
  const u = new URL(url);
  u.searchParams.set('w', String(width));
  if (!u.searchParams.has('auto')) u.searchParams.set('auto', 'format');
  if (!u.searchParams.has('fit')) u.searchParams.set('fit', 'crop');
  if (!u.searchParams.has('q')) u.searchParams.set('q', '75');
  return u.toString();
}

export interface ImageAttributes {
  src: string;
  srcSet?: string;
  sizes?: string;
}

/**
 * `sizes` describes the rendered width, e.g. "(min-width: 1024px) 33vw, 100vw".
 * `maxWidth` caps the largest candidate (a thumbnail never needs 1600 px).
 */
export function imageAttributes(url: string, sizes = '100vw', maxWidth = 1600): ImageAttributes {
  if (!UNSPLASH.test(url)) return { src: url };
  const widths = DEFAULT_WIDTHS.filter((w) => w <= maxWidth);
  const candidates = widths.length ? widths : [maxWidth];
  return {
    src: withWidth(url, candidates[Math.min(1, candidates.length - 1)]),
    srcSet: candidates.map((w) => `${withWidth(url, w)} ${w}w`).join(', '),
    sizes,
  };
}
