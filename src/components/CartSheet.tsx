import { ShoppingBasket, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import { formatPrice, useCart, useCartTotals } from '@/core';
import { useI18n } from '@/i18n';
import { Label } from './Label';
import { Placeholder } from './Placeholder';
import { QuantityStepper } from './QuantityStepper';
import { Sheet } from './Sheet';
import { StoreImage } from './StoreImage';

export function CartSheet() {
  const { t } = useI18n();
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const openCheckout = useCart((s) => s.openCheckout);
  const totals = useCartTotals();

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => (open ? undefined : close())}
      title={<Label k="cart.title" gloss />}
      footer={
        lines.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-heading">{t('cart.total')}</span>
              <span className="font-display text-2xl tabular-nums text-heading">{formatPrice(totals.total)}</span>
            </div>
            <button type="button" className="btn btn-accent w-full" onClick={openCheckout}>
              {t('cart.checkout')}
            </button>
          </div>
        ) : undefined
      }
    >
      {lines.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-surface-quiet text-heading">
            <ShoppingBasket aria-hidden="true" className="h-8 w-8" strokeWidth={1.5} />
          </span>
          <p className="font-display text-2xl text-heading">{t('cart.empty.title')}</p>
          <p className="max-w-xs text-ink-soft">{t('cart.empty.body')}</p>
          <Link href="/products" onClick={close} className="btn btn-strong mt-2">
            {t('cart.empty.cta')}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-[color:var(--rule)]">
          {lines.map((line) => (
            <li key={line.key} className="flex gap-4 py-4 first:pt-0">
              <div className="frame-sm h-20 w-16 shrink-0 bg-surface-quiet">
                <StoreImage src={line.imageUrl} alt="" sizes="64px" maxWidth={400} fallback={<Placeholder />} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/products/${line.productId}`} onClick={close} className="font-semibold leading-snug text-heading hover:underline">
                    {line.name}
                  </Link>
                  <span className="shrink-0 font-semibold tabular-nums">{formatPrice(line.unitPrice * line.quantity)}</span>
                </div>
                <p className="text-sm text-ink-soft tabular-nums">{formatPrice(line.unitPrice)}</p>
                <div className="flex items-center justify-between gap-2">
                  <QuantityStepper value={line.quantity} max={line.maxQuantity} onChange={(q) => setQuantity(line.key, q)} label={line.name} size="sm" />
                  <button type="button" onClick={() => remove(line.key)} className="icon-btn text-ink-soft hover:bg-surface-quiet hover:text-danger" aria-label={t('cart.remove', { name: line.name })}>
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
