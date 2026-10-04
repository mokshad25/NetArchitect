import { PATHS } from '../../features/designer/diagram/diagramIcons.js';

/*
 * Static line-art preview of the demo network, drawn with theme tokens.
 * Layers: Internet → R1 → SW-CORE → department switches / servers / AP → devices.
 */
const N = {
  internet: { x: 340, y: 34, type: 'cloud', label: 'Internet' },
  r1: { x: 340, y: 104, type: 'router', label: 'R1', ip: '.121', accent: true },
  core: { x: 340, y: 178, type: 'switch', label: 'SW-CORE', ip: '.122', accent: true },
  a: { x: 100, y: 262, type: 'switch', label: 'SW-A', ip: '.1' },
  b: { x: 240, y: 262, type: 'switch', label: 'SW-B', ip: '.65' },
  adm: { x: 380, y: 262, type: 'switch', label: 'SW-ADM', ip: '.97' },
  srv: { x: 500, y: 262, type: 'server', label: 'SRV ×5', ip: '.114' },
  ap: { x: 610, y: 262, type: 'ap', label: 'AP-1', ip: '.129' },
};
const DEVICES = [
  ['a', 60, 'pc', 'PC-A1'],
  ['a', 100, 'pc', 'PC-A2'],
  ['a', 140, 'more', '+57'],
  ['b', 200, 'pc', 'PC-B1'],
  ['b', 240, 'printer', 'PRN-B1'],
  ['b', 280, 'more', '+27'],
  ['adm', 356, 'pc', 'PC-ADM1'],
  ['adm', 408, 'more', '+10'],
  ['ap', 580, 'laptop', 'LAP-1'],
  ['ap', 640, 'laptop', 'LAP-2'],
];
const DEVICE_Y = 346;

function Tile({ x, y, type, label, ip, accent, small }) {
  const s = small ? 22 : 28;
  const scale = (s - 8) / 24;
  if (type === 'cloud') {
    return (
      <g transform={`translate(${x - 16} ${y - 14})`}>
        <g className="hd-icon" transform="scale(1.35)" dangerouslySetInnerHTML={{ __html: PATHS.cloud }} />
        <text className="hd-label" x="16" y="44" textAnchor="middle">
          {label}
        </text>
      </g>
    );
  }
  return (
    <g transform={`translate(${x - s / 2} ${y - s / 2})`}>
      <rect
        className={`hd-tile ${type === 'more' ? 'is-more' : ''}`}
        x="0.5"
        y="0.5"
        width={s - 1}
        height={s - 1}
        rx="5"
      />
      <g
        className={`hd-icon ${accent ? 'is-accent' : ''} ${type === 'more' ? 'is-muted' : ''}`}
        transform={`translate(4 4) scale(${scale})`}
        dangerouslySetInnerHTML={{ __html: PATHS[type] }}
      />
      <text className="hd-label" x={s / 2} y={s + 13} textAnchor="middle">
        {label}
      </text>
      {ip && (
        <text className="hd-ip" x={s / 2} y={s + 25} textAnchor="middle">
          {ip}
        </text>
      )}
    </g>
  );
}

export default function HeroDiagram() {
  const link = (from, to, cls = 'hd-edge') => (
    <path
      key={`${from.x}-${to.x}-${to.y}`}
      className={cls}
      d={`M${from.x} ${from.y}C${from.x} ${(from.y + to.y) / 2} ${to.x} ${(from.y + to.y) / 2} ${to.x} ${to.y}`}
    />
  );
  return (
    <svg className="hero-diagram" viewBox="0 0 680 400" role="img" aria-labelledby="hd-title hd-desc">
      <title id="hd-title">Generated network for the demo scenario</title>
      <desc id="hd-desc">
        A layered network: the internet connects to router R1, then the core switch, then switches for Dept A, Dept B
        and Admin, plus servers and a Wi-Fi access point. Dashed lines between department switches are redundant links;
        dotted lines are wireless.
      </desc>
      <g fill="none">
        {link({ x: 340, y: 50 }, { x: 340, y: 90 })}
        {link({ x: 340, y: 118 }, { x: 340, y: 164 })}
        {['a', 'b', 'adm', 'srv', 'ap'].map((k) => link({ x: 340, y: 192 }, { x: N[k].x, y: 248 }))}
        {DEVICES.map(([p, x, type]) =>
          link(
            { x: N[p].x, y: 302 },
            { x, y: DEVICE_Y - 11 },
            p === 'ap' ? 'hd-edge is-wireless' : type === 'more' ? 'hd-edge is-faint' : 'hd-edge',
          ),
        )}
        <path className="hd-edge is-redundant" d="M114 256 Q170 232 226 256" />
        <path className="hd-edge is-redundant" d="M254 256 Q310 232 366 256" />
      </g>
      {Object.entries(N).map(([k, n]) => (
        <Tile key={k} {...n} />
      ))}
      {DEVICES.map(([, x, type, label]) => (
        <Tile key={label} x={x} y={DEVICE_Y} type={type} label={label} small />
      ))}
    </svg>
  );
}
