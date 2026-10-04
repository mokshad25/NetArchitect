import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scroll to the hash target (e.g. /#vlsm) or to the top on route change. */
export default function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Wait one frame so the target section has rendered.
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}
