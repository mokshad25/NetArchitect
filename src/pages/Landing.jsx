import { usePageMeta } from '../lib/usePageMeta.js';
import Hero from '../components/landing/Hero.jsx';
import Problem from '../components/landing/Problem.jsx';
import HowItWorks from '../components/landing/HowItWorks.jsx';
import Architecture from '../components/landing/Architecture.jsx';
import TopologyRules from '../components/landing/TopologyRules.jsx';
import VlsmExplained from '../components/landing/VlsmExplained.jsx';
import WhatYouGet from '../components/landing/WhatYouGet.jsx';
import TechStack from '../components/landing/TechStack.jsx';
import Roadmap from '../components/landing/Roadmap.jsx';
import ClosingCta from '../components/landing/ClosingCta.jsx';
import '../components/landing/landing.css';

/** "/" — the landing page. */
export default function Landing() {
  usePageMeta(null);
  return (
    <>
      <Hero />
      <Problem />
      <HowItWorks />
      <Architecture />
      <TopologyRules />
      <VlsmExplained />
      <WhatYouGet />
      <TechStack />
      <Roadmap />
      <ClosingCta />
    </>
  );
}
