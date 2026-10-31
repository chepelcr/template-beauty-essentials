import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useI18n } from '@/i18n';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Both fill phones. On wide screens, 'side' opens on the right and 'center' opens a dialog. */
  placement?: 'side' | 'center';
}

/** Accessible modal surface (focus trap, Escape, scroll lock) from Radix. */
export function Sheet({ open, onOpenChange, title, description, children, footer, placement = 'side' }: SheetProps) {
  const { t } = useI18n();
  const side = placement === 'side';
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay fixed inset-0 z-40 bg-[color:var(--scrim)] backdrop-blur-[2px]" />
        <Dialog.Content
          className={
            side
              ? 'sheet fixed inset-0 z-50 flex h-dvh max-h-dvh flex-col bg-surface shadow-lift md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[28rem] md:rounded-l-[1.75rem] md:rounded-tr-none'
              : 'dialog-pop fixed inset-0 z-50 flex h-dvh max-h-dvh flex-col bg-surface shadow-lift sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[94dvh] sm:w-[min(40rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.75rem]'
          }
        >
          <div className={`flex shrink-0 items-start justify-between gap-4 border-b border-rule px-5 pb-4 sm:px-6 pt-[max(1.25rem,env(safe-area-inset-top))] ${side ? 'md:pt-5' : 'sm:pt-5'}`}>
            <div>
              <Dialog.Title className="font-display text-2xl text-heading">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-ink-soft">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="icon-btn -mr-2 text-heading hover:bg-surface-quiet" aria-label={t('nav.close')}>
              <X aria-hidden="true" className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 ${footer ? '' : side ? 'pb-[max(1.25rem,env(safe-area-inset-bottom))] md:pb-5' : 'pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-5'}`}>{children}</div>
          {footer && <div className="border-t border-rule px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
