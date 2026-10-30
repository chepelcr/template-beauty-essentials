// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * The organization's branding, applied on top of a template's design.
 *
 * A template owns its surfaces, ink and art; the store owns its accent. The
 * org's primary colour becomes `--brand` (buttons, highlights) and its
 * secondary `--brand-2`, each with a readable `-ink` colour for text on top.
 * `--brand-text` is the accent guarded to 4.5:1 against the template's
 * reading surface, for links and prices. The org's font replaces the display
 * face only; body text stays the template's.
 */
import type { StorefrontTheme } from '@chepelcr/tsuru-storefront-sdk';
import { ensureContrast, onColor, parseHex } from './color';
import type { ColorScheme } from './appearance';

export interface ThemeDefaults {
  brand: string;
  brand2: string;
  /** The main reading surface, to guard `--brand-text`. */
  surface: string;
  /** The dark reading surface, used to keep store accents readable at night. */
  darkSurface?: string;
  /** The template's display family as CSS (e.g. `"Fraunces", Georgia, serif`). */
  displayFont: string;
  /** Families the template already loads; others come from Google Fonts. */
  bundledFonts: string[];
  /** Generic fallback appended to an org font (e.g. `serif`). */
  displayFallback?: string;
}

const validColor = (value: string | null | undefined): string | null =>
  parseHex(value) ? value!.trim().toUpperCase() : null;

/** Font names the POS can store; anything else is ignored. */
export function safeFontFamily(value: string | null | undefined): string | null {
  const name = value?.trim();
  return name && /^[A-Za-z0-9][A-Za-z0-9 ]{1,39}$/.test(name) ? name : null;
}

export function googleFontHref(family: string): string {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@400;500;600;700&display=swap`;
}

export function themeVariables(theme: StorefrontTheme | null, defaults: ThemeDefaults, scheme: ColorScheme = 'light'): Record<string, string> {
  const brand = validColor(theme?.primaryColor) ?? defaults.brand;
  const brand2 = validColor(theme?.secondaryColor) ?? defaults.brand2;
  const vars: Record<string, string> = {
    '--brand': brand,
    '--brand-ink': onColor(brand),
    '--brand-text': ensureContrast(brand, scheme === 'dark' ? defaults.darkSurface ?? defaults.surface : defaults.surface, 4.5),
    '--brand-2': brand2,
    '--brand-2-ink': onColor(brand2),
  };
  const font = safeFontFamily(theme?.fontFamily);
  vars['--font-display'] = font && !defaults.bundledFonts.includes(font)
    ? `"${font}", ${defaults.displayFallback ?? 'system-ui, sans-serif'}`
    : defaults.displayFont;
  return vars;
}

const FONT_LINK_ID = 'tsuru-org-font';

export function applyTheme(theme: StorefrontTheme | null, defaults: ThemeDefaults, scheme: ColorScheme = 'light'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const [name, value] of Object.entries(themeVariables(theme, defaults, scheme))) {
    root.style.setProperty(name, value);
  }
  const font = safeFontFamily(theme?.fontFamily);
  const existing = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (font && !defaults.bundledFonts.includes(font)) {
    const href = googleFontHref(font);
    if (existing?.href !== href) {
      const link = existing ?? document.createElement('link');
      link.id = FONT_LINK_ID;
      link.rel = 'stylesheet';
      link.href = href;
      if (!existing) document.head.appendChild(link);
    }
  } else {
    existing?.remove();
  }
}

export function setFavicon(url: string | null | undefined): void {
  if (!url || typeof document === 'undefined') return;
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.removeAttribute('type');
  link.href = url;
}
