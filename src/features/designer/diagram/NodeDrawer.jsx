import { X } from 'lucide-react';
import { TYPE_LABELS, nodeLinks } from '../../../engine/graphBuilder.js';
import IconButton from '../../../components/ui/IconButton.jsx';

const KIND_LABEL = { normal: 'Link', redundant: 'Redundant', wireless: 'Wireless' };
const TYPE_PLURAL = { pc: 'PCs', printer: 'printers', laptop: 'laptops', server: 'servers' };

/** Rows of [label, value, mono?] describing a node. */
function describe(node, linkCount) {
  const rows = [
    ['Type', node.role || TYPE_LABELS[node.type]],
    ['Name', node.label],
    ['IP', node.ip || node.ipRange || (node.type === 'cloud' ? 'Public (ISP)' : '—'), true],
    ...node.extraIps.map((x) => [x.label, x.ip, true]),
    ['Subnet', node.subnet || '—', true],
    ['Mask', node.mask || '—', true],
    ['Department', node.dept || '—'],
    ['VLAN', node.vlan ?? '—', true],
    ['Links', linkCount, true],
  ];
  if (node.type === 'more') {
    const parts = Object.entries(node.breakdown).map(([t, c]) => `${c} ${TYPE_PLURAL[t] || t}`);
    rows.splice(
      1,
      1,
      ['Represents', `${node.count} devices (${parts.join(', ')})`],
      ['Names', `${node.members[0]} … ${node.members.at(-1)}`, true],
    );
  }
  return rows;
}

/** Right-side drawer (bottom sheet on mobile) for the selected node. */
export default function NodeDrawer({ graph, nodeId, onSelect, onClose }) {
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  const links = nodeLinks(graph, node.id);
  const labelOf = (id) => graph.nodes.find((n) => n.id === id)?.label ?? id;
  return (
    <aside className="drawer" aria-label={`Details for ${node.label}`} aria-live="polite">
      <div className="drawer-head">
        <div>
          <p className="label">{TYPE_LABELS[node.type]}</p>
          <h3 className="drawer-title">{node.label}</h3>
        </div>
        <IconButton label="Close details" onClick={onClose}>
          <X size={16} strokeWidth={1.5} aria-hidden="true" />
        </IconButton>
      </div>
      <dl className="kv">
        {describe(node, links.length).map(([k, v, mono]) => (
          <div className="kv-row" key={k}>
            <dt>{k}</dt>
            <dd className={mono ? 'mono' : undefined}>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="label drawer-sub">Connected to</p>
      <ul className="drawer-links">
        {links.map((l, i) => (
          <li key={i}>
            <button type="button" onClick={() => onSelect(l.peer, true)}>
              <span className={`line-sample is-${l.kind}`} aria-hidden="true" />
              <span className="mono">{labelOf(l.peer)}</span>
              <span className="muted">{KIND_LABEL[l.kind]}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
