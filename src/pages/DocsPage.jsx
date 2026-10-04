import { usePageMeta } from '../lib/usePageMeta.js';
import Table from '../components/ui/Table.jsx';
import Button from '../components/ui/Button.jsx';
import { RULES } from '../engine/ruleEngine.js';
import { COLLAPSE_THRESHOLD, COLLAPSE_SAMPLES } from '../engine/constants.js';
import './docs.css';

const TOC = [
  ['pipeline', 'The pipeline'],
  ['inputs', 'Inputs'],
  ['rules', 'Rule engine'],
  ['addressing', 'Addressing'],
  ['diagram', 'Diagram'],
  ['testing', 'Testing'],
  ['limits', 'Limitations'],
];

const RULE_TEXT = {
  star: '24 devices or fewer, one department, no scalability requirement.',
  ring: '3–4 departments, 24 devices or fewer, no internet, no scalability.',
  hierarchical: 'More than one department, more than 24 devices, or scalability — unless the ring rule fired.',
  redundancy:
    'Redundancy ticked (and not already a ring). Links neighbouring department switches, or adds a backup core.',
  vlan: 'Security / isolation or network separation ticked. One VLAN per department.',
  wifi: 'Wi-Fi ticked. Adds AP-1 and a Wi-Fi segment; laptops connect wirelessly.',
  internet: 'Internet ticked. Adds R1, the internet cloud and a /30 router link.',
  servers: 'One or more servers. Adds a server segment on the core switch.',
};

const NAMING = [
  { key: 'pattern', label: 'Pattern', mono: true },
  { key: 'meaning', label: 'Meaning' },
];
const NAMES = [
  { pattern: 'R1', meaning: 'Edge router' },
  { pattern: 'SW-CORE', meaning: 'Core switch (SW-CORE-2 is the backup core)' },
  { pattern: 'SW-A, SW-ADM', meaning: 'Department switch — “Dept A” → A, other names → first three letters' },
  { pattern: 'PC-A1, PRN-A1', meaning: 'PCs and printers, numbered per department' },
  { pattern: 'SRV-1, AP-1, LAP-1', meaning: 'Servers, access point and wireless laptops' },
];

function DocSection({ id, title, children }) {
  return (
    <section id={id} className="doc-section" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="display h3">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** /docs — how NetArchitect works, in more depth. */
export default function DocsPage() {
  usePageMeta(
    'Docs',
    'How NetArchitect turns requirements into a topology, a diagram, an explanation and a VLSM IP plan.',
  );
  return (
    <div className="container docs">
      <header className="docs-header">
        <p className="label">Documentation</p>
        <h1 className="display h2">How NetArchitect works</h1>
        <p className="lede">
          A closer look at the rules, the addressing conventions and the decisions behind the diagram.
        </p>
      </header>
      <div className="docs-grid">
        <nav className="docs-toc" aria-label="On this page">
          <p className="label">On this page</p>
          <ol>
            {TOC.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`}>{label}</a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="docs-body prose">
          <DocSection id="pipeline" title="The pipeline">
            <p>
              Every design runs the same pipeline, implemented as plain functions in <code>src/engine/</code>:
            </p>
            <ol className="doc-list">
              <li>
                <code>validateRequirements</code> checks the form and returns friendly errors.
              </li>
              <li>
                <code>evaluateRules</code> runs the rule array and decides topology and features.
              </li>
              <li>
                <code>buildSegments</code> lists the subnets the design needs.
              </li>
              <li>
                <code>calculateVlsm</code> sizes and places them in the base network.
              </li>
              <li>
                <code>buildGraph</code> lays out nodes and links and hands out IP addresses.
              </li>
              <li>
                <code>explainDesign</code> and <code>computeSummary</code> describe and count the result.
              </li>
            </ol>
          </DocSection>

          <DocSection id="inputs" title="Inputs">
            <p>
              You enter totals for PCs, laptops, servers and printers, and a number of departments. PCs and printers are
              split evenly across departments by default; edit any row and the split stops being automatic until you
              re-split. The per-department totals must add up to the overall counts.
            </p>
            <p>
              When Wi-Fi is on, laptops join the wireless segment. When it is off, laptops are wired into their
              departments and each department row gets a laptops column.
            </p>
          </DocSection>

          <DocSection id="rules" title="Rule engine">
            <p>
              Rules are objects of the form <code>{'{ id, kind, condition, action, reason }'}</code>. They run in order,
              and a later rule can see what earlier rules decided. Each rule that fires records a plain-English reason.
              If two or more structural rules fire, the result is labelled a <em>Hybrid</em>.
            </p>
            <dl className="spec-list">
              {RULES.map((r) => (
                <div className="spec-row" key={r.id}>
                  <dt>
                    <code>{r.id}</code> <span className="muted doc-kind">{r.kind}</span>
                  </dt>
                  <dd>{RULE_TEXT[r.id]}</dd>
                </div>
              ))}
            </dl>
          </DocSection>

          <DocSection id="addressing" title="Addressing">
            <p>
              <strong>Host counts include the gateway.</strong> The first usable address of every segment goes to its
              gateway: the department switch, the server-segment gateway on the core switch, or the access point for
              Wi-Fi. A department with 59 devices therefore needs 60 hosts.
            </p>
            <p>
              Block size is the smallest power of two that is at least hosts + 2, with a minimum of 4 (a /30). Blocks
              are placed largest first at the next address aligned to their size, which packs them without gaps.
            </p>
            <p>
              Wi-Fi is an <em>extension</em> segment: it is placed after the wired segments, in the remaining free
              space. That keeps the core plan contiguous from the start of the range. If the segments do not fit, the
              error suggests the smallest base network that would.
            </p>
          </DocSection>

          <DocSection id="diagram" title="Diagram">
            <p>
              The diagram has five layers: internet, router, core, distribution (department switches, servers, access
              point) and end devices. Solid lines are normal links, dashed lines are redundant links and dotted lines
              are wireless.
            </p>
            <p>
              Groups larger than {COLLAPSE_THRESHOLD} devices are drawn as {COLLAPSE_SAMPLES} samples plus a “+N more”
              node. Collapsed nodes still carry their device count and IP range, so summary totals stay exact.
            </p>
            <Table columns={NAMING} rows={NAMES} rowKey={(r) => r.pattern} caption="Device naming" compact />
          </DocSection>

          <DocSection id="testing" title="Testing">
            <p>
              Vitest covers the VLSM calculator (the demo scenario, overflow, 0-host segments), the rule engine (star,
              hierarchical, hybrid, VLAN, custom rules), the graph builder and summary (counts match the graph, every
              device has an address), validation, and the numbers shown on the landing page.
            </p>
            <pre className="code">npm test</pre>
          </DocSection>

          <DocSection id="limits" title="Limitations">
            <p>
              NetArchitect is a teaching tool. It plans IPv4 only, assumes one site, and does not model link speeds,
              Spanning Tree or routing protocols. Those are on the roadmap as configuration generation and IPv6 support.
            </p>
            <Button to="/app" variant="primary" size="md">
              Open the designer
            </Button>
          </DocSection>
        </article>
      </div>
    </div>
  );
}
