import { useReveal } from '../../lib/useReveal.js';

/**
 * Editorial page section: a small label column on the left and content on
 * the right, separated from the previous section by a 1px rule.
 */
export default function Section({ id, label, title, intro, children, className = '' }) {
  const ref = useReveal();
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} className={`section ${className}`.trim()} aria-labelledby={headingId}>
      <div className="container">
        <div ref={ref} className="section-grid reveal">
          <div className="section-label">
            <span className="label">{label}</span>
          </div>
          <div className="section-body">
            {title && (
              <h2 id={headingId} className="display h2 section-title">
                {title}
              </h2>
            )}
            {intro && <p className="lede">{intro}</p>}
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
