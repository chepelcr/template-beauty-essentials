import { Minus, Plus } from 'lucide-react';
import { useI18n } from '@/i18n';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  max: number | null;
  /** Accessible name of the group, e.g. the product name. */
  label: string;
  min?: number;
  size?: 'sm' | 'md';
}

export function QuantityStepper({ value, onChange, max, label, min = 1, size = 'md' }: QuantityStepperProps) {
  const { t } = useI18n();
  const atMax = max !== null && value >= max;
  const cls = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  return (
    <div role="group" aria-label={`${t('product.quantity')}: ${label}`} className="inline-flex items-center rounded-full bg-surface-raised shadow-[inset_0_0_0_1.5px_var(--rule)]">
      <button type="button" className={`icon-btn ${cls} text-heading disabled:opacity-40`} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={t('product.quantity.decrease')}>
        <Minus aria-hidden="true" className="h-4 w-4" />
      </button>
      <span className="min-w-[2ch] text-center font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className={`icon-btn ${cls} text-heading disabled:opacity-40`} onClick={() => onChange(value + 1)} disabled={atMax} aria-label={t('product.quantity.increase')} title={atMax ? t('product.limit') : undefined}>
        <Plus aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
