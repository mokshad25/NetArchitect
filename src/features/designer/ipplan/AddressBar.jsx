import './addressBar.css';
import { shortIp, intToIp } from '../../../engine/ipUtils.js';
import { segmentColor } from './segmentColor.js';

const MIN_LABEL_SHARE = 0.06; // hide labels on blocks narrower than 6% of the bar

/**
 * Horizontal bar showing how the base network is packed: one block per
 * subnet (in address order), free space shown as an empty block.
 * `ranges` picks which free-space view to show ('total' or 'core').
 */
export default function AddressBar({ vlsm, ranges = 'total', allocations = vlsm.allocations }) {
  const { base } = vlsm;
  const blocks = [
    ...allocations.map((a) => ({
      key: a.id,
      start: a.networkInt,
      size: a.blockSize,
      label: a.name,
      title: `${a.name}: ${a.cidr} (${a.blockSize} addresses)`,
      color: segmentColor(vlsm.allocations.indexOf(a)),
    })),
    ...vlsm[ranges].freeRanges.map((r) => ({
      key: `free-${r.startInt}`,
      start: r.startInt,
      size: r.size,
      label: `Free · ${r.size}`,
      title: `Free: ${r.start} – ${r.end} (${r.size} addresses)`,
      free: true,
    })),
  ].sort((a, b) => a.start - b.start);

  const share = (b) => b.size / base.size;
  return (
    <figure className="addr" aria-label={`Address space of ${base.cidr}`}>
      <div className="addr-row addr-labels" aria-hidden="true">
        {blocks.map((b) => (
          <span key={b.key} style={{ flexGrow: b.size }} className={b.free ? 'is-free' : ''}>
            {share(b) >= MIN_LABEL_SHARE ? b.label : ''}
          </span>
        ))}
      </div>
      <div className="addr-row addr-bar" role="list">
        {blocks.map((b) => (
          <span
            key={b.key}
            role="listitem"
            title={b.title}
            aria-label={b.title}
            className={`addr-block ${b.free ? 'is-free' : ''}`}
            style={{ flexGrow: b.size, background: b.free ? undefined : b.color }}
          />
        ))}
      </div>
      <div className="addr-row addr-offsets mono" aria-hidden="true">
        {blocks.map((b) => (
          <span key={b.key} style={{ flexGrow: b.size }}>
            {share(b) >= MIN_LABEL_SHARE ? shortIp(b.start) : ''}
          </span>
        ))}
        <span className="addr-end">{shortIp(base.network + base.size - 1)}</span>
      </div>
      <figcaption className="visually-hidden">
        {blocks.map((b) => b.title).join('; ')}. Range {intToIp(base.network)} to{' '}
        {intToIp(base.network + base.size - 1)}.
      </figcaption>
    </figure>
  );
}
