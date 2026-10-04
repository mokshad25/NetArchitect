import { CircleAlert } from 'lucide-react';
import AddressBar from './AddressBar.jsx';
import VlsmTable from './VlsmTable.jsx';
import Button from '../../../components/ui/Button.jsx';
import { shortIp } from '../../../engine/ipUtils.js';

const rangesText = (ranges) => ranges.map((r) => `${shortIp(r.startInt)}–${shortIp(r.endInt)}`).join(', ') || 'none';

/** IP Plan tab: usage figures, address bar and the allocation table. */
export default function IpPlan({ vlsm, segments, onUseBase }) {
  if (!vlsm.ok) {
    return (
      <div className="notice notice-danger" role="alert">
        <CircleAlert size={18} strokeWidth={1.5} aria-hidden="true" />
        <div>
          <p className="title">The segments do not fit</p>
          <p>{vlsm.error}</p>
          {vlsm.suggestion && (
            <Button variant="secondary" size="sm" onClick={() => onUseBase(vlsm.suggestion)}>
              Use {vlsm.suggestion}
            </Button>
          )}
        </div>
      </div>
    );
  }
  const vlans = Object.fromEntries(segments.map((s) => [s.id, s.vlan]));
  const hasExt = vlsm.allocations.some((a) => a.phase === 'extension');
  return (
    <div className="ipplan">
      <header className="panel-head">
        <p className="label">Base network</p>
        <h2 className="display h3 mono-title">{vlsm.base.cidr}</h2>
      </header>
      <dl className="usage">
        <div>
          <dt className="label">Core segments</dt>
          <dd>
            <span className="num usage-num">{vlsm.core.used}</span>
            <span className="muted"> / {vlsm.base.size} used</span>
            <span className="mono muted usage-free">
              free {rangesText(vlsm.core.freeRanges)} ({vlsm.core.free})
            </span>
          </dd>
        </div>
        {hasExt && (
          <div>
            <dt className="label">Including Wi-Fi</dt>
            <dd>
              <span className="num usage-num">{vlsm.total.used}</span>
              <span className="muted"> / {vlsm.base.size} used</span>
              <span className="mono muted usage-free">
                free {rangesText(vlsm.total.freeRanges)} ({vlsm.total.free})
              </span>
            </dd>
          </div>
        )}
      </dl>
      <AddressBar vlsm={vlsm} />
      <VlsmTable vlsm={vlsm} vlans={vlans} />
      <p className="footnote muted">
        Host counts include the gateway (department switch, server gateway or access point). Each block is the smallest
        power of two that fits hosts + 2 (network and broadcast).
        {vlsm.skipped.length > 0 && ` Skipped with 0 hosts: ${vlsm.skipped.join(', ')}.`}
      </p>
    </div>
  );
}
