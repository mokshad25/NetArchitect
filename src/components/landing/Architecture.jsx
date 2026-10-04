import Section from '../ui/Section.jsx';

const OUTPUTS = [
  ['graphBuilder.js', 'Diagram Generator', 'Builds the layered graph and gives every device an IP.'],
  ['explainer.js', 'Explanation Engine', 'Turns each fired rule and subnet into a sentence.'],
  ['vlsm.js', 'VLSM Calculator', 'Sizes and packs subnets into the base network.'],
];

function Box({ file, title, text, emphasis }) {
  return (
    <div className={`arch-box ${emphasis ? 'is-emphasis' : ''}`}>
      <span className="mono arch-file">{file}</span>
      <span className="title">{title}</span>
      <span className="muted arch-text">{text}</span>
    </div>
  );
}

export default function Architecture() {
  return (
    <Section id="architecture" label="03 — Architecture" title="A small engine with a clear shape.">
      <div
        className="arch"
        role="img"
        aria-label="Input flows into the rule engine, which feeds the diagram generator, explanation engine and VLSM calculator, which feed the summary."
      >
        <Box file="form" title="Input" text="Device counts and needs." />
        <span className="arch-link" aria-hidden="true" />
        <Box file="ruleEngine.js" title="Rule Engine" text="If-then rules pick the topology and features." emphasis />
        <span className="arch-link arch-fork" aria-hidden="true" />
        <div className="arch-stack">
          {OUTPUTS.map(([file, title, text]) => (
            <Box key={file} file={file} title={title} text={text} />
          ))}
        </div>
        <span className="arch-link arch-join" aria-hidden="true" />
        <Box file="summary.js" title="Summary" text="Totals at a glance, counted from the graph." />
      </div>
      <p className="prose arch-note">
        The engine is plain JavaScript in <code>src/engine/</code>. It has no dependency on React or the browser, so the
        same functions power the designer, compute the numbers on this page, and run under Vitest. The rules are data:
        adding a rule means adding one object to an array.
      </p>
    </Section>
  );
}
