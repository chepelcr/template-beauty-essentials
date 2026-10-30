// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * The shared storefront content contract (docs/storefront/
 * STOREFRONT_CONTENT_CONTRACT.md), read from a CMS page response.
 *
 * Every template reads the same keys. A missing or empty key is `null` and the
 * template hides that element — copy never falls back to text in code, so what
 * the store shows is always what the owner (or the template's data) wrote.
 * Inactive sections are skipped. Pure; no React.
 */
import type { ContentItem } from './types';

export type ContractPage = 'home' | 'about' | 'products' | 'contact';

type ContentMap = Map<string, Map<string, { value: string; type: string }>>;

export interface CmsPage {
  slug: string;
  title: string | null;
  metaDescription: string | null;
  sections: ContentMap;
}

const pick = (o: Record<string, unknown>, ...keys: string[]): unknown => {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
};

const order = (o: Record<string, unknown>): number => Number(pick(o, 'sort_order', 'sortOrder') ?? 0);

/** Parse a page from the API (snake_case, or camelCase from older responses). */
export function parseCmsPage(input: unknown): CmsPage | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  if (pick(raw, 'is_active', 'isActive') === false) return null;

  const sections: ContentMap = new Map();
  const rawSections = Array.isArray(raw.sections) ? (raw.sections as Record<string, unknown>[]) : [];
  for (const section of [...rawSections].sort((a, b) => order(a) - order(b))) {
    if (pick(section, 'is_active', 'isActive') === false) continue;
    const type = String(pick(section, 'section_type', 'sectionType') ?? '');
    if (!type || sections.has(type)) continue;
    const values = new Map<string, { value: string; type: string }>();
    const content = Array.isArray(section.content) ? (section.content as Record<string, unknown>[]) : [];
    for (const item of [...content].sort((a, b) => order(a) - order(b))) {
      const key = String(item.key ?? '');
      if (!key || values.has(key)) continue;
      values.set(key, {
        value: typeof item.value === 'string' ? item.value : item.value == null ? '' : String(item.value),
        type: String(pick(item, 'value_type', 'valueType') ?? 'text'),
      });
    }
    sections.set(type, values);
  }

  return {
    slug: String(raw.slug ?? ''),
    title: clean(pick(raw, 'title')),
    metaDescription: clean(pick(raw, 'meta_description', 'metaDescription')),
    sections,
  };
}

function clean(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function cmsText(page: CmsPage | null | undefined, section: string, key: string): string | null {
  return clean(page?.sections.get(section)?.get(key)?.value);
}

/** An http(s) image URL, or null. */
export function cmsImage(page: CmsPage | null | undefined, section: string, key: string): string | null {
  const value = cmsText(page, section, key);
  return value && /^https?:\/\//i.test(value) ? value : null;
}

/** A JSON list of `{icon, title, description}`; entries without a title are dropped. */
export function cmsItems(page: CmsPage | null | undefined, section: string, key = 'items'): ContentItem[] {
  const value = cmsText(page, section, key);
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        const e = (entry ?? {}) as Record<string, unknown>;
        return {
          icon: clean(e.icon),
          title: clean(e.title) ?? '',
          description: clean(e.description),
        };
      })
      .filter((e) => e.title);
  } catch {
    return [];
  }
}

/**
 * A CMS icon ("MessageCircle", "Building2") as the kebab-case name Lucide's
 * dynamic loader expects ("message-circle", "building-2"); null when empty.
 */
export function lucideName(icon: string | null | undefined): string | null {
  const name = icon?.trim();
  if (!name || /^https?:/i.test(name)) return null;
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Za-z])(\d)/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/** "Uno.\nDos." → ["Uno.", "Dos."] */
export function paragraphs(text: string | null | undefined): string[] {
  return (text ?? '').split(/\n+/).map((p) => p.trim()).filter(Boolean);
}

export interface HomeContent {
  hero: {
    badge: string | null;
    title: string | null;
    subtitle: string | null;
    ctaPrimary: string | null;
    ctaSecondary: string | null;
    image: string | null;
  };
  benefits: ContentItem[];
  categories: { title: string | null; subtitle: string | null };
  featured: { badge: string | null; title: string | null; subtitle: string | null };
  story: { title: string | null; content: string | null; image: string | null };
  cta: { title: string | null; description: string | null; buttonText: string | null };
}

export function homeContent(page: CmsPage | null | undefined): HomeContent {
  return {
    hero: {
      badge: cmsText(page, 'hero', 'badge'),
      title: cmsText(page, 'hero', 'title'),
      subtitle: cmsText(page, 'hero', 'subtitle'),
      ctaPrimary: cmsText(page, 'hero', 'ctaPrimary'),
      ctaSecondary: cmsText(page, 'hero', 'ctaSecondary'),
      image: cmsImage(page, 'hero', 'image'),
    },
    benefits: cmsItems(page, 'benefits'),
    categories: { title: cmsText(page, 'categories', 'title'), subtitle: cmsText(page, 'categories', 'subtitle') },
    featured: {
      badge: cmsText(page, 'featured', 'badge'),
      title: cmsText(page, 'featured', 'title'),
      subtitle: cmsText(page, 'featured', 'subtitle'),
    },
    story: {
      title: cmsText(page, 'story', 'title'),
      content: cmsText(page, 'story', 'content'),
      image: cmsImage(page, 'story', 'image'),
    },
    cta: {
      title: cmsText(page, 'cta', 'title'),
      description: cmsText(page, 'cta', 'description'),
      buttonText: cmsText(page, 'cta', 'buttonText'),
    },
  };
}

export interface AboutContent {
  hero: { title: string | null; subtitle: string | null; image: string | null };
  story: { title: string | null; content: string | null; image: string | null };
  values: { title: string | null; items: ContentItem[] };
}

export function aboutContent(page: CmsPage | null | undefined): AboutContent {
  return {
    hero: {
      title: cmsText(page, 'hero', 'title'),
      subtitle: cmsText(page, 'hero', 'subtitle'),
      image: cmsImage(page, 'hero', 'image'),
    },
    story: {
      title: cmsText(page, 'story', 'title'),
      content: cmsText(page, 'story', 'content'),
      image: cmsImage(page, 'story', 'image'),
    },
    values: { title: cmsText(page, 'values', 'title'), items: cmsItems(page, 'values') },
  };
}

export interface ProductsContent {
  hero: { title: string | null; subtitle: string | null };
}

export function productsContent(page: CmsPage | null | undefined): ProductsContent {
  return { hero: { title: cmsText(page, 'hero', 'title'), subtitle: cmsText(page, 'hero', 'subtitle') } };
}

export interface ContactContent {
  hero: { title: string | null; subtitle: string | null };
  visit: { title: string | null; note: string | null };
}

export function contactContent(page: CmsPage | null | undefined): ContactContent {
  return {
    hero: { title: cmsText(page, 'hero', 'title'), subtitle: cmsText(page, 'hero', 'subtitle') },
    visit: { title: cmsText(page, 'visit', 'title'), note: cmsText(page, 'visit', 'note') },
  };
}
