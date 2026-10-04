/**
 * graphBuilder.js — turn the rule-engine design + VLSM plan into a layered
 * graph of nodes and edges (no rendering here, just data).
 *
 * Layers (top to bottom):
 *   0 Internet cloud · 1 Router · 2 Core switch · 3 Dept switches / servers / AP · 4 End devices
 *
 * Big groups (> COLLAPSE_THRESHOLD devices) are drawn as a few sample
 * devices plus a "+N more" node whose `count` keeps totals exact.
 */
import { COLLAPSE_THRESHOLD, COLLAPSE_SAMPLES } from './constants.js';
import { intToIp, shortIp } from './ipUtils.js';
import { assignIps } from './vlsm.js';
import { deptCodes, deptDeviceCount } from './segments.js';

export const LEVEL = { cloud: 0, router: 1, core: 2, distribution: 3, end: 4 };

export const TYPE_LABELS = {
  cloud: 'Internet cloud',
  router: 'Router',
  switch: 'Switch',
  server: 'Server',
  ap: 'Wireless access point',
  pc: 'PC',
  printer: 'Printer',
  laptop: 'Laptop',
  more: 'Device group',
};

/** Compress sorted integer addresses into ".4–.56, .58–.60". */
export function formatIpRanges(ints) {
  if (!ints.length) return '';
  const sorted = [...ints].sort((a, b) => a - b);
  const parts = [];
  let start = sorted[0];
  let prev = sorted[0];
  const flush = () => parts.push(start === prev ? intToIp(start) : `${intToIp(start)} – ${shortIp(prev)}`);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
      continue;
    }
    flush();
    start = prev = sorted[i];
  }
  flush();
  return parts.join(', ');
}

export function buildGraph(req, design, segments, vlsm) {
  const nodes = [];
  const edges = [];
  const allocs = new Map((vlsm && vlsm.ok ? vlsm.allocations : []).map((a) => [a.id, a]));
  const segById = new Map(segments.map((s) => [s.id, s]));
  const cursor = new Map(); // segment id -> how many addresses already handed out

  /** Take the next n addresses of a segment (empty array if not allocated). */
  const take = (segId, n) => {
    const alloc = allocs.get(segId);
    if (!alloc) return [];
    const offset = cursor.get(segId) || 0;
    cursor.set(segId, offset + n);
    return assignIps(alloc, offset + n).slice(offset);
  };

  /** Subnet info copied onto every node of a segment. */
  const subnetInfo = (segId) => {
    const a = allocs.get(segId);
    const s = segById.get(segId);
    return {
      segmentId: segId,
      subnet: a ? a.cidr : null,
      mask: a ? a.mask : null,
      vlan: s ? s.vlan : null,
    };
  };

  const addNode = (node) => {
    nodes.push({ count: 1, extraIps: [], dept: null, ...node });
    return node.id;
  };
  let edgeSeq = 0;
  const addEdge = (from, to, kind = 'normal') => edges.push({ id: `e${++edgeSeq}`, from, to, kind });

  const { structure, features } = design;
  const wifi = features.includes('wifi');
  const internet = features.includes('internet');
  const codes = deptCodes(req.departments);

  // ---- Layer 0/1: Internet + router -------------------------------------
  let routerLink = [];
  if (internet) {
    routerLink = take('router', 2); // R1 gets .first, core switch gets the second
    addNode({ id: 'internet', label: 'Internet', type: 'cloud', level: LEVEL.cloud });
    addNode({
      id: 'R1',
      label: 'R1',
      type: 'router',
      level: LEVEL.router,
      ip: routerLink[0] ?? null,
      ...subnetInfo('router'),
    });
    addEdge('internet', 'R1');
  }

  // ---- Layer 2: core (or ring backbone) ---------------------------------
  const deptSwitchIds = [];
  let hub = null; // where servers / AP attach

  if (structure.core) {
    addNode({
      id: 'SW-CORE',
      label: 'SW-CORE',
      type: 'switch',
      role: 'Core switch',
      level: LEVEL.core,
      ip: routerLink[1] ?? null,
      ...(internet ? subnetInfo('router') : {}),
    });
    if (internet) addEdge('R1', 'SW-CORE');
    hub = 'SW-CORE';
  }

  if (structure.deptSwitches) {
    const level = structure.ring ? LEVEL.core : LEVEL.distribution;
    req.departments.forEach((d, i) => {
      const id = `SW-${codes[i]}`;
      const segId = `dept-${codes[i]}`;
      const [gw] = take(segId, 1);
      addNode({
        id,
        label: id,
        type: 'switch',
        role: 'Department switch',
        level,
        dept: d.name,
        ip: gw ?? null,
        ...subnetInfo(segId),
      });
      deptSwitchIds.push(id);
      if (structure.core) addEdge('SW-CORE', id);
    });
    if (structure.ring) {
      // Close the loop: each switch links to the next one, last links back to first.
      deptSwitchIds.forEach((id, i) => {
        const next = deptSwitchIds[(i + 1) % deptSwitchIds.length];
        if (deptSwitchIds.length > 1 && (deptSwitchIds.length > 2 || i === 0)) addEdge(id, next);
        if (i === deptSwitchIds.length - 1) edges[edges.length - 1].closing = true; // last -> first
      });
      hub = deptSwitchIds[0];
    }
  } else if (structure.core) {
    // Star: the single department's gateway lives on the core switch.
    const segId = `dept-${codes[0]}`;
    const [gw] = take(segId, 1);
    const core = nodes.find((n) => n.id === 'SW-CORE');
    if (gw != null) {
      if (core.ip == null) Object.assign(core, { ip: gw, ...subnetInfo(segId) });
      else
        core.extraIps.push({ label: `${req.departments[0].name} gateway`, ip: gw, subnet: subnetInfo(segId).subnet });
    }
    core.dept = req.departments[0].name;
  }

  // ---- Redundancy (partial mesh) ----------------------------------------
  if (structure.mesh) {
    if (structure.backupCore) {
      const [ip] = take(`dept-${codes[0]}`, 1);
      addNode({
        id: 'SW-CORE-2',
        label: 'SW-CORE-2',
        type: 'switch',
        role: 'Backup core switch',
        level: LEVEL.core,
        ip: ip ?? null,
        ...subnetInfo(`dept-${codes[0]}`),
      });
      addEdge('SW-CORE', 'SW-CORE-2', 'redundant');
      if (internet) addEdge('R1', 'SW-CORE-2', 'redundant');
      deptSwitchIds.forEach((id) => addEdge('SW-CORE-2', id, 'redundant'));
    } else {
      for (let i = 0; i + 1 < deptSwitchIds.length; i++) addEdge(deptSwitchIds[i], deptSwitchIds[i + 1], 'redundant');
    }
  }

  // ---- Devices -----------------------------------------------------------
  /**
   * Add a group of devices under `parent`. `items` = [{name, type}] in IP order.
   * Collapses large groups into samples + "+N more".
   */
  const addGroup = (parent, segId, items, { dept = null, edgeKind = 'normal', level = LEVEL.end, groupName }) => {
    const ips = take(segId, items.length);
    const devices = items.map((it, i) => ({ ...it, ipInt: ips[i] ?? null }));
    const info = subnetInfo(segId);
    let shown = devices;
    let hidden = [];
    if (devices.length > COLLAPSE_THRESHOLD) {
      // One sample of each device type first, then more of the first type.
      const picks = new Set();
      for (const t of [...new Set(devices.map((d) => d.type))]) {
        if (picks.size < COLLAPSE_SAMPLES) picks.add(devices.findIndex((d) => d.type === t));
      }
      for (let i = 0; picks.size < COLLAPSE_SAMPLES; i++) picks.add(i);
      shown = devices.filter((_, i) => picks.has(i));
      hidden = devices.filter((_, i) => !picks.has(i));
    }
    for (const dv of shown) {
      addNode({ id: dv.name, label: dv.name, type: dv.type, level, dept, ip: dv.ipInt, ...info });
      addEdge(parent, dv.name, edgeKind);
    }
    if (hidden.length) {
      const byType = {};
      hidden.forEach((h) => (byType[h.type] = (byType[h.type] || 0) + 1));
      const id = `${groupName}-more`;
      addNode({
        id,
        label: `+${hidden.length} more`,
        type: 'more',
        level,
        dept,
        count: hidden.length,
        breakdown: byType,
        members: hidden.map((h) => h.name),
        ipRange: formatIpRanges(hidden.map((h) => h.ipInt).filter((x) => x != null)),
        ...info,
      });
      addEdge(parent, id, edgeKind);
    }
  };

  req.departments.forEach((d, i) => {
    const code = codes[i];
    const parent = structure.deptSwitches ? `SW-${code}` : 'SW-CORE';
    const items = [];
    for (let k = 1; k <= (d.pcs || 0); k++) items.push({ name: `PC-${code}${k}`, type: 'pc' });
    for (let k = 1; k <= (d.printers || 0); k++) items.push({ name: `PRN-${code}${k}`, type: 'printer' });
    if (!wifi) for (let k = 1; k <= (d.laptops || 0); k++) items.push({ name: `LAP-${code}${k}`, type: 'laptop' });
    if (items.length !== deptDeviceCount(d, wifi)) throw new Error('device count mismatch');
    addGroup(parent, `dept-${code}`, items, { dept: d.name, groupName: `dept-${code}` });
  });

  // Servers: gateway is a virtual interface on the hub switch, servers follow.
  if (req.servers > 0 && hub) {
    const [gw] = take('servers', 1);
    const hubNode = nodes.find((n) => n.id === hub);
    if (gw != null)
      hubNode.extraIps.push({ label: 'Server segment gateway', ip: gw, subnet: subnetInfo('servers').subnet });
    const items = Array.from({ length: req.servers }, (_, k) => ({ name: `SRV-${k + 1}`, type: 'server' }));
    addGroup(hub, 'servers', items, { level: LEVEL.distribution, groupName: 'servers', dept: 'Servers' });
  }

  // Wi-Fi: AP takes the first address, laptops follow, links are wireless.
  if (wifi && hub) {
    const [apIp] = take('wifi', 1);
    addNode({
      id: 'AP-1',
      label: 'AP-1',
      type: 'ap',
      level: LEVEL.distribution,
      dept: 'Wi-Fi',
      ip: apIp ?? null,
      ...subnetInfo('wifi'),
    });
    addEdge(hub, 'AP-1');
    const items = Array.from({ length: req.laptops || 0 }, (_, k) => ({ name: `LAP-${k + 1}`, type: 'laptop' }));
    addGroup('AP-1', 'wifi', items, { edgeKind: 'wireless', groupName: 'wifi', dept: 'Wi-Fi' });
  }

  // Convert integer IPs to dotted strings for display.
  for (const n of nodes) {
    n.ip = n.ip != null ? intToIp(n.ip) : null;
    n.extraIps = n.extraIps.map((x) => ({ ...x, ip: intToIp(x.ip) }));
  }
  return { nodes, edges };
}

/** Links touching a node, with the name of the device on the other end. */
export function nodeLinks(graph, nodeId) {
  return graph.edges
    .filter((e) => e.from === nodeId || e.to === nodeId)
    .map((e) => ({ kind: e.kind, peer: e.from === nodeId ? e.to : e.from }));
}
