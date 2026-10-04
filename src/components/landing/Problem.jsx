import Section from '../ui/Section.jsx';

export default function Problem() {
  return (
    <Section id="problem" label="01 — The problem" title="Network design starts with the wrong question.">
      <div className="two-col prose-cols">
        <p>
          Designing even a small office network asks for three kinds of expertise at once: choosing a topology, placing
          switches, routers and access points, and planning IP addresses so every subnet fits without waste.
        </p>
        <p>
          Beginners usually start by picking a topology — “let’s use a star” — before they understand what the network
          needs to do. NetArchitect reverses that. You state the requirements; the design follows from them, with every
          decision written down.
        </p>
      </div>
    </Section>
  );
}
