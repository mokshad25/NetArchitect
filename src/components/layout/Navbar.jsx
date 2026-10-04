import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import Wordmark from './Wordmark.jsx';
import Button from '../ui/Button.jsx';
import IconButton from '../ui/IconButton.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { GITHUB_URL } from '../../config/site.js';

const LINKS = [
  { to: '/#how', label: 'How it works' },
  { to: '/#vlsm', label: 'VLSM' },
  { to: '/#tech', label: 'Tech' },
  { to: '/docs', label: 'Docs', nav: true },
];

/** Shared top navigation. Collapses into a menu panel on small screens. */
export default function Navbar() {
  const location = useLocation();
  // The menu is open for the location it was opened on, so navigating closes it.
  const [openedAt, setOpenedAt] = useState(null);
  const open = openedAt === location.key;

  const links = LINKS.map((l) =>
    l.nav ? (
      <NavLink key={l.to} to={l.to} className="nav-link">
        {l.label}
      </NavLink>
    ) : (
      <Link key={l.to} to={l.to} className="nav-link">
        {l.label}
      </Link>
    ),
  );

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Wordmark />
        <nav className="nav-links" aria-label="Main">
          {links}
          <a className="nav-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
            GitHub
            <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
          </a>
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <Button to="/app" variant="primary" size="sm" className="nav-cta">
            Open the app
          </Button>
          <IconButton
            label={open ? 'Close menu' : 'Open menu'}
            className="nav-menu-btn"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpenedAt(open ? null : location.key)}
          >
            {open ? (
              <X size={18} strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Menu size={18} strokeWidth={1.5} aria-hidden="true" />
            )}
          </IconButton>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Main mobile">
          <div className="container">
            {links}
            <a className="nav-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <Button to="/app" variant="primary" size="md">
              Open the app
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
