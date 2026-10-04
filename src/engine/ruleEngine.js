/**
 * ruleEngine.js — data-driven "if-then" rules that turn requirements into
 * a topology recommendation.
 *
 * Every rule is a plain object:
 *   { id, kind, condition(req, ctx, design), action(design, req, ctx), reason(req, ctx, design) }
 *
 * - kind "structure" rules shape the topology (star, ring, hierarchical, mesh).
 * - kind "feature" rules add things on top (VLANs, Wi-Fi, internet, servers).
 *
 * Rules run in array order, so a later rule can look at what earlier rules
 * decided (via design.firedRules). To add a rule, append an object to RULES.
 */

/** Derived numbers that many rules need. */
export function buildContext(req) {
  const deptCount = Math.max(1, Number(req.departmentCount) || 1);
  const totalDevices = (req.pcs || 0) + (req.laptops || 0) + (req.servers || 0) + (req.printers || 0);
  return { deptCount, totalDevices };
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
/** ["a", "b", "c"] -> "a, b and c" */
const listJoin = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

export const RULES = [
  {
    id: 'star',
    kind: 'structure',
    condition: (req, ctx) => ctx.totalDevices <= 24 && ctx.deptCount === 1 && !req.needs.scalability,
    action: (d) => {
      d.base = 'star';
      d.structure.core = true;
      d.components.push({ topology: 'Star', part: 'Every device plugs into one central switch' });
    },
    reason: (req, ctx) =>
      `Star topology chosen because you have only ${plural(ctx.totalDevices, 'device')} in one department. ` +
      `One central switch is simple, cheap and easy to troubleshoot.`,
  },
  {
    id: 'ring',
    kind: 'structure',
    condition: (req, ctx) =>
      ctx.deptCount >= 3 &&
      ctx.deptCount <= 4 &&
      ctx.totalDevices <= 24 &&
      !req.needs.internet &&
      !req.needs.scalability,
    action: (d) => {
      d.base = 'ring';
      d.structure.deptSwitches = true;
      d.structure.ring = true;
      d.components.push({ topology: 'Ring', part: 'Department switches are linked in a loop (the backbone)' });
    },
    reason: (req, ctx) =>
      `Ring backbone chosen because the network is small (${plural(ctx.totalDevices, 'device')}), uses only ` +
      `${ctx.deptCount} switches and does not need internet. Each switch has two neighbours, so there are always two paths.` +
      (req.needs.redundancy ? ' The ring already gives you redundancy, so no extra links are needed.' : ''),
  },
  {
    id: 'hierarchical',
    kind: 'structure',
    condition: (req, ctx, d) =>
      !d.firedRules.includes('ring') && (ctx.deptCount > 1 || ctx.totalDevices > 24 || req.needs.scalability),
    action: (d) => {
      d.base = 'hierarchical';
      d.structure.core = true;
      d.structure.deptSwitches = true;
      d.components.push({ topology: 'Hierarchical Star', part: 'Core switch → department switches → devices' });
    },
    reason: (req, ctx) => {
      const why = [];
      if (ctx.deptCount > 1) why.push(`you have ${ctx.deptCount} departments`);
      if (ctx.totalDevices > 24) why.push(`there are ${ctx.totalDevices} devices (too many for one switch)`);
      if (req.needs.scalability) why.push('scalability is required');
      return (
        `Hierarchical (extended) star chosen because ${listJoin(why)}. ` +
        `Each department gets its own switch under a core switch, so adding a department means adding one switch.`
      );
    },
  },
  {
    id: 'redundancy',
    kind: 'structure',
    condition: (req, ctx, d) => req.needs.redundancy && !d.firedRules.includes('ring'),
    action: (d, req, ctx) => {
      d.structure.mesh = true;
      // With two or more department switches we link them to each other;
      // otherwise we add a backup core switch.
      const multi = d.structure.deptSwitches && ctx.deptCount >= 2;
      d.structure.backupCore = !multi;
      d.components.push({
        topology: 'Partial Mesh',
        part: multi
          ? 'Redundant links between neighbouring department switches'
          : 'Backup core switch with redundant links',
      });
    },
    reason: (req, ctx, d) =>
      d.structure.backupCore
        ? 'A backup core switch (SW-CORE-2) was added because redundancy was requested. If the main switch fails, traffic can still flow through the backup.'
        : 'Redundant links were added between neighbouring department switches because redundancy was requested. If one path fails, traffic takes the other.',
  },
  {
    id: 'vlan',
    kind: 'feature',
    condition: (req) => req.needs.security || req.needs.separation,
    action: (d) => d.features.push('vlan'),
    reason: (req) =>
      `Each department has its own VLAN because ${req.needs.security ? 'security / isolation' : 'network separation'} was requested. ` +
      `Devices in one VLAN cannot see another department's traffic unless the router allows it.`,
  },
  {
    id: 'wifi',
    kind: 'feature',
    condition: (req) => req.needs.wifi,
    action: (d) => d.features.push('wifi'),
    reason: (req) =>
      req.laptops > 0
        ? `A wireless access point (AP-1) was added because Wi-Fi is needed. The ${plural(req.laptops, 'laptop')} connect to it without cables and get their own Wi-Fi subnet.`
        : 'A wireless access point (AP-1) was added because Wi-Fi is needed, ready for phones and laptops to join later.',
  },
  {
    id: 'internet',
    kind: 'feature',
    condition: (req) => req.needs.internet,
    action: (d) => d.features.push('internet'),
    reason: () =>
      'A router (R1) was placed above the core switch because internet access is needed. The router and core switch talk over a tiny /30 link that has exactly 2 usable addresses.',
  },
  {
    id: 'servers',
    kind: 'feature',
    condition: (req) => req.servers > 0,
    action: (d) => d.features.push('serverSegment'),
    reason: (req, ctx, d) =>
      `The ${plural(req.servers, 'server')} sit in a separate server segment attached to the ${d.structure.ring ? 'backbone' : 'core switch'}, ` +
      'so every department can reach them in one hop and they are easy to protect.',
  },
];

const LABELS = { star: 'Star', hierarchical: 'Extended / Hierarchical Star', ring: 'Ring (backbone)' };

/** Pick the final topology from the structural rules that fired. */
export function resolveTopology(design) {
  const structural = design.firedRules.filter((id) => ['star', 'ring', 'hierarchical', 'redundancy'].includes(id));
  if (structural.length >= 2) {
    design.topology = 'hybrid';
    design.topologyLabel = `Hybrid (${design.components.map((c) => c.topology).join(' + ')})`;
    design.reasons.push({
      ruleId: 'hybrid',
      text:
        `The final design is a Hybrid because more than one layout rule applied: ` +
        design.components.map((c) => `${c.topology} gives "${c.part.toLowerCase()}"`).join('; ') +
        '.',
    });
  } else {
    design.topology = design.base;
    design.topologyLabel = LABELS[design.base];
  }
  return design;
}

/**
 * Run all rules against a requirements object.
 * @returns {{topology, topologyLabel, components, structure, features, firedRules, reasons}}
 */
export function evaluateRules(req, rules = RULES) {
  const ctx = buildContext(req);
  const design = {
    base: null,
    topology: null,
    topologyLabel: '',
    components: [],
    structure: { core: false, deptSwitches: false, ring: false, mesh: false, backupCore: false },
    features: [],
    firedRules: [],
    reasons: [],
    context: ctx,
  };
  for (const rule of rules) {
    if (!rule.condition(req, ctx, design)) continue;
    rule.action(design, req, ctx);
    design.firedRules.push(rule.id);
    design.reasons.push({ ruleId: rule.id, text: rule.reason(req, ctx, design) });
  }
  return resolveTopology(design);
}
