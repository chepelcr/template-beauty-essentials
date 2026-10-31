// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Checkout rules (pure). The form is headless: templates render their own
 * fields and read errors from here.
 *
 * Live stores create the order in the store's POS (`createOrder`) and then
 * open WhatsApp with the composed message. Demo stores never send anything:
 * they show the message that would be sent, with a demo notice.
 */
import type { StorefrontOrderInput } from '@chepelcr/tsuru-storefront-sdk';
import type { CartLine } from './cart';

export type DeliveryMethod = 'pickup' | 'correos' | 'uber-flash' | 'personal';

/**
 * Live stores keep today's options: the org's shipping settings are not
 * exposed by the public API yet (STOREFRONT_ORG_CONFIG.md, "Métodos de entrega").
 */
export const LIVE_DELIVERY_METHODS: readonly DeliveryMethod[] = ['correos', 'uber-flash', 'personal'];

/** Demo stores: the template's shipping flags (`/api/templates/{id}/shipping`). */
export function deliveryMethodsFromShipping(shipping: unknown): DeliveryMethod[] {
  const s = (shipping ?? {}) as Record<string, unknown>;
  const flag = (...keys: string[]) => keys.some((k) => s[k] === true);
  const methods: DeliveryMethod[] = [];
  if (flag('enable_local_pickup', 'enableLocalPickup')) methods.push('pickup');
  if (flag('enable_correos_shipping', 'enableCorreosShipping')) methods.push('correos');
  if (flag('enable_uber_flash', 'enableUberFlash')) methods.push('uber-flash');
  return methods.length ? methods : [...LIVE_DELIVERY_METHODS];
}

export const needsAddress = (method: DeliveryMethod | ''): boolean => method !== '' && method !== 'pickup';

export interface CheckoutValues {
  name: string;
  email: string;
  phone: string;
  method: DeliveryMethod | '';
  stateId: number | null;
  countyId: number | null;
  districtId: number | null;
  neighborhoodId: number | null;
  /** Dirección exacta (otras señas). */
  address: string;
  comment: string;
}

export const EMPTY_CHECKOUT: CheckoutValues = {
  name: '',
  email: '',
  phone: '',
  method: '',
  stateId: null,
  countyId: null,
  districtId: null,
  neighborhoodId: null,
  address: '',
  comment: '',
};

export type CheckoutField = keyof CheckoutValues;

/** Message keys; each template's dictionary words them (`checkout.error.<code>`). */
export type CheckoutErrorCode =
  | 'name_required'
  | 'email_required'
  | 'phone_required'
  | 'phone_invalid'
  | 'method_required'
  | 'state_required'
  | 'county_required'
  | 'district_required'
  | 'address_required';

export type CheckoutErrors = Partial<Record<CheckoutField, CheckoutErrorCode>>;

/** Costa Rica numbers: 8 digits, optionally with +506. */
export function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  const local = digits.length === 11 && digits.startsWith('506') ? digits.slice(3) : digits;
  return /^[2-8]\d{7}$/.test(local) ? local : null;
}

export function validateCheckout(values: CheckoutValues): CheckoutErrors {
  const errors: CheckoutErrors = {};
  if (values.name.trim().length < 2) errors.name = 'name_required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'email_required';
  if (!values.phone.trim()) errors.phone = 'phone_required';
  else if (!normalizePhone(values.phone)) errors.phone = 'phone_invalid';
  if (!values.method) errors.method = 'method_required';
  if (needsAddress(values.method)) {
    if (values.stateId === null) errors.stateId = 'state_required';
    if (values.countyId === null) errors.countyId = 'county_required';
    if (values.districtId === null) errors.districtId = 'district_required';
    if (values.address.trim().length < 5) errors.address = 'address_required';
  }
  return errors;
}

export const FIELD_ORDER: readonly CheckoutField[] = [
  'name', 'email', 'phone', 'method', 'stateId', 'countyId', 'districtId', 'neighborhoodId', 'address', 'comment',
];

/** The first field with an error, for focus management. */
export function firstInvalidField(errors: CheckoutErrors): CheckoutField | null {
  return FIELD_ORDER.find((f) => errors[f]) ?? null;
}

export function toOrderInput(values: CheckoutValues, lines: CartLine[]): StorefrontOrderInput & { customerEmail: string } {
  const phone = normalizePhone(values.phone) ?? values.phone.trim();
  return {
    customerName: values.name.trim(),
    customerEmail: values.email.trim(),
    customerPhone: phone,
    deliveryMethod: values.method || null,
    address: needsAddress(values.method)
      ? {
          stateId: values.stateId,
          countyId: values.countyId,
          districtId: values.districtId,
          neighborhoodId: values.neighborhoodId,
          address: values.address.trim(),
        }
      : null,
    items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    comment: values.comment.trim() || null,
  };
}

export interface OrderMessageLabels {
  /** e.g. "Hola, {store}. Quiero hacer este pedido:" */
  greeting: string;
  total: string;
  name: string;
  phone: string;
  delivery: string;
  address: string;
  comment: string;
  tracking: string;
  methods: Record<DeliveryMethod, string>;
}

/** The message labels from a template's dictionary (`order.*`, `checkout.method.*`). */
export function orderMessageLabels(t: (key: string) => string): OrderMessageLabels {
  return {
    greeting: t('order.greeting'),
    total: t('order.total'),
    name: t('order.name'),
    phone: t('order.phone'),
    delivery: t('order.delivery'),
    address: t('order.address'),
    comment: t('order.comment'),
    tracking: t('order.tracking'),
    methods: {
      pickup: t('checkout.method.pickup'),
      correos: t('checkout.method.correos'),
      'uber-flash': t('checkout.method.uber-flash'),
      personal: t('checkout.method.personal'),
    },
  };
}

export interface OrderMessageInput {
  storeName: string;
  lines: CartLine[];
  total: number;
  values: CheckoutValues;
  /** Names of the selected provincia, cantón, distrito and barrio. */
  places: Array<string | null | undefined>;
  trackingNumber?: string | null;
  labels: OrderMessageLabels;
  formatPrice: (amount: number) => string;
}

export function composeOrderMessage(input: OrderMessageInput): string {
  const { labels, values, formatPrice } = input;
  const out: string[] = [labels.greeting.replace('{store}', input.storeName), ''];
  for (const line of input.lines) {
    out.push(`• ${line.quantity} × ${line.name} — ${formatPrice(line.unitPrice * line.quantity)}`);
  }
  out.push('', `${labels.total}: ${formatPrice(input.total)}`, '');
  out.push(`${labels.name}: ${values.name.trim()}`);
  out.push(`${labels.phone}: ${values.phone.trim()}`);
  if (values.method) out.push(`${labels.delivery}: ${labels.methods[values.method]}`);
  if (needsAddress(values.method)) {
    const place = input.places.filter((p): p is string => Boolean(p && p.trim())).join(', ');
    const exact = values.address.trim();
    out.push(`${labels.address}: ${[place, exact].filter(Boolean).join(' — ')}`);
  }
  if (values.comment.trim()) out.push(`${labels.comment}: ${values.comment.trim()}`);
  if (input.trackingNumber) out.push(`${labels.tracking}: ${input.trackingNumber}`);
  return out.join('\n');
}
