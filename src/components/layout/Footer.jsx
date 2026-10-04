import { Link } from 'react-router-dom';
import { GITHUB_URL, SITE, TEAM_NAMES } from '../../config/site.js';

/** Shared minimal footer. */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-name display">{SITE.name}</p>
          <p className="muted">{SITE.institution}</p>
        </div>
        <div>
          <p className="label">Team</p>
          <ul className="footer-list">
            {TEAM_NAMES.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label">Links</p>
          <ul className="footer-list">
            <li>
              <Link to="/app">Designer</Link>
            </li>
            <li>
              <Link to="/docs">Docs</Link>
            </li>
            <li>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </li>
          </ul>
        </div>
        <p className="footer-meta muted">
          © {new Date().getFullYear()} {SITE.name}. Runs entirely in your browser.
        </p>
      </div>
    </footer>
  );
}
