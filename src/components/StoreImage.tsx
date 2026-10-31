import { useState, type ReactNode } from 'react';
import { imageAttributes } from '@/core';

interface StoreImageProps {
  src: string | null | undefined;
  alt: string;
  /** Rendered width, for srcset selection. */
  sizes?: string;
  maxWidth?: number;
  /** Above the fold: load eagerly with high priority. */
  priority?: boolean;
  className?: string;
  /** Shown when there is no image or it fails to load. */
  fallback: ReactNode;
}

/**
 * Fills its (aspect-ratio) box. A missing or broken image shows the
 * identity placeholder instead of a broken icon.
 */
export function StoreImage({ src, alt, sizes = '100vw', maxWidth = 1600, priority, className, fallback }: StoreImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return <>{fallback}</>;
  const attrs = imageAttributes(src, sizes, maxWidth);
  const priorityAttrs = priority ? ({ fetchpriority: 'high' } as Record<string, string>) : {};
  return (
    <img
      {...attrs}
      {...priorityAttrs}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailedSrc(src)}
      onLoad={() => setFailedSrc(null)}
      className={className ?? 'h-full w-full object-cover'}
    />
  );
}
