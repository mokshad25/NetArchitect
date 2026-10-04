import Section from '../ui/Section.jsx';
import Table from '../ui/Table.jsx';
import AddressBar from '../../features/designer/ipplan/AddressBar.jsx';
import { getDemoDesign, vlsmExampleRows, vlsmExampleUsage } from '../../features/landing/demoDesign.js';

const STEPS = [
  ['Sort', 'Order the segments by host count, largest first.'],
  [
    'Size',
    'For each, pick the smallest power-of-two block that fits hosts + 2 — one address for the network, one for broadcast.',
  ],
  ['Allocate', 'Place the block at the next free address aligned to its size, then repeat for the next segment.'],
];

const COLUMNS = [
  { key: 'name', label: 'Segment' },
  { key: 'hosts', label: 'Hosts', align: 'right', mono: true },
  { key: 'cidr', label: 'Network', mono: true },
  { key: 'mask', label: 'Mask', mono: true },
  { key: 'usable', label: 'Usable', mono: true },
  { key: 'broadcast', label: 'Broadcast', mono: true },
];

export default function VlsmExplained() {
  const { vlsm } = getDemoDesign();
  const rows = vlsmExampleRows();
  const usage = vlsmExampleUsage();
  const core = vlsm.allocations.filter((a) => a.phase === 'core');
  return (
    <Section id="vlsm" label="05 — VLSM, explained" title="Subnets sized to fit, not rounded up to the same size.">
      <div className="two-col">
        <div className="prose">
          <p>
            Variable Length Subnet Masking gives each segment a block that matches its size. Fixed-size subnetting would
            hand every segment the same block — a /26 for a two-address router link wastes 62 addresses. VLSM gives that
            link a /30 and keeps the rest free.
          </p>
        </div>
        <ol className="vlsm-steps">
          {STEPS.map(([title, text], i) => (
            <li key={title}>
              <span className="step-n mono">{i + 1}</span>
              <div>
                <p className="title">{title}</p>
                <p className="muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="worked">
        <div className="worked-head">
          <p className="label">Worked example</p>
          <p className="mono worked-base">{usage.base}</p>
        </div>
        <AddressBar vlsm={vlsm} allocations={core} ranges="core" />
        <Table columns={COLUMNS} rows={rows} rowKey={(r) => r.id} caption="VLSM worked example for 192.168.10.0/24" />
        <p className="worked-usage">
          <span className="display worked-num">{usage.used}</span>
          <span>
            of {usage.size} addresses used.{' '}
            <span className="mono">
              {usage.freeFrom}–{usage.freeTo}
            </span>{' '}
            is free ({usage.free} addresses) for growth.
          </span>
        </p>
        <p className="footnote muted">
          Computed live by <code>calculateVlsm()</code> from the engine — the same function the designer runs. Host
          counts include each segment’s gateway.
        </p>
      </div>
    </Section>
  );
}
