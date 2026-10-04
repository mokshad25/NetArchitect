import Section from '../ui/Section.jsx';

const STACK = [
  ['React 19', 'UI components and state.'],
  ['Vite', 'Dev server and production build, with code-splitting per route.'],
  ['vis-network', 'Renders the hierarchical network diagram on a canvas.'],
  ['React Router', 'Routes for the landing page, designer and docs.'],
  ['Vitest', 'Unit tests for the rule engine, VLSM calculator and graph builder.'],
  ['CSS variables', 'Plain CSS with design tokens for both themes. No CSS framework.'],
];

export default function TechStack() {
  return (
    <Section id="tech" label="07 — Tech" title="Plain tools, no backend.">
      <dl className="spec-list">
        {STACK.map(([name, text]) => (
          <div key={name} className="spec-row">
            <dt>{name}</dt>
            <dd className="muted">{text}</dd>
          </div>
        ))}
      </dl>
      <p className="footnote muted">Everything runs in your browser. Nothing you enter leaves your machine.</p>
    </Section>
  );
}
