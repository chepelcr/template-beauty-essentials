import { Clock } from 'lucide-react';
import type { CatalogItem } from '@/core';
import { useI18n } from '@/i18n';

/** Stock only when the store tracks it; a service's duration when it has one. */
export function Availability({ item, showDuration = true }: { item: CatalogItem; showDuration?: boolean }) {
  const { t, plural } = useI18n();
  const a = item.availability;
  return (
    <>
      {a.state === 'sold_out' && <span className="text-sm font-semibold text-offer">{t('product.soldOut')}</span>}
      {a.state === 'low' && <span className="text-sm font-medium text-offer">{plural('product.low', a.quantity)}</span>}
      {showDuration && item.duration && (
        <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
          <Clock aria-hidden="true" className="h-4 w-4" />
          {t('product.duration', { duration: item.duration })}
        </span>
      )}
    </>
  );
}
