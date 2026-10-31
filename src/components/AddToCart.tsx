import { ShoppingBag } from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { announce, isPurchasable, useCart, type CatalogItem } from '@/core';
import { useI18n } from '@/i18n';

export const BASKET_EVENT = 'tsuru:basket-added';

/**
 * Adds the item and tells the header to settle the basket; sold-out items
 * cannot be added. The press answers with a ripple from where it landed.
 */
export function AddToCart({
  item,
  quantity = 1,
  variant = 'full',
  tone = 'accent',
  className = '',
}: {
  item: CatalogItem;
  quantity?: number;
  variant?: 'full' | 'compact';
  tone?: 'accent' | 'quiet';
  className?: string;
}) {
  const { t, langOf } = useI18n();
  const add = useCart((s) => s.add);
  const available = isPurchasable(item);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const onAdd = (event: MouseEvent<HTMLButtonElement>) => {
    const added = add(item, quantity);
    if (added <= 0) {
      announce(t('product.limit'));
      return;
    }
    const message = t('product.added', { name: item.name });
    announce(added < quantity ? `${message}. ${t('product.limit')}` : message);
    window.dispatchEvent(new CustomEvent(BASKET_EVENT));
    const box = event.currentTarget.getBoundingClientRect();
    // Keyboard presses have no pointer position: ripple from the centre.
    const x = event.clientX ? event.clientX - box.left : box.width / 2;
    const y = event.clientY ? event.clientY - box.top : box.height / 2;
    const id = Date.now();
    setRipples((current) => [...current, { id, x, y }]);
    window.setTimeout(() => setRipples((current) => current.filter((r) => r.id !== id)), 650);
  };

  if (!available) {
    return (
      <button type="button" disabled className={`btn btn-quiet ${className}`}>
        {t('product.soldOut')}
      </button>
    );
  }

  // On cards the button says "Agregar"; its accessible name still names the item.
  const compact = variant === 'compact';
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={compact ? t('product.addNamed', { name: item.name }) : undefined}
      className={`btn ${tone === 'quiet' ? 'btn-quiet' : 'btn-accent'} ${compact ? 'px-4 text-sm' : ''} ${className}`}
    >
      {ripples.map((r) => (
        <span key={r.id} aria-hidden="true" className="ripple" style={{ left: r.x, top: r.y }} />
      ))}
      <ShoppingBag aria-hidden="true" className={`h-4 w-4 ${tone === 'quiet' ? 'text-accent-text' : ''}`} />
      <span lang={langOf('product.add')}>{compact ? t('product.add.short') : t('product.add')}</span>
    </button>
  );
}
