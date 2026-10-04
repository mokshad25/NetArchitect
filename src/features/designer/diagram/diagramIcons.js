/**
 * Line icons for diagram nodes, rendered as SVG data URIs so vis-network can
 * draw them on its canvas (and so PNG export works offline).
 * Each icon sits on a small square tile; colors come from the active theme.
 */

// 24×24 line drawings, 1.5px stroke (lucide-style).
export const PATHS = {
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  router: '<circle cx="12" cy="12" r="8.5"/><path d="M7.5 10h8l-2.5-2.5M16.5 14h-8l2.5 2.5"/>',
  switch:
    '<rect x="2.5" y="7" width="19" height="10" rx="2"/><path d="M6 12h.01M9 12h.01M12 12h.01M15 12h.01M18 12h.01"/>',
  server:
    '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M5 9h14M5 15h14M8.5 6h.01M8.5 12h.01M8.5 18h.01"/>',
  ap: '<path d="M12 20h.01M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 14 0M2 9.5a15 15 0 0 1 20 0"/>',
  pc: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
  printer:
    '<path d="M6 9V3h12v6M6 17H4.5A1.5 1.5 0 0 1 3 15.5v-5A1.5 1.5 0 0 1 4.5 9h15a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H18"/><rect x="6" y="14" width="12" height="7" rx="1"/>',
  laptop: '<rect x="4.5" y="5" width="15" height="10" rx="1.5"/><path d="M2.5 19h19"/>',
  more: '<path stroke-width="3" d="M7 12h.01M12 12h.01M17 12h.01"/>',
};

/** Which theme color strokes each kind of node. */
function strokeFor(type, role, c) {
  if (type === 'router' || role === 'Core switch' || role === 'Backup core switch') return c['--accent'];
  if (type === 'more') return c['--node-muted'];
  return c['--node-stroke'];
}

const cache = new Map();

/**
 * Data URI for a node icon.
 * @param {string} type  engine node type (router, switch, pc, …)
 * @param {string} role  engine node role (Core switch, Department switch, …)
 * @param {object} colors result of readVars() for the diagram tokens
 */
export function iconFor(type, role, colors) {
  const key = `${type}|${role}|${colors['--node-fill']}|${colors['--accent']}`;
  if (cache.has(key)) return cache.get(key);
  const stroke = strokeFor(type, role, colors);
  const body = PATHS[type] || PATHS.more;
  let svg;
  if (type === 'cloud') {
    svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96">` +
      `<g fill="${colors['--node-fill']}" stroke="${stroke}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  } else {
    const dash = type === 'more' ? ' stroke-dasharray="3 2.5"' : '';
    svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="128" height="128">` +
      `<rect x="0.5" y="0.5" width="31" height="31" rx="6" fill="${colors['--node-fill']}" stroke="${colors['--border-strong']}"${dash}/>` +
      `<g transform="translate(4 4)" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  }
  const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  cache.set(key, uri);
  return uri;
}
