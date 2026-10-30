// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Interface copy for a template: one dictionary per language, a fallback
 * chain, `{name}` interpolation and plural keys (`key.one` / `key.other`).
 *
 * Only the template's interface labels live here ("Agregar al pedido",
 * "Agotado"…). Store content — titles, descriptions, product names — comes from
 * the CMS and the catalog and is never translated by the template.
 *
 * Adding a language is adding a dictionary. `?lang=xx` switches the language
 * when that dictionary exists (useful for review); `<html lang>` follows.
 */
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';

export type Dictionary = Record<string, string>;

export interface I18nConfig {
  dictionaries: Record<string, Dictionary>;
  /** The language the store speaks by default. */
  defaultLang: string;
  /** Tried in order after the active language, e.g. ['es', 'en']. */
  fallback: string[];
  /** BCP 47 locale for numbers and dates per language (default: the code). */
  locales?: Record<string, string>;
  /**
   * `<html lang>` per interface language (default: the code). Tsuru Ù's
   * interface is Bribri but most of its content is Spanish, so its page is
   * `es` and Bribri labels carry their own `lang` (see `langOf`).
   */
  htmlLang?: Record<string, string>;
}

export type Vars = Record<string, string | number>;

export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : match,
  );
}

/** Pure lookup: the first dictionary in the chain that has the key. */
export function translate(config: I18nConfig, lang: string, key: string, vars?: Vars): string {
  const chain = [lang, ...config.fallback.filter((l) => l !== lang)];
  for (const code of chain) {
    const value = config.dictionaries[code]?.[key];
    if (value !== undefined) return interpolate(value, vars);
  }
  return key;
}

/** The language whose dictionary supplies `key` for `lang` (the fallback's, when missing). */
export function sourceLang(config: I18nConfig, lang: string, key: string): string {
  const chain = [lang, ...config.fallback.filter((l) => l !== lang)];
  return chain.find((code) => config.dictionaries[code]?.[key] !== undefined) ?? lang;
}

export function pluralKey(locale: string, base: string, count: number): string {
  const rule = new Intl.PluralRules(locale).select(count);
  return `${base}.${rule === 'one' ? 'one' : 'other'}`;
}

/** The language for this visit: `?lang=` when that dictionary exists, else the default. */
export function resolveLang(config: I18nConfig, search: string): string {
  const requested = new URLSearchParams(search).get('lang')?.trim().toLowerCase();
  return requested && config.dictionaries[requested] ? requested : config.defaultLang;
}

export interface I18nValue {
  lang: string;
  /** BCP 47 locale for Intl (numbers, dates, plural rules). */
  locale: string;
  /** The page's `<html lang>`. */
  htmlLang: string;
  /** `lang` attribute for a label: its source language when it differs from the page's. */
  langOf: (key: string) => string | undefined;
  t: (key: string, vars?: Vars) => string;
  /** `plural('cart.items', 3)` → the `.one` / `.other` variant with `{count}`. */
  plural: (base: string, count: number, vars?: Vars) => string;
}

export function createI18n(config: I18nConfig) {
  const Context = createContext<I18nValue | null>(null);

  function I18nProvider({ children, lang }: { children: ReactNode; lang?: string }) {
    const active = lang ?? resolveLang(config, typeof window === 'undefined' ? '' : window.location.search);
    const value = useMemo<I18nValue>(() => {
      const locale = config.locales?.[active] ?? active;
      // Intl does not know every code (e.g. 'bzd'); plural rules fall back to Spanish.
      const pluralLocale = Intl.PluralRules.supportedLocalesOf([locale]).length ? locale : 'es';
      const htmlLang = config.htmlLang?.[active] ?? active;
      return {
        lang: active,
        locale,
        htmlLang,
        langOf: (key) => {
          const source = sourceLang(config, active, key);
          return source === htmlLang ? undefined : source;
        },
        t: (key, vars) => translate(config, active, key, vars),
        plural: (base, count, vars) =>
          translate(config, active, pluralKey(pluralLocale, base, count), { count, ...vars }),
      };
    }, [active]);

    useEffect(() => {
      document.documentElement.lang = value.htmlLang;
    }, [value.htmlLang]);

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useI18n(): I18nValue {
    const value = useContext(Context);
    if (!value) throw new Error('useI18n must be used inside I18nProvider');
    return value;
  }

  return { I18nProvider, useI18n, config };
}
