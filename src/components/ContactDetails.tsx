import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { businessHours, displayPhone, mapsHref, telHref, useStore, whatsappHref } from '@/core';
import { useI18n } from '@/i18n';

// Lucide dropped brand marks in v1; these are minimal outlines of each logo.
function SocialIcon({ network, className }: { network: 'facebook' | 'instagram' | 'x'; className?: string }) {
  const paths = {
    facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v6h4v-6h3l1-4h-4V8z" />,
    instagram: (
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
      </>
    ),
    x: <path d="M4 4l16 16M20 4L4 20" />,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[network]}
    </svg>
  );
}

/**
 * The store's own contact facts, each shown only when the store set it.
 * Hours are informational text, never an "open now" claim.
 */
export function ContactDetails({ tone = 'light', compact = false }: { tone?: 'light' | 'deep'; compact?: boolean }) {
  const { contact } = useStore();
  const { t } = useI18n();
  const soft = tone === 'deep' ? 'text-ink-on-deep-soft' : 'text-ink-soft';
  const strong = tone === 'deep' ? 'text-ink-on-deep' : 'text-heading';
  const hours = businessHours(contact);
  const whatsapp = contact?.whatsapp ?? null;
  const phone = contact?.phone ?? null;
  const socials = [
    { url: contact?.facebookUrl, label: 'Facebook', network: 'facebook' as const },
    { url: contact?.instagramUrl, label: 'Instagram', network: 'instagram' as const },
    { url: contact?.twitterUrl, label: 'X', network: 'x' as const },
  ].filter((s) => s.url);

  const rows = [
    hours && { Icon: Clock, label: t('contact.hours'), body: <span className="whitespace-pre-line">{hours}</span> },
    whatsapp && {
      Icon: MessageCircle,
      label: t('contact.whatsapp'),
      body: <a className="underline decoration-1 underline-offset-4 hover:decoration-2" href={whatsappHref(whatsapp)} target="_blank" rel="noopener noreferrer">{displayPhone(whatsapp)}</a>,
    },
    phone && (!whatsapp || displayPhone(phone) !== displayPhone(whatsapp)) && {
      Icon: Phone,
      label: t('contact.phone'),
      body: <a className="underline decoration-1 underline-offset-4 hover:decoration-2" href={telHref(phone)}>{displayPhone(phone)}</a>,
    },
    contact?.email && {
      Icon: Mail,
      label: t('contact.email'),
      body: <a className="break-all underline decoration-1 underline-offset-4 hover:decoration-2" href={`mailto:${contact.email}`}>{contact.email}</a>,
    },
    contact?.address && {
      Icon: MapPin,
      label: t('contact.address'),
      body: (
        <span>
          {contact.address}
          {!compact && (
            <>
              {' '}
              <a className="font-semibold underline decoration-1 underline-offset-4 hover:decoration-2" href={mapsHref(contact.address)} target="_blank" rel="noopener noreferrer">
                {t('contact.directions')}
              </a>
            </>
          )}
        </span>
      ),
    },
  ].filter(Boolean) as Array<{ Icon: typeof Clock; label: string; body: JSX.Element }>;

  if (!rows.length && !socials.length) {
    return <p className={soft}>{t('contact.empty')}</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <dl className={`grid gap-4 ${compact ? '' : 'sm:grid-cols-2'}`}>
        {rows.map(({ Icon, label, body }) => (
          <div key={label} className="flex gap-3">
            <Icon aria-hidden="true" className={`mt-1 h-5 w-5 shrink-0 ${strong}`} />
            <div>
              <dt className={`text-sm font-semibold ${strong}`}>{label}</dt>
              <dd className={soft}>{body}</dd>
            </div>
          </div>
        ))}
      </dl>
      {socials.length > 0 && (
        <div>
          <p className={`mb-2 text-sm font-semibold ${strong}`}>{t('contact.social')}</p>
          <ul className="flex gap-2">
            {socials.map(({ url, label, network }) => (
              <li key={label}>
                <a href={url!} target="_blank" rel="noopener noreferrer" className={`icon-btn ${tone === 'deep' ? 'btn-on-deep' : 'btn-quiet'}`} aria-label={label}>
                  <SocialIcon network={network} className="h-5 w-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
