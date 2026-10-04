import { Link } from 'react-router-dom';

/**
 * Button / link-button.
 * variant: 'primary' | 'secondary' | 'ghost'   size: 'sm' | 'md' | 'lg'
 * Pass `to` for a router link or `href` for an external link.
 */
export default function Button({ variant = 'secondary', size = 'md', to, href, className = '', children, ...rest }) {
  const cls = `btn btn-${variant} btn-${size} ${className}`.trim();
  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
