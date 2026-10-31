import { Link } from 'wouter';
import { useIsDemo, useStore, useStoreName } from '@/core';
import { useI18n } from '@/i18n';
import { ContactDetails } from './ContactDetails';
import { ArchMark, NAV } from './Header';

export function Footer() {
  const { organization } = useStore();
  const name = useStoreName();
  const isDemo = useIsDemo();
  const { t } = useI18n();
  return (
    <footer className="on-deep mt-24 bg-surface-deep text-ink-on-deep">
      <div className="page grid gap-10 py-14 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <p className="flex items-center gap-3 font-display text-3xl font-bold">
            <ArchMark className="h-10 w-8 shrink-0" />
            {name}
          </p>
          {!isDemo && organization?.description && <p className="mt-4 max-w-sm text-ink-on-deep-soft">{organization.description}</p>}
          {isDemo && <p className="mt-4 max-w-sm text-sm text-ink-on-deep-soft">{t('demo.notice')}</p>}
        </div>
        <nav aria-label={t('footer.navigation')} className="md:col-span-3">
          <ul className="grid grid-cols-2 gap-1 md:grid-cols-1">
            {NAV.map(({ href, key }) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-tap items-center hover:underline">
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-5">
          <ContactDetails tone="deep" compact />
        </div>
      </div>
      <div className="page flex flex-wrap justify-between gap-2 border-t border-rule-deep py-5 text-sm text-ink-on-deep-soft">
        <span>
          © {new Date().getFullYear()} {name}
        </span>
        <span>{t('footer.madeWith')}</span>
      </div>
    </footer>
  );
}
