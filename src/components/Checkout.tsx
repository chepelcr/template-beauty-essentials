import {AccountCheckoutLink} from '@/core';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import {
  checkoutFieldId as fieldId,
  formatPrice,
  useCheckout,
  type CheckoutField,
  type PlaceOption,
} from '@/core';
import { useI18n } from '@/i18n';
import { Label } from './Label';
import { Sheet } from './Sheet';



function Field({ field, label, hint, error, children }: { field: CheckoutField; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId(field)} className="text-sm font-semibold text-heading">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${fieldId(field)}-hint`} className="text-sm text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId(field)}-error`} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(field: CheckoutField, hasHint: boolean, error?: string) {
  if (error) return `${fieldId(field)}-error`;
  return hasHint ? `${fieldId(field)}-hint` : undefined;
}

function PlaceSelect({
  field,
  label,
  options,
  value,
  disabled,
  error,
  loading,
  onChange,
}: {
  field: CheckoutField;
  label: string;
  options: PlaceOption[] | undefined;
  value: number | null;
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  onChange: (value: number | null) => void;
}) {
  const { t } = useI18n();
  return (
    <Field field={field} label={label} error={error}>
      <select
        id={fieldId(field)}
        className="field"
        value={value ?? ''}
        disabled={disabled || loading}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(field, false, error)}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">{loading ? t('state.loading') : t('checkout.select')}</option>
        {options?.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Checkout() {
  const { t } = useI18n();
  const methodLegend = useId();
  const {
    open,
    close: closeCheckout,
    backToCart,
    lines,
    totals,
    methods,
    values,
    set,
    errors,
    errorText,
    showSummary,
    phase,
    setPhase,
    message,
    tracking,
    waUrl,
    submitError,
    submit,
    delivery,
    places: { provincias, cantones, distritos, barrios },
    placesFailed,
  } = useCheckout(t);

  const title =
    phase === 'success' ? <Label k="checkout.success.title" gloss /> : phase === 'demo' ? t('checkout.demo.title') : t('checkout.title');

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? undefined : closeCheckout())} title={title} placement="center">
      {phase === 'demo' && (
        <div className="flex flex-col gap-4">
          <p className="text-ink-soft">{t('checkout.demo.body')}</p>
          <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-2xl bg-surface-quiet p-4 font-text text-sm leading-relaxed text-ink">{message}</pre>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-strong" onClick={closeCheckout}>
              {t('checkout.demo.done')}
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setPhase('form')}>
              {t('checkout.back')}
            </button>
          </div>
        </div>
      )}

      {phase === 'success' && (
        <div className="flex flex-col items-start gap-4">
          <CheckCircle2 aria-hidden="true" className="h-10 w-10 text-success" />
          {tracking && <p className="font-display text-2xl text-heading">{t('checkout.success.tracking', { tracking })}</p>}
          {waUrl ? <p className="text-ink-soft">{t('checkout.success.body')}</p> : <p className="text-ink-soft">{t('checkout.error.noWhatsapp', { tracking: tracking ?? '' })}</p>}
          <div className="flex flex-wrap gap-3">
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-accent">
                <MessageCircle aria-hidden="true" className="h-4 w-4" />
                {t('checkout.success.whatsapp')}
              </a>
            )}
            <button type="button" className="btn btn-quiet" onClick={closeCheckout}>
              {t('checkout.success.done')}
            </button>
          </div>
        </div>
      )}

      {(phase === 'form' || phase === 'submitting') && (
        <form noValidate onSubmit={submit} className="flex flex-col gap-5">
          <AccountCheckoutLink t={t} />
          {showSummary && (
            <div role="alert" className="rounded-2xl bg-[color:color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-sm font-semibold text-danger">
              {t('checkout.error.summary')}
            </div>
          )}
          {submitError && (
            <div role="alert" className="rounded-2xl bg-[color:color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-sm font-semibold text-danger">
              {submitError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field field="name" label={t('checkout.name')} error={errorText('name')}>
              <input
                id={fieldId('name')}
                className="field"
                autoComplete="name"
                value={values.name}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={describedBy('name', false, errorText('name'))}
                onChange={(e) => set('name', e.target.value)}
              />
            </Field>
            <Field field="email" label={t('checkout.email')} hint={t('checkout.email.hint')} error={errorText('email')}>
              <input id={fieldId('email')} className="field" type="email" autoComplete="email" autoCapitalize="none" maxLength={254} required value={values.email} aria-invalid={errors.email ? true : undefined} aria-describedby={describedBy('email', true, errorText('email'))} onChange={event => set('email', event.target.value)} />
            </Field>
            <Field field="phone" label={t('checkout.phone')} hint={t('checkout.phone.hint')} error={errorText('phone')}>
              <input
                id={fieldId('phone')}
                className="field"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={values.phone}
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={describedBy('phone', true, errorText('phone'))}
                onChange={(e) => set('phone', e.target.value)}
              />
            </Field>
          </div>

          <fieldset aria-describedby={errors.method ? `${fieldId('method')}-error` : undefined}>
            <legend id={methodLegend} className="mb-2 text-sm font-semibold text-heading">
              {t('checkout.method')}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {methods.map((method, index) => (
                <label
                  key={method}
                  className="flex min-h-tap cursor-pointer items-center gap-3 rounded-2xl bg-surface-raised px-4 py-3 shadow-[inset_0_0_0_1.5px_var(--rule)] has-[:checked]:shadow-[inset_0_0_0_2px_var(--heading)] has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-[color:var(--focus)]"
                >
                  <input
                    id={index === 0 ? fieldId('method') : undefined}
                    type="radio"
                    name="delivery"
                    className="h-4 w-4 accent-[color:var(--heading)]"
                    checked={values.method === method}
                    onChange={() => set('method', method)}
                  />
                  <span className="font-medium">{t(`checkout.method.${method}`)}</span>
                </label>
              ))}
            </div>
            {errors.method && (
              <p id={`${fieldId('method')}-error`} className="mt-1.5 text-sm font-medium text-danger">
                {errorText('method')}
              </p>
            )}
          </fieldset>

          {delivery && (
            <div className="grid gap-4 sm:grid-cols-2">
              <PlaceSelect field="stateId" label={t('checkout.state')} options={provincias.data} value={values.stateId} loading={provincias.isLoading} error={errorText('stateId')} onChange={(v) => set('stateId', v)} />
              <PlaceSelect field="countyId" label={t('checkout.county')} options={cantones.data} value={values.countyId} disabled={values.stateId === null} loading={cantones.isLoading && values.stateId !== null} error={errorText('countyId')} onChange={(v) => set('countyId', v)} />
              <PlaceSelect field="districtId" label={t('checkout.district')} options={distritos.data} value={values.districtId} disabled={values.countyId === null} loading={distritos.isLoading && values.countyId !== null} error={errorText('districtId')} onChange={(v) => set('districtId', v)} />
              <PlaceSelect field="neighborhoodId" label={t('checkout.neighborhood')} options={barrios.data} value={values.neighborhoodId} disabled={values.districtId === null} loading={barrios.isLoading && values.districtId !== null} onChange={(v) => set('neighborhoodId', v)} />
              {placesFailed && (
                <p role="alert" className="text-sm font-medium text-danger sm:col-span-2">
                  {t('checkout.places.error')}
                </p>
              )}
              <div className="sm:col-span-2">
                <Field field="address" label={t('checkout.address')} hint={t('checkout.address.hint')} error={errorText('address')}>
                  <textarea
                    id={fieldId('address')}
                    className="field min-h-[5.5rem]"
                    autoComplete="street-address"
                    value={values.address}
                    aria-invalid={errors.address ? true : undefined}
                    aria-describedby={describedBy('address', true, errorText('address'))}
                    onChange={(e) => set('address', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          )}

          <Field field="comment" label={t('checkout.comment')}>
            <textarea id={fieldId('comment')} className="field min-h-[4.5rem]" value={values.comment} onChange={(e) => set('comment', e.target.value)} />
          </Field>

          <div className="rounded-2xl bg-surface-quiet p-4">
            <p className="mb-2 text-sm font-semibold text-heading">{t('checkout.summary')}</p>
            <ul className="flex flex-col gap-1 text-sm">
              {lines.map((line) => (
                <li key={line.key} className="flex justify-between gap-3">
                  <span>
                    {line.quantity} × {line.name}
                  </span>
                  <span className="tabular-nums">{formatPrice(line.unitPrice * line.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between border-t border-rule pt-3 font-semibold text-heading">
              <span>{t('cart.total')}</span>
              <span className="tabular-nums">{formatPrice(totals.total)}</span>
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button type="button" className="btn btn-quiet" onClick={backToCart}>
              {t('checkout.back')}
            </button>
            <button type="submit" className="btn btn-accent" disabled={phase === 'submitting' || lines.length === 0}>
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
              {phase === 'submitting' ? t('checkout.submitting') : t('checkout.submit')}
            </button>
          </div>
        </form>
      )}
    </Sheet>
  );
}
