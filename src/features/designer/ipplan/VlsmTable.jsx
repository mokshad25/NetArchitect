import Table from '../../../components/ui/Table.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import { segmentColor } from './segmentColor.js';

/**
 * VLSM allocation table. `vlans` maps segment id → VLAN (optional column);
 * `only` limits the columns shown (by key), e.g. for small previews.
 */
export default function VlsmTable({ vlsm, allocations = vlsm.allocations, vlans, compact, only }) {
  let columns = [
    {
      key: 'name',
      label: 'Segment',
      render: (a) => (
        <span className="seg-name">
          <span
            className="swatch"
            style={{ background: segmentColor(vlsm.allocations.indexOf(a)) }}
            aria-hidden="true"
          />
          {a.name}
          {a.phase === 'extension' && <Badge>Added last</Badge>}
        </span>
      ),
    },
    { key: 'hosts', label: 'Hosts', align: 'right', mono: true },
    { key: 'cidr', label: 'Network', mono: true },
    { key: 'mask', label: 'Mask', mono: true },
    {
      key: 'range',
      label: 'Usable range',
      mono: true,
      render: (a) => `${a.firstUsable} – .${a.lastUsable.split('.')[3]}`,
    },
    { key: 'broadcast', label: 'Broadcast', mono: true },
    { key: 'blockSize', label: 'Block', align: 'right', mono: true },
  ];
  if (only) columns = columns.filter((c) => only.includes(c.key));
  if (vlans)
    columns.push({ key: 'vlan', label: 'VLAN', align: 'right', mono: true, render: (a) => vlans[a.id] ?? '—' });
  return (
    <Table columns={columns} rows={allocations} rowKey={(a) => a.id} caption="VLSM allocation" compact={compact} />
  );
}
