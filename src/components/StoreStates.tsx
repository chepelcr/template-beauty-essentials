import { CloudOff, Store } from 'lucide-react';
import type { ReactNode } from 'react';
import { useI18n } from '@/i18n';

function StateFrame({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <main className="on-deep grid min-h-dvh place-items-center bg-surface-deep px-6 text-center text-ink-on-deep">
      <div className="flex max-w-md flex-col items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-surface-deep-raised">{icon}</span>
        <h1 className="text-3xl">{title}</h1>
        <p className="text-ink-on-deep-soft">{body}</p>
        {action}
      </div>
    </main>
  );
}

export function StoreError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <StateFrame
      icon={<CloudOff aria-hidden="true" className="h-8 w-8" />}
      title={t('state.error.title')}
      body={t('state.error.body')}
      action={
        <button type="button" className="btn btn-accent" onClick={onRetry}>
          {t('state.retry')}
        </button>
      }
    />
  );
}

export function StoreUnconfigured() {
  const { t } = useI18n();
  return <StateFrame icon={<Store aria-hidden="true" className="h-8 w-8" />} title={t('state.unconfigured.title')} body={t('state.unconfigured.body')} />;
}

/** An inline error with a retry, for one section that failed to load. */
export function SectionError({ title, onRetry }: { title: string; onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-[1.5rem] bg-surface-quiet p-6">
      <p className="font-display text-xl text-heading">{title}</p>
      <p className="text-ink-soft">{t('state.error.body')}</p>
      <button type="button" className="btn btn-strong" onClick={onRetry}>
        {t('state.retry')}
      </button>
    </div>
  );
}
