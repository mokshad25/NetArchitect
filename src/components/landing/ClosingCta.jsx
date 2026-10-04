import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { useReveal } from '../../lib/useReveal.js';

export default function ClosingCta() {
  const ref = useReveal();
  return (
    <section className="cta" aria-labelledby="cta-title">
      <div className="container">
        <div ref={ref} className="reveal cta-inner">
          <h2 id="cta-title" className="display h2">
            Turn plain requirements into a network that is chosen, drawn, explained and addressed automatically.
          </h2>
          <Button to="/app" variant="primary" size="lg">
            Open the designer
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
