import Section from '../ui/Section.jsx';

const RULES = [
  [
    'A small network in one department (24 devices or fewer)',
    'Star',
    'One central switch. Simple and cheap, but that switch is a single point of failure.',
  ],
  [
    'Several departments, many devices, or room to grow',
    'Extended / Hierarchical Star',
    'A core switch feeds one switch per department. Easy to extend; the core carries all traffic between departments.',
  ],
  [
    'High availability required',
    'Partial Mesh at the core',
    'Extra links between switches give traffic a second path. More cabling and ports in exchange for resilience.',
  ],
  [
    'A small, predictable backbone of three or four switches, no internet',
    'Ring',
    'Switches link in a loop, so every switch has two paths. Adding a switch means re-cabling the loop.',
  ],
  [
    'Mixed requirements that trigger more than one layout rule',
    'Hybrid',
    'Combines the parts that fit, e.g. a hierarchical star with a partial mesh between department switches.',
  ],
  [
    'Security or network separation needed',
    'Separate VLAN per department',
    'A feature on top of any topology. Departments cannot see each other’s traffic unless the router allows it.',
  ],
];

export default function TopologyRules() {
  return (
    <Section id="rules" label="04 — Topology rules" title="The requirements choose the topology.">
      <div className="table-wrap rules-table">
        <table className="table">
          <caption className="visually-hidden">Topology selection rules</caption>
          <thead>
            <tr>
              <th scope="col">When the requirements say</th>
              <th scope="col">NetArchitect chooses</th>
            </tr>
          </thead>
          <tbody>
            {RULES.map(([when, choice, note]) => (
              <tr key={choice}>
                <td>{when}</td>
                <td>
                  <span className="rule-choice">{choice}</span>
                  <span className="rule-note muted">{note}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
