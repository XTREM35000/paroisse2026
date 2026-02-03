import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * RedirectHandler listens for authentication-driven redirects and performs
 * SPA navigation (useNavigate) to avoid full page reloads.
 *
 * It also checks `sessionStorage.ff_pending_redirect` on mount in case the
 * event was dispatched before the router mounted.
 */
const RedirectHandler: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const perform = (path?: string | null) => {
      try {
        if (!path) return;
        // Clear pending key to prevent re-execution
        try { sessionStorage.removeItem('ff_pending_redirect'); } catch (e) { /* ignore */ }
        // Use replace to avoid polluting history
        navigate(path, { replace: true });
      } catch (e) {
        // If something goes wrong, fallback to setting location (rare)
        try { window.location.replace(path || '/'); } catch { /* ignore */ }
      }
    };

    const onEvent = (e: Event) => {
      try {
        // event may be CustomEvent with detail.path
        const ce = e as CustomEvent<{ path?: string }>;
        const path = ce?.detail?.path || null;
        perform(path);
      } catch (err) {
        console.error('[RedirectHandler] event handler error', err);
      }
    };

    window.addEventListener('ff:auth-redirect', onEvent as EventListener);

    // On mount, check if a pending redirect was set by AuthProvider earlier
    try {
      const pending = sessionStorage.getItem('ff_pending_redirect');
      if (pending) {
        // perform it once after mount
        perform(pending);
      }
    } catch (e) {
      /* ignore */
    }

    return () => {
      window.removeEventListener('ff:auth-redirect', onEvent as EventListener);
    };
  }, [navigate]);

  return null;
};

export default RedirectHandler;
