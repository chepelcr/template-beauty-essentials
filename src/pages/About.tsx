import { aboutContent, paragraphs, useCmsPage, usePageMeta } from '@/core';
import { useI18n } from '@/i18n';
import { CmsIcon } from '@/components/CmsIcon';
import { Mirror } from '@/components/Mirror';
import { Placeholder } from '@/components/Placeholder';
import { SectionError } from '@/components/StoreStates';
import { StoreImage } from '@/components/StoreImage';

export default function About() {
  const { t } = useI18n();
  const cms = useCmsPage('about');
  const about = aboutContent(cms.page);
  usePageMeta(cms.page?.title ?? t('nav.about'), cms.page?.metaDescription);
  const story = paragraphs(about.story.content);

  return (
    <>
      <section className="page grid items-center gap-12 pt-12 md:grid-cols-12 md:pt-20">
        <div className={about.hero.image ? 'md:col-span-7' : 'md:col-span-10'}>
          {cms.isLoading ? (
            <div aria-hidden="true" className="flex flex-col gap-3">
              <div className="skeleton h-14 w-64" />
              <div className="skeleton h-5 w-80 max-w-full" />
            </div>
          ) : cms.isError ? (
            <SectionError title={t('state.error.title')} onRetry={cms.refetch} />
          ) : (
            <>
              <h1 className="text-[clamp(2.75rem,7vw,5rem)] text-heading">{about.hero.title ?? t('nav.about')}</h1>
              {about.hero.subtitle && <p className="mt-6 max-w-xl text-lg text-ink-soft">{about.hero.subtitle}</p>}
            </>
          )}
        </div>
        {about.hero.image && (
          <div className="md:col-span-5">
            <Mirror className="mx-auto w-[min(22rem,76vw)]">
              <div className="aspect-[3/4] bg-surface-quiet">
                <StoreImage src={about.hero.image} alt="" priority sizes="(min-width: 768px) 22rem, 76vw" maxWidth={900} fallback={<Placeholder />} />
              </div>
            </Mirror>
          </div>
        )}
      </section>

      <div className="page">
        {(about.story.title || story.length > 0) && (
          <section className="grid gap-12 pt-24 md:grid-cols-12 md:items-center">
            <div className={about.story.image ? 'md:col-span-7' : 'md:col-span-9'}>
              {about.story.title && <h2 className="text-[clamp(2.1rem,4.5vw,3.25rem)] text-heading">{about.story.title}</h2>}
              <div className="mt-5 flex max-w-[60ch] flex-col gap-3 text-lg text-ink-soft">
                {story.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
            {about.story.image && (
              <div className="arch aspect-[3/4] bg-surface-quiet md:col-span-5">
                <StoreImage src={about.story.image} alt="" sizes="(min-width: 768px) 35vw, 100vw" maxWidth={960} fallback={<Placeholder />} />
              </div>
            )}
          </section>
        )}

        {about.values.items.length > 0 && (
          <section className="pt-24">
            {about.values.title && <h2 className="mb-10 text-[clamp(2.1rem,4.5vw,3.25rem)] text-heading">{about.values.title}</h2>}
            <ul className="grid gap-px overflow-hidden rounded-frame bg-[color:var(--rule)] md:grid-cols-3">
              {about.values.items.map((value) => (
                <li key={value.title} className="flex flex-col gap-3 bg-surface p-7">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-quiet text-accent-text">
                    <CmsIcon icon={value.icon} className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <h3 className="text-xl text-heading">{value.title}</h3>
                  {value.description && <p className="text-ink-soft">{value.description}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
