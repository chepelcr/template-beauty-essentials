// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/** Identity and social metadata seeded by the storefront publisher. */
export interface StorefrontMetadataSeed {
  storeName: string;
  description: string;
  image: string | null;
  imageAlt: string;
}

export interface PageMetadataInput {
  title?: string | null;
  description?: string | null;
  storeName: string;
  storeDescription?: string | null;
}

export interface PageMetadata extends StorefrontMetadataSeed {
  title: string;
  url: string;
}

const seeds = new WeakMap<Document, StorefrontMetadataSeed>();
const clean = (value: string | null | undefined): string => value?.trim() ?? '';

/** Only publisher-owned images can stand in for a live store's social banner. */
function socialImage(value: string, location: string): string | null {
  try {
    const page = new URL(location);
    const image = new URL(value, page.origin);
    return image.origin === page.origin
      && /^\/social-preview-[a-f0-9]{8,64}\.png$/i.test(image.pathname)
      && !image.search && !image.hash
      ? image.href
      : null;
  } catch {
    return null;
  }
}

/** Capture once, before route effects replace the public metadata in <head>. */
export function readStorefrontMetadataSeed(doc: Document): StorefrontMetadataSeed {
  const cached = seeds.get(doc);
  if (cached) return cached;
  const meta = (selector: string): string => clean(doc.querySelector<HTMLMetaElement>(selector)?.content);
  const trusted = meta('meta[name="tsuru:storefront"]') === 'remastered-v1';
  const seed: StorefrontMetadataSeed = {
    storeName: trusted ? meta('meta[property="og:site_name"]') : '',
    description: trusted ? meta('meta[name="tsuru:store-description"]') : '',
    image: trusted ? socialImage(meta('meta[property="og:image"]'), doc.location.href) : null,
    imageAlt: trusted ? meta('meta[property="og:image:alt"]') : '',
  };
  seeds.set(doc, seed);
  return seed;
}

export function resolveStoreName(name: string | null | undefined, seededName = ''): string {
  return clean(name) || clean(seededName);
}

export function buildPageMetadata(input: PageMetadataInput, seed: StorefrontMetadataSeed, location: string): PageMetadata {
  const storeName = resolveStoreName(input.storeName, seed.storeName);
  const pageTitle = clean(input.title);
  const page = new URL(location);
  const isHome = page.pathname === '/';
  const includesName = pageTitle.split(/\s+[·|]\s+/).some((part) => part.toLocaleLowerCase() === storeName.toLocaleLowerCase());
  const title = isHome && storeName ? storeName : !pageTitle ? storeName : !storeName || includesName ? pageTitle : `${pageTitle} · ${storeName}`;
  return {
    storeName,
    title,
    description: isHome
      ? clean(input.storeDescription) || seed.description || storeName
      : clean(input.description) || clean(input.storeDescription) || seed.description,
    url: page.origin + page.pathname,
    image: seed.image,
    imageAlt: storeName || seed.imageAlt,
  };
}

/** Update or clear every route-owned tag; never keep a previous product's text. */
export function updatePageMetadata(doc: Document, input: PageMetadataInput): void {
  const metadata = buildPageMetadata(input, readStorefrontMetadataSeed(doc), doc.location.href);
  const meta = (attribute: 'name' | 'property', key: string, value: string | null): void => {
    const matches = Array.from(doc.querySelectorAll<HTMLMetaElement>(`meta[${attribute}="${key}"]`));
    const [existing, ...duplicates] = matches;
    duplicates.forEach((duplicate) => duplicate.remove());
    if (!value) {
      existing?.remove();
      return;
    }
    const element = existing ?? doc.createElement('meta');
    element.setAttribute(attribute, key);
    element.content = value;
    if (!existing) doc.head.appendChild(element);
  };

  doc.title = metadata.title;
  meta('name', 'description', metadata.description);
  meta('property', 'og:title', metadata.title);
  meta('property', 'og:site_name', metadata.storeName);
  meta('property', 'og:description', metadata.description);
  meta('property', 'og:type', 'website');
  meta('property', 'og:url', metadata.url);
  meta('property', 'og:image', metadata.image);
  meta('property', 'og:image:alt', metadata.image ? metadata.imageAlt : null);
  meta('name', 'twitter:card', 'summary_large_image');
  meta('name', 'twitter:title', metadata.title);
  meta('name', 'twitter:description', metadata.description);
  meta('name', 'twitter:image', metadata.image);
  meta('name', 'twitter:image:alt', metadata.image ? metadata.imageAlt : null);

  const links = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'));
  const [existing, ...duplicates] = links;
  duplicates.forEach((duplicate) => duplicate.remove());
  const canonical = existing ?? doc.createElement('link');
  canonical.rel = 'canonical';
  canonical.href = metadata.url;
  if (!existing) doc.head.appendChild(canonical);
}
