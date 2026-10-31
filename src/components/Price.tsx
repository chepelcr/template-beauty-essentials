import { formatPrice, type CatalogItem } from '@/core';
import { useI18n } from '@/i18n';

/** The price charged, with the reference price and percentage only when the data has them. */
export function Price({ item, size = 'md' }: { item: CatalogItem; size?: 'md' | 'lg' }) {
  const { t } = useI18n();
  const big = size === 'lg';
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={`price-tag ${big ? 'text-3xl' : 'text-lg'}`}>{formatPrice(item.price)}</span>
      {item.compareAtPrice !== null && (
        <span className={`text-offer ${big ? 'text-base' : 'text-sm'}`}>
          <span className="sr-only">{t('product.before', { price: formatPrice(item.compareAtPrice) })}</span>
          <s aria-hidden="true">{formatPrice(item.compareAtPrice)}</s>
        </span>
      )}
      {item.percentOff !== null && (
        <span className="rounded-full bg-offer px-2 py-0.5 text-xs font-semibold text-[color:var(--offer-ink,#fff)]">
          {t('product.percentOff', { percent: item.percentOff })}
        </span>
      )}
      {item.percentOff === null && item.onOffer && item.compareAtPrice === null && (
        <span className="rounded-full bg-offer px-2 py-0.5 text-xs font-semibold text-[color:var(--offer-ink,#fff)]">{t('product.offer')}</span>
      )}
      {item.taxIncluded && <span className="text-xs text-ink-soft">{t('product.taxIncluded')}</span>}
    </div>
  );
}
