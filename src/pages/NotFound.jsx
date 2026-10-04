import { useLocation } from 'react-router-dom';
import { usePageMeta } from '../lib/usePageMeta.js';
import Button from '../components/ui/Button.jsx';

/** 404 in the site's style. */
export default function NotFound() {
  usePageMeta('Page not found');
  const { pathname } = useLocation();
  return (
    <div className="container notfound">
      <p className="label">404</p>
      <h1 className="display h1">This route has no destination.</h1>
      <p className="lede">
        Nothing lives at <span className="mono">{pathname}</span>. Like a packet with no matching route, it was dropped.
      </p>
      <div className="notfound-actions">
        <Button to="/" variant="secondary" size="lg">
          Back to the homepage
        </Button>
        <Button to="/app" variant="primary" size="lg">
          Open the designer
        </Button>
      </div>
    </div>
  );
}
