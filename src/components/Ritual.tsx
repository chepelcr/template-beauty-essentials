import { Link } from 'wouter';
import { catalogHref, parseHex, type CatalogCategory } from '@/core';
import { useI18n } from '@/i18n';
import { StoreImage } from './StoreImage';

// Rim colours, only for categories the store left without a valid colour.
const ROTATION = ['#F2D4D8', '#A3122B', '#BFC3C9', '#2B1A22'];

/** A category as a small arched mirror: its photo, a rim in its own colour, its name. */
export function Ritual({ category, count, index }: { category: CatalogCategory; count: number; index: number }) {
  const { plural } = useI18n();
  const rim = (parseHex(category.backgroundColor) ? category.backgroundColor : null) ?? ROTATION[index % ROTATION.length];
  return (
    <Link href={catalogHref({ category: category.key })} className="group flex flex-col items-center gap-3 text-center">
      <span className="block w-full rounded-[999px_999px_1rem_1rem] p-1.5 transition-transform duration-300 group-hover:-translate-y-1" style={{ background: rim }}>
        <span className="arch relative block aspect-[3/4] w-full bg-surface-quiet">
          <StoreImage
            src={category.imageUrl}
            alt=""
            sizes="(min-width: 1024px) 12rem, 30vw"
            maxWidth={480}
            fallback={<span className="grid h-full w-full place-items-center font-display text-4xl text-heading">{category.name.slice(0, 1)}</span>}
          />
        </span>
      </span>
      <span className="font-display text-lg leading-tight text-heading group-hover:underline">{category.name}</span>
      <span className="-mt-2 text-sm text-ink-soft">{plural('category.count', count)}</span>
    </Link>
  );
}
