import { Link } from 'wouter';
import { categoriesWithItems, facetsFor, featuredItems, homeContent, paragraphs, useCatalog, useCmsPage, usePageMeta } from '@/core';
import { useI18n } from '@/i18n';
import { ArchCard, ArchCardSkeleton } from '@/components/ArchCard';
import { CmsIcon } from '@/components/CmsIcon';
import { Mirror } from '@/components/Mirror';
import { Placeholder } from '@/components/Placeholder';
import { Ritual } from '@/components/Ritual';
import { SectionError } from '@/components/StoreStates';
import { StoreImage } from '@/components/StoreImage';

export default function Home() {
  const { t } = useI18n();
  const cms = useCmsPage('home');
  const home = homeContent(cms.page);
  const catalog = useCatalog();
  usePageMeta(cms.page?.title, cms.page?.metaDescription);

  const featured = featuredItems(catalog.items, 8);
  const rituals = categoriesWithItems(catalog.categories, catalog.items);
  const counts = facetsFor(catalog.items).categories;
  const categoryOf = (id: string | null) => catalog.categories.find((c) => c.id === id);
  const story = paragraphs(home.story.content);

  return (
    <>
      <section className="page grid items-center gap-x-10 gap-y-12 pb-10 pt-12 md:grid-cols-12 md:pb-16 md:pt-20">
        <div className={home.hero.image ? 'md:col-span-6 lg:col-span-7' : 'md:col-span-10'}>
          {cms.isLoading ? (
            <div aria-hidden="true" className="flex flex-col gap-4">
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-16 w-full" />
              <div className="skeleton h-16 w-3/4" />
              <div className="skeleton h-5 w-3/4" />
            </div>
          ) : cms.isError ? (
            <SectionError title={t('state.error.title')} onRetry={cms.refetch} />
          ) : (
            <>
              {home.hero.badge && <p className="mb-6 font-medium text-accent-text">{home.hero.badge}</p>}
              {home.hero.title && <h1 className="text-[clamp(2.75rem,7vw,5.5rem)] text-heading">{home.hero.title}</h1>}
              {home.hero.subtitle && <p className="mt-7 max-w-[34rem] text-lg text-ink-soft">{home.hero.subtitle}</p>}
              <div className="mt-10 flex flex-wrap gap-3">
                {home.hero.ctaPrimary && (
                  <Link href="/products" className="btn btn-accent">
                    {home.hero.ctaPrimary}
                  </Link>
                )}
                {home.hero.ctaSecondary && (
                  <Link href="/contact" className="btn btn-quiet">
                    {home.hero.ctaSecondary}
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
        {home.hero.image && (
          <div className="md:col-span-6 lg:col-span-5">
            <Mirror className="mx-auto w-[min(25rem,82vw)]">
              <div className="aspect-[3/4] bg-surface-quiet">
                <StoreImage src={home.hero.image} alt="" priority sizes="(min-width: 768px) 25rem, 82vw" maxWidth={1000} fallback={<Placeholder />} />
              </div>
            </Mirror>
          </div>
        )}
      </section>

      {(rituals.length > 0 || catalog.isLoading) && (
        <section aria-labelledby={home.categories.title ? 'home-rituals' : undefined} className="page pt-14">
          {(home.categories.title || home.categories.subtitle) && (
            <div className="mb-10 max-w-2xl">
              {home.categories.title && (
                <h2 id="home-rituals" className="text-[clamp(2.1rem,4.5vw,3.25rem)] text-heading">
                  {home.categories.title}
                </h2>
              )}
              {home.categories.subtitle && <p className="mt-3 text-lg text-ink-soft">{home.categories.subtitle}</p>}
            </div>
          )}
          {catalog.isLoading ? (
            <div aria-hidden="true" className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="arch skeleton aspect-[3/4]" />
              ))}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
              {rituals.map((category, index) => (
                <li key={category.id}>
                  <Ritual category={category} count={counts.get(category.id) ?? 0} index={index} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby={home.featured.title ? 'home-vanity' : undefined} className="page pt-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            {home.featured.badge && <p className="mb-3 font-medium text-accent-text">{home.featured.badge}</p>}
            {home.featured.title && (
              <h2 id="home-vanity" className="text-[clamp(2.1rem,4.5vw,3.25rem)] text-heading">
                {home.featured.title}
              </h2>
            )}
            {home.featured.subtitle && <p className="mt-3 text-lg text-ink-soft">{home.featured.subtitle}</p>}
          </div>
          {catalog.items.length > 0 && (
            <Link href="/products" className="btn btn-quiet">
              {t('catalog.viewAll')}
            </Link>
          )}
        </div>
        {catalog.isLoading ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <ArchCardSkeleton key={i} />
            ))}
          </div>
        ) : catalog.isError ? (
          <SectionError title={t('catalog.error.title')} onRetry={catalog.refetch} />
        ) : featured.length === 0 ? (
          <p className="text-lg text-ink-soft">{t('catalog.empty.store')}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {featured.map((item) => (
              <li key={item.id}>
                <ArchCard item={item} category={categoryOf(item.categoryId)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {home.benefits.length > 0 && (
        <section className="page pt-24">
          <ul className="grid gap-px overflow-hidden rounded-frame bg-[color:var(--rule)] md:grid-cols-3">
            {home.benefits.map((benefit) => (
              <li key={benefit.title} className="flex flex-col gap-3 bg-surface p-7">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-quiet text-accent-text">
                  <CmsIcon icon={benefit.icon} className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="text-xl text-heading">{benefit.title}</h3>
                {benefit.description && <p className="text-ink-soft">{benefit.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(home.story.title || story.length > 0) && (
        <section className="page pt-24">
          <div className="grid gap-10 md:grid-cols-12 md:items-center md:gap-16">
            {home.story.image && (
              <div className="arch aspect-[4/5] bg-surface-quiet md:col-span-5">
                <StoreImage src={home.story.image} alt="" sizes="(min-width: 768px) 38vw, 100vw" maxWidth={1100} fallback={<Placeholder />} />
              </div>
            )}
            <div className={home.story.image ? 'md:col-span-7' : 'md:col-span-9'}>
              {home.story.title && <h2 className="text-[clamp(2.1rem,4.5vw,3.25rem)] text-heading">{home.story.title}</h2>}
              <div className="mt-5 flex max-w-[58ch] flex-col gap-3 text-lg text-ink-soft">
                {story.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <Link href="/about" className="btn btn-quiet mt-8">
                {t('nav.about')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {(home.cta.title || home.cta.description) && (
        <section className="page pt-24">
          <div className="on-deep flex flex-col items-start gap-7 rounded-[2rem] bg-surface-deep p-10 text-ink-on-deep md:flex-row md:items-center md:justify-between md:p-14">
            <div className="max-w-xl">
              {home.cta.title && <h2 className="text-[clamp(2rem,4vw,3rem)]">{home.cta.title}</h2>}
              {home.cta.description && <p className="mt-3 text-lg text-ink-on-deep-soft">{home.cta.description}</p>}
            </div>
            {home.cta.buttonText && (
              <Link href="/contact" className="btn shrink-0 bg-[color:var(--be-petal)] text-[color:var(--be-plum)] hover:shadow-[0_0_0_4px_rgb(242_212_216/0.3)]">
                {home.cta.buttonText}
              </Link>
            )}
          </div>
        </section>
      )}
    </>
  );
}
