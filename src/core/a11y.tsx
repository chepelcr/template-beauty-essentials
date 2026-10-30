// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Accessibility primitives every template mounts once: a skip link, focus
 * and scroll handling on route change, and a polite live region for cart
 * updates. Unstyled beyond what visibility requires; templates add the look.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useLocation } from 'wouter';

export const MAIN_ID = 'contenido';

export function SkipLink({ label, targetId = MAIN_ID, className }: { label: string; targetId?: string; className?: string }) {
  return (
    <a href={`#${targetId}`} className={className ?? 'skip-link'}>
      {label}
    </a>
  );
}

/**
 * On navigation: scroll to the top and move focus to the main region, so
 * keyboard and screen-reader users land on the new page instead of the link
 * they activated. Skipped on the first render and for hash links.
 */
export function RouteFocus({ targetId = MAIN_ID }: { targetId?: string }) {
  const [location] = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo({ top: 0 });
    const main = document.getElementById(targetId);
    if (main) {
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
    }
  }, [location, targetId]);
  return null;
}

// One shared polite announcement, written by `announce()`.
let message = '';
const listeners = new Set<() => void>();

export function announce(text: string): void {
  // Clearing first makes a repeated message ("Agregado al pedido") re-announce.
  message = '';
  listeners.forEach((l) => l());
  window.setTimeout(() => {
    message = text;
    listeners.forEach((l) => l());
  }, 60);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function LiveRegion() {
  const text = useSyncExternalStore(subscribe, () => message, () => '');
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        margin: -1,
        padding: 0,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {text}
    </div>
  );
}
