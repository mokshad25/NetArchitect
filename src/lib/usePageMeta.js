import { useEffect } from 'react';
import { SITE } from '../config/site.js';

function setMeta(selector, value) {
  document.querySelector(selector)?.setAttribute('content', value);
}

/** Set the document title and description for the current route. */
export function usePageMeta(title, description = SITE.description) {
  useEffect(() => {
    const full = title ? `${title} — ${SITE.name}` : `${SITE.name} — Requirement-driven network topology designer`;
    document.title = full;
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', full);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[name="twitter:title"]', full);
    setMeta('meta[name="twitter:description"]', description);
  }, [title, description]);
}
