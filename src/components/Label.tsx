import { glossFor, useI18n } from '@/i18n';

/**
 * An interface label in the store's language. A Bribri label is marked
 * `lang="bzd"` and, with `gloss`, carries its Spanish meaning underneath.
 */
export function Label({ k, gloss = false, className }: { k: string; gloss?: boolean; className?: string }) {
  const { t, lang, langOf } = useI18n();
  const meaning = gloss ? glossFor(lang, k) : null;
  return (
    <span className={className}>
      <span lang={langOf(k)}>{t(k)}</span>
      {meaning && <span className="gloss">{meaning}</span>}
    </span>
  );
}
