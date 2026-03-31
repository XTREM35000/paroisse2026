import { useState, useCallback, useRef } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export const useConfirmDialog = () => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  /** Évite que Radix (onOpenChange false) résolve `false` avant notre résolution positive au clic sur Confirmer. */
  const confirmingRef = useRef(false);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    confirmingRef.current = true;
    resolveRef.current?.(true);
    resolveRef.current = null;
    setOpen(false);
    setOptions(null);
    queueMicrotask(() => {
      confirmingRef.current = false;
    });
  };

  const DialogComponent = options ? (
    <ConfirmDialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          if (!confirmingRef.current) {
            resolveRef.current?.(false);
            resolveRef.current = null;
            setOptions(null);
          }
        }
      }}
      title={options.title}
      description={options.description}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      variant={options.variant}
      onConfirm={handleConfirm}
    />
  ) : null;

  return { confirm, DialogComponent };
};
