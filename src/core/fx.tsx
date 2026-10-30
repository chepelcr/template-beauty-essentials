// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/**
 * Costly visual effects (WebGL, three.js) under one policy:
 *
 * - loaded only when the element is near the viewport, motion is allowed, the
 *   device is capable enough and WebGL works (`?webgl=0` forces the fallback);
 * - paused offscreen and while the tab is hidden; disposed on unmount;
 * - device pixel ratio capped (1.5 on touch screens, 2 elsewhere);
 * - any failure — import, context creation, a thrown frame — shows the
 *   fallback art, which is always rendered first and never depends on the scene.
 *
 * Content, navigation and buying never wait for a scene.
 */
import { Component, useEffect, useRef, useState, type CSSProperties, type ErrorInfo, type ReactNode } from 'react';
import { useInView, useReducedMotion } from './motion';

export type DeviceTier = 'low' | 'mid' | 'high';

export interface SceneOptions {
  dpr: number;
  tier: DeviceTier;
  pointer: 'fine' | 'coarse';
  /** Call when the scene cannot go on (e.g. WebGL context lost): the fallback returns. */
  fail: () => void;
}

export interface SceneHandle {
  start(): void;
  stop(): void;
  resize(width: number, height: number, dpr: number): void;
  dispose(): void;
}

export type SceneFactory = (canvas: HTMLCanvasElement, options: SceneOptions) => SceneHandle | Promise<SceneHandle>;

let webglSupport: boolean | null = null;

export function webglDisabledByQuery(): boolean {
  if (typeof window === 'undefined') return true;
  return new URLSearchParams(window.location.search).get('webgl') === '0';
}

export function canUseWebGL(): boolean {
  if (webglDisabledByQuery()) return false;
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null;
    webglSupport = Boolean(gl);
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

interface NavigatorHints {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

/** Rough capability tier from the hints browsers expose. */
export function deviceTier(nav: NavigatorHints = typeof navigator === 'undefined' ? {} : (navigator as NavigatorHints)): DeviceTier {
  if (nav.connection?.saveData) return 'low';
  if (nav.connection?.effectiveType && /(^|-)2g$/.test(nav.connection.effectiveType)) return 'low';
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  if (cores <= 2 || memory <= 2) return 'low';
  if (cores >= 8 && memory >= 8) return 'high';
  return 'mid';
}

const TIER_RANK: Record<DeviceTier, number> = { low: 0, mid: 1, high: 2 };

export function coarsePointer(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(pointer: coarse)').matches
    : false;
}

export function cappedDpr(): number {
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  return Math.min(dpr, coarsePointer() ? 1.5 : 2);
}

class SceneBoundary extends Component<{ fallback: ReactNode; onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[fx] scene failed, showing the fallback', error, info.componentStack);
    this.props.onError();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export interface LazySceneProps {
  /** Dynamic import of the scene module, e.g. `() => import('./scenes/device')`. */
  load: () => Promise<{ default: SceneFactory }>;
  /** Static art shown first, under reduced motion, without WebGL and on failure. */
  fallback: ReactNode;
  /** Lowest device tier that gets the scene (default 'mid'). */
  minTier?: DeviceTier;
  className?: string;
  /** Merged over the default `position: relative` (the canvas fills this box). */
  style?: CSSProperties;
  /** Accessible name of the visual; the scene itself is decorative otherwise. */
  label?: string;
}

type Phase = 'idle' | 'loading' | 'running' | 'failed';

function SceneCanvas({ load, onFailed, onRunning }: { load: LazySceneProps['load']; onFailed: () => void; onRunning: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read once: an inline `load` must not restart the scene on every render.
  const loadRef = useRef(load);

  useEffect(() => {
    const load = loadRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let handle: SceneHandle | null = null;
    let disposed = false;
    let visible = true;
    let running = false;
    const cleanups: Array<() => void> = [];

    const update = () => {
      if (!handle) return;
      const shouldRun = visible && document.visibilityState === 'visible';
      if (shouldRun && !running) {
        handle.start();
        running = true;
      } else if (!shouldRun && running) {
        handle.stop();
        running = false;
      }
    };

    (async () => {
      try {
        const module = await load();
        if (disposed) return;
        const dpr = cappedDpr();
        handle = await module.default(canvas, {
          dpr,
          tier: deviceTier(),
          pointer: coarsePointer() ? 'coarse' : 'fine',
          fail: () => {
            if (!disposed) onFailed();
          },
        });
        if (disposed) {
          handle.dispose();
          return;
        }
        const rect = canvas.getBoundingClientRect();
        handle.resize(rect.width, rect.height, dpr);

        const resize = new ResizeObserver(([entry]) => {
          const box = entry.contentRect;
          handle?.resize(box.width, box.height, cappedDpr());
        });
        resize.observe(canvas);
        cleanups.push(() => resize.disconnect());

        const io = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          update();
        });
        io.observe(canvas);
        cleanups.push(() => io.disconnect());

        const onVisibility = () => update();
        document.addEventListener('visibilitychange', onVisibility);
        cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));

        update();
        onRunning();
      } catch (error) {
        console.warn('[fx] scene could not start, showing the fallback', error);
        onFailed();
      }
    })();

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
      if (handle) {
        if (running) handle.stop();
        handle.dispose();
      }
    };
  }, [onFailed, onRunning]);

  return <canvas ref={canvasRef} aria-hidden="true" className="fx-canvas" style={{ width: '100%', height: '100%', display: 'block' }} />;
}

export function LazyScene({ load, fallback, minTier = 'mid', className, style, label }: LazySceneProps) {
  const reducedMotion = useReducedMotion();
  const [ref, near] = useInView<HTMLDivElement>({ rootMargin: '200px' });
  const [phase, setPhase] = useState<Phase>('idle');
  const allowed =
    !reducedMotion && TIER_RANK[deviceTier()] >= TIER_RANK[minTier] && typeof window !== 'undefined' && canUseWebGL();
  const mount = allowed && near && phase !== 'failed';

  // Stable callbacks so the canvas effect does not restart on re-render.
  const failed = useRef(() => setPhase('failed')).current;
  const running = useRef(() => setPhase('running')).current;

  return (
    <div
      ref={ref}
      className={className}
      data-fx={phase}
      role={label ? 'img' : undefined}
      aria-label={label}
      style={{ position: 'relative', ...style }}
    >
      <div aria-hidden="true" data-fx-fallback style={{ transition: 'opacity 400ms ease', opacity: phase === 'running' ? 0 : 1 }}>
        {fallback}
      </div>
      {mount && (
        <SceneBoundary fallback={null} onError={failed}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <SceneCanvas load={load} onFailed={failed} onRunning={running} />
          </div>
        </SceneBoundary>
      )}
    </div>
  );
}
