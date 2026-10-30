// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Page state every template shares — catalog, product, checkout — as hooks.
 * Templates render it however their design asks; nothing here decides how a
 * page looks. `t` is the template's own translate function.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useCart, useCartTotals } from './cart-store';
import {
  categoriesWithItems,
  facetsFor,
  filterItems,
  findCategory,
  maxQuantity,
  relatedItems,
} from './catalog';
import { hasActiveFilters, toFilters } from './catalog-params';
import {
  composeOrderMessage,
  EMPTY_CHECKOUT,
  firstInvalidField,
  needsAddress,
  orderMessageLabels,
  toOrderInput,
  validateCheckout,
  type CheckoutErrors,
  type CheckoutField,
  type CheckoutValues,
} from './checkout';
import { formatPrice, orderPhone, whatsappHref } from './format';
import { placeName, useBarrios, useCantones, useDistritos, useProvincias } from './locations';
import { useCatalog, useCatalogItem, useDeliveryMethods } from './queries';
import { useCatalogParams } from './routing';
import { useStore } from './store-context';
import type { CatalogCategory } from './types';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** The catalog page: URL filters, a debounced search box, facets and results. */
export function useCatalogView() {
  const catalog = useCatalog();
  const [params, setParams] = useCatalogParams();
  const [query, setQuery] = useState(params.q);

  // Typing updates the URL after a pause; back/forward updates the box.
  useEffect(() => setQuery(params.q), [params.q]);
  useEffect(() => {
    if (query.trim() === params.q) return;
    const id = window.setTimeout(() => setParams({ q: query }, { replace: true }), 250);
    return () => window.clearTimeout(id);
  }, [query, params.q, setParams]);

  const facets = facetsFor(catalog.items);
  const categories = categoriesWithItems(catalog.categories, catalog.items);
  const results = filterItems(catalog.items, toFilters(params), catalog.categories);
  const active = hasActiveFilters(params);
  const categoryIds = new Set(categories.map((c) => c.id));

  return {
    catalog,
    params,
    setParams,
    query,
    setQuery,
    facets,
    categories,
    results,
    active,
    /** Browsing with no filter and the default order: show the catalog by category. */
    grouped: !active && params.sort === 'featured',
    selected: findCategory(catalog.categories, params.category),
    /** Results whose category is unknown or empty, listed after the groups. */
    uncategorized: results.filter((i) => !i.categoryId || !categoryIds.has(i.categoryId)),
    categoryOf: (id: string | null): CatalogCategory | undefined => catalog.categories.find((c) => c.id === id),
    clearAll: () => {
      setQuery('');
      setParams({ kind: null, category: null, sale: false, q: '' });
    },
  };
}

/** A product or service page: the item, its category, related items and a quantity. */
export function useProductView(id: string | undefined) {
  const { item, catalog } = useCatalogItem(id);
  const [quantity, setQuantity] = useState(1);
  useEffect(() => setQuantity(1), [id]);
  return {
    item,
    catalog,
    category: item ? catalog.categories.find((c) => c.id === item.categoryId) : undefined,
    related: item ? relatedItems(catalog.items, item, 4) : [],
    max: item ? maxQuantity(item) : null,
    quantity,
    setQuantity,
  };
}

export type CheckoutPhase = 'form' | 'submitting' | 'demo' | 'success';

/**
 * The checkout dialog's state and actions. Live stores create the order in
 * the POS, then open WhatsApp with its tracking number (the tab opens inside
 * the click so popup blockers allow it). Demo stores never send anything:
 * the phase becomes 'demo' with the message that would have been sent.
 */
export function useCheckout(t: Translate) {
  const { isDemo, client, contact, organization } = useStore();
  const open = useCart((s) => s.checkoutOpen);
  const closeCheckout = useCart((s) => s.closeCheckout);
  const openCart = useCart((s) => s.open);
  const clear = useCart((s) => s.clear);
  const lines = useCart((s) => s.lines);
  const totals = useCartTotals();
  const methods = useDeliveryMethods();

  const [values, setValues] = useState<CheckoutValues>(EMPTY_CHECKOUT);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [showSummary, setShowSummary] = useState(false);
  const [phase, setPhase] = useState<CheckoutPhase>('form');
  const [message, setMessage] = useState('');
  const [tracking, setTracking] = useState<string | null>(null);
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const delivery = needsAddress(values.method);
  const provincias = useProvincias();
  const cantones = useCantones(delivery ? values.stateId : null);
  const distritos = useDistritos(delivery ? values.stateId : null, values.countyId);
  const barrios = useBarrios(delivery ? values.stateId : null, values.countyId, values.districtId);

  useEffect(() => {
    if (!open) return;
    setPhase('form');
    setSubmitError(null);
  }, [open]);

  const set = useCallback(
    <K extends keyof CheckoutValues>(key: K, value: CheckoutValues[K]) => {
      setValues((v) => {
        const next = { ...v, [key]: value };
        // A new provincia/cantón/distrito invalidates the levels below it.
        if (key === 'stateId') Object.assign(next, { countyId: null, districtId: null, neighborhoodId: null });
        if (key === 'countyId') Object.assign(next, { districtId: null, neighborhoodId: null });
        if (key === 'districtId') Object.assign(next, { neighborhoodId: null });
        return next;
      });
      setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
    },
    [],
  );

  const errorText = (field: CheckoutField): string | undefined =>
    errors[field] ? t(`checkout.error.${errors[field]}`) : undefined;

  const compose = (trackingNumber: string | null) =>
    composeOrderMessage({
      storeName: organization?.name ?? '',
      lines,
      total: totals.total,
      values,
      places: [
        placeName(provincias.data, values.stateId),
        placeName(cantones.data, values.countyId),
        placeName(distritos.data, values.districtId),
        placeName(barrios.data, values.neighborhoodId),
      ],
      trackingNumber,
      labels: orderMessageLabels(t),
      formatPrice: (n) => formatPrice(n),
    });

  /** Validates; on errors focuses the first invalid field (`fieldId(field)`). */
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    const found = validateCheckout(values);
    setErrors(found);
    const first = firstInvalidField(found);
    if (first) {
      setShowSummary(true);
      document.getElementById(checkoutFieldId(first))?.focus();
      return;
    }
    setShowSummary(false);

    if (isDemo || !client) {
      setMessage(compose(null));
      setPhase('demo');
      return;
    }

    const phone = orderPhone(contact);
    const waWindow = phone ? window.open('', '_blank') : null;
    setPhase('submitting');
    try {
      const order = await client.createOrder(toOrderInput(values, lines));
      const text = compose(order.trackingNumber);
      setTracking(order.trackingNumber);
      if (phone) {
        const url = whatsappHref(phone, text);
        setWaUrl(url);
        if (waWindow) waWindow.location.href = url;
      }
      clear();
      setValues(EMPTY_CHECKOUT);
      setPhase('success');
    } catch {
      waWindow?.close();
      setSubmitError(t('checkout.error.submit'));
      setPhase('form');
    }
  };

  return {
    open,
    close: closeCheckout,
    backToCart: () => {
      closeCheckout();
      openCart();
    },
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
    placesFailed: provincias.isError || cantones.isError || distritos.isError,
  };
}

/** The DOM id of a checkout field (labels, errors and focus use it). */
export const checkoutFieldId = (field: CheckoutField): string => `checkout-${field}`;
