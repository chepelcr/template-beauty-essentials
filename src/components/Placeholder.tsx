import { ProductFallbackIcon } from './CmsIcon';

/** Identity placeholder: petal glass with a glint and the store's fallback icon. */
export function Placeholder({ label, tone = 'light' }: { label?: string; tone?: 'light' | 'deep' }) {
  const deep = tone === 'deep';
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${deep ? 'bg-surface-deep-raised text-ink-on-deep-soft' : 'bg-surface-quiet text-heading'}`}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-[30%] w-[22%] -skew-x-12 bg-[color:var(--mirror-glint)]" />
      <ProductFallbackIcon className="relative h-9 w-9" strokeWidth={1.4} />
    </div>
  );
}
