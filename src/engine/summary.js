/**
 * summary.js — stat cards, computed from the generated graph and VLSM plan.
 * Nothing here is hard-coded: if the graph changes, the numbers change.
 */
const END_TYPES = new Set(['pc', 'printer', 'laptop', 'server', 'more']);

export function computeSummary(graph, vlsm) {
  const sumCount = (pred) => graph.nodes.filter(pred).reduce((s, n) => s + (n.count || 1), 0);
  const departments = new Set(
    graph.nodes.filter((n) => n.dept && String(n.segmentId || '').startsWith('dept-')).map((n) => n.dept),
  );
  return {
    totalDevices: sumCount((n) => n.type !== 'cloud'),
    endDevices: sumCount((n) => END_TYPES.has(n.type)),
    switches: sumCount((n) => n.type === 'switch'),
    routers: sumCount((n) => n.type === 'router'),
    accessPoints: sumCount((n) => n.type === 'ap'),
    connections: graph.edges.length,
    redundantLinks: graph.edges.filter((e) => e.kind === 'redundant').length,
    wirelessLinks: graph.edges.filter((e) => e.kind === 'wireless').length,
    departments: departments.size,
    segments: vlsm && vlsm.ok ? vlsm.allocations.length : 0,
    drawnNodes: graph.nodes.length,
  };
}
