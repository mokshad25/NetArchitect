import Section from '../ui/Section.jsx';

const STEPS = [
  [
    'Requirements',
    'Enter how many PCs, laptops, servers and printers you have, how they split into departments, and what the network must support.',
  ],
  ['Analyze', 'A rule engine checks your inputs against a set of if-then rules, such as “more than one department”.'],
  [
    'Recommend topology',
    'The rules that apply decide the layout: star, hierarchical star, ring, partial mesh, or a hybrid of them.',
  ],
  [
    'Draw network',
    'A layered diagram is generated, from the internet down to every device. Click any device to inspect it.',
  ],
  [
    'Explain design',
    'Each decision comes with a short, plain-English reason, so you can defend the design, not just copy it.',
  ],
  [
    'Assign IPs (VLSM)',
    'Subnets are sized to fit each segment and packed into your base network, and every device gets an address.',
  ],
];

export default function HowItWorks() {
  return (
    <Section id="how" label="02 — How it works" title="Six steps, from a list of needs to an addressed network.">
      <ol className="steps">
        {STEPS.map(([title, text], i) => (
          <li key={title} className="step">
            <span className="step-n mono">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="title">{title}</h3>
            <p className="muted">{text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
