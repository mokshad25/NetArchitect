/**
 * explainer.js — "Why this design?" — turns rule reasons and the VLSM plan
 * into short, beginner-friendly sentences.
 *
 * Each item: { category, title, text }
 *   category: 'topology' | 'feature' | 'addressing' | 'diagram' | 'warning'
 */
import { shortIp } from './ipUtils.js';

const RULE_TITLES = {
  star: ['topology', 'Star topology'],
  ring: ['topology', 'Ring backbone'],
  hierarchical: ['topology', 'Hierarchical star'],
  redundancy: ['topology', 'Redundant links (partial mesh)'],
  hybrid: ['topology', 'Why it is a Hybrid'],
  vlan: ['feature', 'One VLAN per department'],
  wifi: ['feature', 'Wi-Fi access point'],
  internet: ['feature', 'Router and internet link'],
  servers: ['feature', 'Server segment'],
};

/** Words describing who is inside a segment's host count. */
function hostBreakdown(seg) {
  if (!seg) return '';
  switch (seg.kind) {
    case 'department':
      return ` (${seg.devices} devices + 1 for the switch/gateway)`;
    case 'servers':
      return ` (${seg.devices} servers + 1 gateway)`;
    case 'wifi':
      return ` (${seg.devices} laptops + 1 for the access point)`;
    default:
      return '';
  }
}

export function explainDesign(req, design, segments, vlsm, graph) {
  const items = [];

  items.push({
    category: 'topology',
    title: `Recommended: ${design.topologyLabel}`,
    text: `NetArchitect checked ${design.firedRules.length} rules against your requirements and combined them into this design.`,
  });

  for (const r of design.reasons) {
    const [category, title] = RULE_TITLES[r.ruleId] || ['feature', r.ruleId];
    items.push({ category, title, text: r.text });
  }

  if (design.features.includes('vlan')) {
    const vlans = segments.filter((s) => s.vlan).map((s) => `${s.name} = VLAN ${s.vlan}`);
    items.push({ category: 'feature', title: 'VLAN numbers', text: `VLAN IDs used: ${vlans.join(', ')}.` });
  }

  // ---- Addressing ---------------------------------------------------------
  if (!vlsm.ok) {
    items.push({ category: 'warning', title: 'Addresses do not fit', text: vlsm.error });
    return items;
  }
  const segById = new Map(segments.map((s) => [s.id, s]));
  for (const a of vlsm.allocations) {
    const seg = segById.get(a.id);
    if (a.kind === 'router') {
      items.push({
        category: 'addressing',
        title: `${a.name}: ${a.cidr}`,
        text: `The router link got a /30 because only 2 devices (R1 and SW-CORE) are on it: 2 + 2 = 4 addresses, the smallest block possible.`,
      });
      continue;
    }
    items.push({
      category: 'addressing',
      title: `${a.name}: ${a.cidr}`,
      text:
        `${a.name} got a /${a.prefix} because it needs ${a.hosts} hosts${hostBreakdown(seg)} + 2 (network and broadcast) = ${a.needed}, ` +
        `and the smallest power-of-2 block that fits is ${a.blockSize}.`,
    });
  }

  const ext = vlsm.allocations.filter((a) => a.phase === 'extension');
  if (ext.length) {
    items.push({
      category: 'addressing',
      title: 'Wi-Fi placed last',
      text: `The Wi-Fi subnet was added after the wired segments, in the free space at ${ext[0].cidr}. This keeps the main plan tightly packed from the start of the range.`,
    });
  }

  const core = vlsm.core;
  const coreFree = core.freeRanges.map((r) => `${shortIp(r.startInt)}–${shortIp(r.endInt)}`).join(', ');
  items.push({
    category: 'addressing',
    title: 'Address space used',
    text:
      `The main segments use ${core.used} of ${vlsm.base.size} addresses, leaving ${core.free} free (${coreFree}) for growth.` +
      (ext.length ? ` With Wi-Fi added, ${vlsm.total.used} are used and ${vlsm.total.free} are still free.` : ''),
  });

  if (vlsm.skipped.length) {
    items.push({
      category: 'addressing',
      title: 'Empty segments skipped',
      text: `${vlsm.skipped.join(', ')} had no devices, so no subnet was given to them.`,
    });
  }

  // ---- Diagram notes ------------------------------------------------------
  const collapsed = graph.nodes.filter((n) => n.type === 'more');
  if (collapsed.length) {
    items.push({
      category: 'diagram',
      title: 'Big groups are shortened',
      text: `Groups with more than 8 devices show 3 sample devices plus a "+N more" box so the diagram stays readable. Every hidden device still has an IP address — click the box to see the range.`,
    });
  }
  return items;
}
