import { Link } from 'wouter';
import { usePageMeta } from '@/core';
import { useI18n } from '@/i18n';
import { Mirror } from '@/components/Mirror';

export default function NotFound() {
  const { t } = useI18n();
  usePageMeta(t('notFound.title'));
  return (
    <div className="page grid items-center gap-12 pt-16 md:grid-cols-12">
      <div className="md:col-span-7">
        <h1 className="text-[clamp(2.75rem,7vw,5rem)] text-heading">{t('notFound.title')}</h1>
        <p className="mt-5 max-w-md text-lg text-ink-soft">{t('notFound.body')}</p>
        <Link href="/" className="btn btn-accent mt-8">
          {t('notFound.cta')}
        </Link>
      </div>
      <div className="md:col-span-5">
        <Mirror className="mx-auto w-[min(16rem,62vw)]">
          <div className="aspect-[3/4] bg-surface-quiet" />
        </Mirror>
      </div>
    </div>
  );
}
