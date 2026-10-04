import { Link } from 'react-router-dom';

/** Serif wordmark with a minimal node mark. */
export default function Wordmark() {
  return (
    <Link to="/" className="wordmark" aria-label="NetArchitect home">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="wordmark-mark">
        <path d="M12 5v6M12 11L5 18M12 11l7 7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="4" r="2.25" fill="var(--accent)" />
        <circle cx="5" cy="19" r="2.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="19" cy="19" r="2.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span>NetArchitect</span>
    </Link>
  );
}
