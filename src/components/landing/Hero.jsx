import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button.jsx';
import HeroDiagram from './HeroDiagram.jsx';
import { getDemoDesign } from '../../features/landing/demoDesign.js';

export default function Hero() {
  const { summary, design, vlsm } = getDemoDesign();
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container">
        <p className="label hero-kicker">Requirement-driven network design</p>
        <h1 id="hero-title" className="display h1 hero-title">
          You describe the needs. <em>NetArchitect</em> designs the network.
        </h1>
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="lede">
              Enter device counts and requirements. Get a recommended topology, an interactive diagram, a plain‑English
              explanation and a complete VLSM IP plan.
            </p>
            <div className="hero-actions">
              <Button to="/app" variant="primary" size="lg">
                Open the designer
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </Button>
              <Button href="#how" variant="secondary" size="lg">
                See how it works
              </Button>
            </div>
          </div>
          <figure className="hero-figure">
            <HeroDiagram />
            <figcaption className="hero-caption">
              <span className="label">Demo output</span>
              <span className="mono">
                {design.topologyLabel} · {summary.endDevices} devices · {summary.segments} subnets in {vlsm.base.cidr}
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
