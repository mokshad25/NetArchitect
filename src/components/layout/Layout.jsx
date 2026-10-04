import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import SkipLink from '../ui/SkipLink.jsx';
import ScrollManager from '../../lib/ScrollManager.jsx';

/** Page frame shared by every route. */
export default function Layout() {
  return (
    <>
      <SkipLink />
      <ScrollManager />
      <Navbar />
      <main id="content" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="route-loading" aria-busy="true">
              <span className="label">Loading…</span>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
