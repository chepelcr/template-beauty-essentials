import { baseEn, baseEs, createI18n } from '@/core';
import { en } from './en';
import { es } from './es';

export const { I18nProvider, useI18n } = createI18n({
  dictionaries: { es: { ...baseEs, ...es }, en: { ...baseEn, ...en } },
  defaultLang: 'es',
  fallback: ['es', 'en'],
  locales: { es: 'es-CR', en: 'en-US' },
});

/** Only Tsuru Ù carries Bribri glosses; other templates have none. */
export function glossFor(_lang: string, _key: string): string | null {
  return null;
}
