import { Clock } from 'lucide-react';
import { Link } from 'wouter';
import { isPurchasable, type CatalogCategory, type CatalogItem } from '@/core';
import { useI18n } from '@/i18n';
import { AddToCart } from './AddToCart';
import { Availability } from './Availability';
import { Placeholder } from './Placeholder';
import { Price } from './Price';
import { StoreImage } from './StoreImage';

/** A product or treatment under an arch, like a small mirror on the vanity. */
export function ArchCard({ item, category, sizes = '(min-width: 1024px) 17rem, (min-width: 640px) 30vw, 46vw', headingLevel = 'h3' }: { item: CatalogItem; category?: CatalogCategory; sizes?: string; headingLevel?: 'h2' | 'h3' }) {
  const { t } = useI18n();
  const Heading = headingLevel;
  return (
    <article className="group relative flex h-full flex-col has-[a:focus-visible]:outline has-[a:focus-visible]:outline-[3px] has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-[color:var(--focus)]">
      <div className={`arch relative aspect-[3/4] bg-surface-quiet ${isPurchasable(item) ? '' : 'grayscale'}`}>
        <StoreImage src={item.imageUrl} alt="" sizes={sizes} maxWidth={720} fallback={<Placeholder />} />
        {item.kind === 'service' && (
          <span className="absolute bottom-3 left-3 rounded-full bg-surface-raised px-3 py-1 text-xs font-semibold text-heading shadow-soft">{t('product.service')}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 pt-4">
        {category && <p className="text-sm font-medium text-ink-soft">{category.name}</p>}
        <Heading className="text-lg leading-snug text-heading">
          <Link href={`/products/${item.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-hover:underline">
            {item.name}
          </Link>
        </Heading>
        {item.duration && (
          <p className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
            <Clock aria-hidden="true" className="h-4 w-4" />
            {item.duration}
          </p>
        )}
        <div className="mt-auto flex flex-col gap-1 pt-1">
          <Price item={item} />
          <div className="flex flex-wrap gap-x-3">
            <Availability item={item} showDuration={false} />
          </div>
        </div>
        <div className="relative z-10 pt-2">
          <AddToCart item={item} variant="compact" tone="quiet" className="w-full" />
        </div>
      </div>
    </article>
  );
}

export function ArchCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col">
      <div className="arch skeleton aspect-[3/4]" />
      <div className="skeleton mt-4 h-3 w-1/3" />
      <div className="skeleton mt-2 h-5 w-3/4" />
      <div className="skeleton mt-3 h-6 w-24" />
    </div>
  );
}
