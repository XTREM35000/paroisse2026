import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  center?: boolean;
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [] as HTMLElement[];
  const selector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(el => !el.hasAttribute('disabled'));
}

export default function BaseModal({ open, onClose, children, center = false }: BaseModalProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const prevActive = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // Save previously focused element
    prevActive.current = document.activeElement as HTMLElement | null;

    // Focus first focusable element or the container
    const focusable = getFocusableElements(contentRef.current);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else if (contentRef.current) {
      contentRef.current.focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        // Trap focus inside modal
        const elems = getFocusableElements(contentRef.current);
        if (elems.length === 0) {
          e.preventDefault();
          return;
        }

        const first = elems[0];
        const last = elems[elems.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      // restore previous focus
      try {
        if (prevActive.current && typeof prevActive.current.focus === 'function') prevActive.current.focus();
      } catch { /* ignore */ }
    };
  }, [open, onClose]);

  if (!open) return null;

  const modal = (
    <div
      style={{
        zIndex: 2147483647,
        isolation: 'isolate',
      }}
      className={"fixed inset-0 flex " + (center ? 'items-center' : 'items-start') + " justify-center p-4 pt-8 overflow-y-auto"}
      role="presentation"
    >
      <div
        className="fixed inset-0 bg-black/50"
        style={{ zIndex: 2147483646 }}
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={contentRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        style={{ zIndex: 2147483647 }}
        className={"relative w-full flex justify-center " + (center ? 'items-center' : 'items-start')}
      >
        {children}
      </div>
    </div>
  );

  // Render into document.body to escape any local stacking contexts
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modal, document.body);
  }

  return modal;
}
