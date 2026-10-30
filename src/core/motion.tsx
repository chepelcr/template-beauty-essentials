// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Motion policy shared by every template.
 *
 * - `prefers-reduced-motion` is honoured live (the hook re-renders when the
 *   setting changes); `?motion=reduce` forces it for review, `?motion=full`
 *   lifts the override. The override lasts for the browsing session.
 * - Route changes use the View Transitions API when available and motion is
 *   allowed; otherwise navigation is instant.
 * - Nothing here starts an animation by itself: templates decide their one
 *   signature moment; everything else answers an action.
 */
import { useEffect, useRef, useState, useSyncExternalStore, type MutableRefObject, type RefCallback } from 'react';
import { flushSync } from 'react-dom';

const OVERRIDE_KEY = 'tsuru:motion';
const QUERY = '(prefers-reduced-motion: reduce)';

function readOverride(): 'reduce' | 'full' | null {
  if (typeof window === 'undefined') return null;
  let override: 'reduce' | 'full' | null = null;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('motion');
    if (fromUrl === 'reduce' || fromUrl === 'full') {
      sessionStorage.setItem(OVERRIDE_KEY, fromUrl);
      override = fromUrl;
    } else {
      const stored = sessionStorage.getItem(OVERRIDE_KEY);
      override = stored === 'reduce' || stored === 'full' ? stored : null;
    }
  } catch {
    override = null;
  }
  // core.css stops CSS animation under the override too.
  if (override === 'reduce') document.documentElement.dataset.motion = 'reduce';
  else delete document.documentElement.dataset.motion;
  return override;
}

export function prefersReducedMotion(): boolean {
  const override = readOverride();
  if (override) return override === 'reduce';
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY).matches
    : false;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/** Live reduced-motion preference (setting changes re-render). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}

/**
 * True once (or while, with `once: false`) the element is near the viewport.
 * Without IntersectionObserver the element counts as visible.
 */
export function useInView<T extends Element>(
  options: { rootMargin?: string; threshold?: number; once?: boolean } = {},
): [RefCallback<T>, boolean] {
  const { rootMargin = '0px', threshold = 0, once = true } = options;
  const [inView, setInView] = useState(false);
  const [node, setNode] = useState<T | null>(null);

  useEffect(() => {
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, rootMargin, threshold, once]);

  return [setNode, inView];
}

type Navigate = (to: string, options?: { replace?: boolean; state?: unknown; transition?: boolean }) => void;

/**
 * wouter `aroundNav`: wraps the navigation in a view transition. The DOM must
 * update synchronously inside the callback, hence `flushSync`.
 */
interface ViewTransitionLike {
  ready?: Promise<unknown>;
  finished?: Promise<unknown>;
  updateCallbackDone?: Promise<unknown>;
}

export function viewTransitionNav(navigate: Navigate, to: string, options?: Parameters<Navigate>[1]): void {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => ViewTransitionLike };
  if (!doc.startViewTransition || prefersReducedMotion() || options?.transition === false || document.visibilityState !== 'visible') {
    navigate(to, options);
    return;
  }
  const transition = doc.startViewTransition(() => {
    flushSync(() => navigate(to, options));
  });
  // A transition skipped by a newer navigation rejects these; it is not an error.
  const ignore = () => undefined;
  transition.ready?.catch(ignore);
  transition.finished?.catch(ignore);
  transition.updateCallbackDone?.catch(ignore);
}

/** Re-render-free flag for event handlers that need the current preference. */
export function useReducedMotionRef(): MutableRefObject<boolean> {
  const reduced = useReducedMotion();
  const ref = useRef(reduced);
  ref.current = reduced;
  return ref;
}
