// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Colour helpers for the theme bridge (pure). WCAG 2.x relative luminance
 * and contrast ratio; adjustments move toward black or white until the pair
 * reaches the requested ratio.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function parseHex(input: string | null | undefined): Rgb | null {
  if (!input) return null;
  const hex = input.trim().replace(/^#/, '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function toHex({ r, g, b }: Rgb): string {
  const h = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return 1;
  const la = relativeLuminance(ca);
  const lb = relativeLuminance(cb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function mix(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return a;
  return toHex({ r: ca.r + (cb.r - ca.r) * t, g: ca.g + (cb.g - ca.g) * t, b: ca.b + (cb.b - ca.b) * t });
}

/** The readable text colour on `background`: whichever of the two contrasts more. */
export function onColor(background: string, light = '#FFFFFF', dark = '#14110F'): string {
  return contrastRatio(background, light) >= contrastRatio(background, dark) ? light : dark;
}

/**
 * `color` itself when it reaches `min` against `background`; otherwise the
 * closest shade (darkened or lightened) that does.
 */
export function ensureContrast(color: string, background: string, min = 4.5): string {
  if (!parseHex(color) || !parseHex(background)) return color;
  if (contrastRatio(color, background) >= min) return color.toUpperCase();
  const bgLum = relativeLuminance(parseHex(background)!);
  const target = bgLum > 0.4 ? '#000000' : '#FFFFFF';
  for (let step = 1; step <= 20; step += 1) {
    const candidate = mix(color, target, step / 20);
    if (contrastRatio(candidate, background) >= min) return candidate;
  }
  return target;
}
