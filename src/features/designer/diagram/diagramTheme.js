/**
 * Converts engine nodes/edges into vis-network items styled with the active
 * theme's CSS variables. Pure functions: pass in the colors from readVars().
 */
import { LEVEL } from '../../../engine/graphBuilder.js';
import { iconFor } from './diagramIcons.js';

export const DIAGRAM_VARS = [
  '--node-fill',
  '--node-stroke',
  '--node-muted',
  '--border-strong',
  '--text',
  '--text-muted',
  '--accent',
  '--edge',
  '--edge-redundant',
  '--edge-wireless',
  '--canvas',
];

const SANS = "'Inter Tight Variable', 'Inter Tight', system-ui, sans-serif";
const MONO = "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace";

export function toVisNode(n, c) {
  const infra = n.level <= LEVEL.distribution;
  // Routers / switches show the full IP; other devices only the last octet.
  const fullIp = n.type === 'router' || n.type === 'switch';
  const ip = n.ip ? (fullIp ? n.ip : '.' + n.ip.split('.')[3]) : '';
  return {
    id: n.id,
    level: n.level,
    shape: 'image',
    image: iconFor(n.type, n.role, c),
    size: n.type === 'cloud' ? 26 : infra ? 18 : 14,
    label: ip ? `${n.label}\n<code>${ip}</code>` : n.label,
    font: {
      multi: 'html',
      face: SANS,
      size: infra ? 13 : 11,
      color: n.type === 'more' ? c['--text-muted'] : c['--text'],
      strokeWidth: 3,
      strokeColor: c['--canvas'],
      mono: { face: MONO, size: infra ? 11 : 10, color: c['--text-muted'], vadjust: 2 },
    },
    color: { highlight: { border: c['--accent'] }, hover: { border: c['--accent'] } },
    shapeProperties: { useBorderWithImage: false, interpolation: false },
  };
}

export function toVisEdge(e, c, levelOf) {
  const base = { id: e.id, from: e.from, to: e.to, width: 1, selectionWidth: 1, hoverWidth: 0.5 };
  if (e.kind === 'redundant') {
    return {
      ...base,
      width: 1.5,
      color: { color: c['--edge-redundant'], highlight: c['--edge-redundant'], hover: c['--edge-redundant'] },
      dashes: [6, 5],
      smooth: { enabled: true, type: 'curvedCW', roundness: 0.3 },
    };
  }
  if (e.kind === 'wireless') {
    return {
      ...base,
      color: { color: c['--edge-wireless'], highlight: c['--accent'], hover: c['--accent'] },
      dashes: [1.5, 4],
      width: 1.5,
    };
  }
  const edge = { ...base, color: { color: c['--edge'], highlight: c['--accent'], hover: c['--accent'] } };
  // Same-layer links (ring backbone) curve so they don't hide behind each other.
  if (levelOf[e.from] === levelOf[e.to]) {
    edge.smooth = { enabled: true, type: 'curvedCW', roundness: e.closing ? 0.35 : 0.08 };
  }
  return edge;
}

export const VIS_OPTIONS = {
  layout: {
    hierarchical: {
      enabled: true,
      direction: 'UD',
      sortMethod: 'directed',
      levelSeparation: 105,
      nodeSpacing: 66,
      treeSpacing: 90,
      parentCentralization: true,
      edgeMinimization: true,
      blockShifting: true,
    },
  },
  physics: false,
  interaction: { hover: true, keyboard: false, multiselect: false, zoomSpeed: 0.6 },
  edges: { smooth: { enabled: true, type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.4 } },
};
