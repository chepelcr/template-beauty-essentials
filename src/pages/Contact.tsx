import { MessageCircle } from 'lucide-react';
import { contactContent, orderPhone, useCmsPage, usePageMeta, useStore, whatsappHref } from '@/core';
import { useI18n } from '@/i18n';
import { ContactDetails } from '@/components/ContactDetails';
import { SectionError } from '@/components/StoreStates';

export default function Contact() {
  const { t } = useI18n();
  const { contact, isDemo } = useStore();
  const cms = useCmsPage('contact');
  const content = contactContent(cms.page);
  usePageMeta(cms.page?.title ?? t('contact.title'), cms.page?.metaDescription);
  const phone = orderPhone(contact);

  return (
    <div className="page pt-12 md:pt-20">
      {cms.isLoading ? (
        <div aria-hidden="true" className="flex flex-col gap-3">
          <div className="skeleton h-14 w-64" />
          <div className="skeleton h-5 w-80 max-w-full" />
        </div>
      ) : cms.isError ? (
        <SectionError title={t('state.error.title')} onRetry={cms.refetch} />
      ) : (
        <header className="max-w-3xl">
          <h1 className="text-[clamp(2.75rem,7vw,5rem)] text-heading">{content.hero.title ?? t('contact.title')}</h1>
          {content.hero.subtitle && <p className="mt-4 text-lg text-ink-soft">{content.hero.subtitle}</p>}
        </header>
      )}
      <div className="mt-12 grid gap-6 md:grid-cols-12">
        <section className="rounded-frame bg-surface-raised px-7 py-9 shadow-soft md:col-span-7 md:px-10" aria-label={t('contact.title')}>
          <ContactDetails />
          {phone && !isDemo && (
            <a href={whatsappHref(phone)} target="_blank" rel="noopener noreferrer" className="btn btn-accent mt-8">
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
              {t('contact.whatsapp.cta')}
            </a>
          )}
        </section>
        {(content.visit.title || content.visit.note) && (
          <aside className="h-fit rounded-[999px_999px_1.25rem_1.25rem] bg-surface-quiet px-8 pb-9 pt-14 text-center md:col-span-5">
            {content.visit.title && <h2 className="text-2xl text-heading">{content.visit.title}</h2>}
            {content.visit.note && <p className="mt-3 text-ink-soft">{content.visit.note}</p>}
          </aside>
        )}
      </div>
    </div>
  );
}
