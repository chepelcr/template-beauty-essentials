import { Leaf, Sprout, type LucideProps } from 'lucide-react';
import { cmsIcon, useStore } from '@/core';

/** An icon named by the CMS (see core/cms-icons.ts), or a frame. */
export function CmsIcon({ icon, ...props }: { icon: string | null | undefined } & LucideProps) {
  const Icon = cmsIcon(icon) ?? Leaf;
  return <Icon aria-hidden="true" {...props} />;
}

/** The store's product placeholder icon (theme `productFallbackIcon`), or a sprout. */
export function ProductFallbackIcon(props: LucideProps) {
  const { theme } = useStore();
  const Icon = cmsIcon(theme?.productFallbackIcon) ?? Sprout;
  return <Icon aria-hidden="true" {...props} />;
}
