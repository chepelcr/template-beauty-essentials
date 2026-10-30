// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Formatting shared by every template (pure). Prices are whole colones and
 * read the way Costa Rica writes them: "₡24 500".
 */
import type { StorefrontContact, StorefrontPhone } from '@chepelcr/tsuru-storefront-sdk';

const formatters = new Map<string, Intl.NumberFormat>();

export function formatPrice(amount: number, currency = 'CRC', locale = 'es-CR'): string {
  const key = `${locale}|${currency}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: currency === 'CRC' ? 0 : 2,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(amount);
}

/** Digits of a phone in international form: "50670391069". */
export function phoneDigits(phone: StorefrontPhone): string {
  const number = phone.number.replace(/\D/g, '');
  const dial = (phone.dialCode ?? '').replace(/\D/g, '');
  return dial && !number.startsWith(dial) ? `${dial}${number}` : number;
}

/**
 * "+506 7039 1069". Demo rows carry a flat number that may already include
 * the country code; it is split back out for Costa Rica.
 */
export function displayPhone(phone: StorefrontPhone): string {
  const digits = phoneDigits(phone);
  const cr = digits.length === 11 && digits.startsWith('506');
  const dial = phone.dialCode ?? (cr ? '506' : null);
  const local = dial && digits.startsWith(dial) ? digits.slice(dial.length) : digits;
  const grouped = local.length === 8 ? `${local.slice(0, 4)} ${local.slice(4)}` : local;
  return dial ? `+${dial} ${grouped}` : grouped;
}

export function telHref(phone: StorefrontPhone): string {
  return `tel:+${phoneDigits(phone)}`;
}

/** https://wa.me/50670391069?text=… */
export function whatsappHref(phone: StorefrontPhone, message?: string): string {
  const base = `https://wa.me/${phoneDigits(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** The number orders go to: the store's WhatsApp, else its phone; null when neither. */
export function orderPhone(contact: StorefrontContact | null | undefined): StorefrontPhone | null {
  return contact?.whatsapp ?? contact?.phone ?? null;
}

/**
 * Business hours as written by the store. The SDK serializes the demo row's
 * jsonb value, so a plain string arrives JSON-quoted; it is unwrapped here.
 * Informational text only — it is not parsed into an "open now" state (that
 * needs a timezone and exceptions; see STOREFRONT_ORG_CONFIG.md).
 */
export function businessHours(contact: StorefrontContact | null | undefined): string | null {
  const value = contact?.businessHours?.trim();
  if (!value) return null;
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(value);
      return typeof parsed === 'string' && parsed.trim() ? parsed.trim() : null;
    } catch {
      return value;
    }
  }
  return value;
}

/** A map search link for the store's address (opens the visitor's maps app). */
export function mapsHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
