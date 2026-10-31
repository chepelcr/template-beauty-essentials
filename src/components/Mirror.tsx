import { useEffect, useRef, type ReactNode } from 'react';
import { coarsePointer, useReducedMotion } from '@/core';

/**
 * The template's signature: an arched mirror with a chrome rim. A soft glint
 * crosses the glass toward the pointer (one rAF per move, only while the
 * mirror is on screen); on touch screens or with reduced motion it rests.
 */
export function Mirror({ children, className = '' }: { children: ReactNode; className?: string }) {
  const glass = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = glass.current;
    if (!node || reduced || coarsePointer()) return;
    let raf = 0;
    let visible = false;
    let x = 0.3;
    const apply = () => {
      raf = 0;
      node.style.setProperty('--glint-x', x.toFixed(3));
    };
    const onMove = (event: PointerEvent) => {
      if (!visible) return;
      x = Math.min(1, Math.max(0, event.clientX / window.innerWidth));
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(node);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
      node.style.removeProperty('--glint-x');
    };
  }, [reduced]);

  return (
    <div className={`mirror ${className}`}>
      <div ref={glass} className="mirror-glass h-full w-full">
        {children}
      </div>
    </div>
  );
}
