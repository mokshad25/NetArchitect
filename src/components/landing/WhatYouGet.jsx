import Section from '../ui/Section.jsx';
import VlsmTable from '../../features/designer/ipplan/VlsmTable.jsx';
import StatGrid from '../../features/designer/StatGrid.jsx';
import { summaryStats } from '../../features/designer/summaryStats.js';
import { nodeLinks } from '../../engine/graphBuilder.js';
import { getDemoDesign } from '../../features/landing/demoDesign.js';

function NodePreview({ graph }) {
  const node = graph.nodes.find((n) => n.id === 'SW-A');
  const links = nodeLinks(graph, node.id);
  const rows = [
    ['Type', node.role],
    ['IP', node.ip, true],
    ['Subnet', node.subnet, true],
    ['Department', node.dept],
    ['VLAN', node.vlan, true],
    [
      'Links',
      `${links.length} — ${links
        .map((l) => l.peer)
        .slice(0, 3)
        .join(', ')}…`,
      true,
    ],
  ];
  return (
    <div className="preview-card">
      <p className="label">Device</p>
      <p className="preview-title mono">{node.label}</p>
      <dl className="kv">
        {rows.map(([k, v, mono]) => (
          <div className="kv-row" key={k}>
            <dt>{k}</dt>
            <dd className={mono ? 'mono' : undefined}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ExplanationPreview({ items }) {
  const picks = items.filter((it) => /Hierarchical star|Dept A/.test(it.title)).slice(0, 2);
  return (
    <ol className="preview-card explain-list preview-explain">
      {picks.map((it, i) => (
        <li key={it.title}>
          <span className="explain-n mono">{String(i + 1).padStart(2, '0')}</span>
          <div>
            <p className="title">{it.title}</p>
            <p className="muted">{it.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function WhatYouGet() {
  const { graph, explanation, vlsm, summary, design } = getDemoDesign();
  const items = [
    [
      'Interactive diagram',
      'A layered drawing of the whole network. Click any device to see its type, IP address, subnet, department and what it links to.',
      <NodePreview key="n" graph={graph} />,
    ],
    [
      'Explanation',
      'Every decision, written for someone who is new to networking — why this topology, why this subnet size.',
      <ExplanationPreview key="e" items={explanation} />,
    ],
    [
      'IP plan',
      'A full VLSM table with masks, usable ranges and broadcast addresses, plus a bar showing how the space is packed.',
      <VlsmTable
        key="t"
        vlsm={vlsm}
        allocations={vlsm.allocations.slice(0, 3)}
        only={['name', 'hosts', 'cidr', 'mask']}
        compact
      />,
    ],
    [
      'Network summary',
      'Totals at a glance, counted from the generated graph — never typed in by hand.',
      <StatGrid key="s" stats={summaryStats(summary, design).slice(0, 4)} compact />,
    ],
  ];
  return (
    <Section id="features" label="06 — What you get" title="Four views of one design.">
      <ul className="features">
        {items.map(([title, text, preview]) => (
          <li key={title} className="feature">
            <div className="feature-copy">
              <h3 className="display h3">{title}</h3>
              <p className="muted">{text}</p>
            </div>
            <div className="feature-preview" aria-hidden="true">
              {preview}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
