import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface ScrollToTopProps {
  behavior?: ScrollBehavior;
}

export default function ScrollToTop({ behavior = 'auto' }: ScrollToTopProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior });
    } catch (e) {
      // fallback
      window.scrollTo(0, 0);
    }
  }, [pathname, behavior]);

  return null;
}
