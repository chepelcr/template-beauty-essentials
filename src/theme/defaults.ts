import type { ThemeDefaults } from '@/core';

/** The template's own accent and surfaces; the store's branding overrides the accent. */
export const themeDefaults: ThemeDefaults = {
  brand: '#A3122B',
  brand2: '#F2D4D8',
  surface: '#FBF8F6',
  // Raised cards are the least favorable reading surface in dark mode.
  darkSurface: '#2F2228',
  displayFont: '"Syne", "Noto Sans", -apple-system, "Segoe UI", Roboto, sans-serif',
  bundledFonts: ['Syne', 'Hanken Grotesk'],
  displayFallback: '-apple-system, "Segoe UI", Roboto, sans-serif',
};
