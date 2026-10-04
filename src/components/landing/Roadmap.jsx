import Section from '../ui/Section.jsx';
import Badge from '../ui/Badge.jsx';

const ITEMS = [
  ['IPv6 addressing', 'Plan /64 subnets alongside the IPv4 VLSM plan.'],
  ['Export to Cisco Packet Tracer', 'Open the generated network as a ready-to-simulate project.'],
  ['VLAN and routing config generation', 'Switch and router CLI commands for the chosen design.'],
  ['Hardware cost estimation', 'A rough bill of materials for switches, routers and access points.'],
];

export default function Roadmap() {
  return (
    <Section id="roadmap" label="08 — Roadmap" title="What comes next.">
      <dl className="spec-list">
        {ITEMS.map(([name, text]) => (
          <div key={name} className="spec-row">
            <dt>
              {name} <Badge>Planned</Badge>
            </dt>
            <dd className="muted">{text}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
