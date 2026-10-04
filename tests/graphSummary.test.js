import { describe, it, expect } from 'vitest';
import { designNetwork } from '../src/engine/designNetwork.js';
import { demoRequirements, emptyRequirements, buildDepartments } from '../src/engine/constants.js';
import { validateRequirements } from '../src/engine/validation.js';

describe('graph builder + summary (demo)', () => {
  const out = designNetwork(demoRequirements());
  const { graph, summary, vlsm } = out;

  it('summary counts equal the generated graph', () => {
    const sum = (pred) => graph.nodes.filter(pred).reduce((s, n) => s + n.count, 0);
    expect(summary.connections).toBe(graph.edges.length);
    expect(summary.switches).toBe(graph.nodes.filter((n) => n.type === 'switch').length);
    expect(summary.routers).toBe(graph.nodes.filter((n) => n.type === 'router').length);
    expect(summary.totalDevices).toBe(sum((n) => n.type !== 'cloud'));
    expect(summary.segments).toBe(vlsm.allocations.length);
    expect(summary.drawnNodes).toBe(graph.nodes.length);
  });

  it('demo summary has the expected values', () => {
    expect(summary).toMatchObject({
      endDevices: 108, // 92 PCs + 7 printers + 5 servers + 4 laptops
      switches: 4, // core + 3 department switches
      routers: 1,
      accessPoints: 1,
      departments: 3,
      segments: 6,
      redundantLinks: 2,
      wirelessLinks: 4,
    });
    expect(summary.totalDevices).toBe(108 + 4 + 1 + 1);
  });

  it('collapsed nodes keep department totals exact', () => {
    const deptA = graph.nodes.filter((n) => n.dept === 'Dept A' && n.type !== 'switch');
    expect(deptA.reduce((s, n) => s + n.count, 0)).toBe(59);
    expect(deptA.filter((n) => n.type !== 'more')).toHaveLength(3);
    const more = deptA.find((n) => n.type === 'more');
    expect(more.label).toBe('+56 more');
  });

  it('every node except the cloud has an IP or IP range', () => {
    for (const n of graph.nodes) {
      if (n.type === 'cloud') continue;
      expect(n.ip || n.ipRange, n.id).toBeTruthy();
    }
  });

  it('assigns gateway first, then devices', () => {
    const byId = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));
    expect(byId['R1'].ip).toBe('192.168.10.121');
    expect(byId['SW-CORE'].ip).toBe('192.168.10.122');
    expect(byId['SW-A'].ip).toBe('192.168.10.1');
    expect(byId['PC-A1'].ip).toBe('192.168.10.2');
    expect(byId['SW-B'].ip).toBe('192.168.10.65');
    expect(byId['SRV-1'].ip).toBe('192.168.10.114');
    expect(byId['SRV-5'].ip).toBe('192.168.10.118');
    expect(byId['AP-1'].ip).toBe('192.168.10.129');
    expect(byId['LAP-4'].ip).toBe('192.168.10.133');
    expect(byId['SW-A'].vlan).toBe(10);
  });

  it('draws redundant links between department switches and wireless links to laptops', () => {
    const red = graph.edges.filter((e) => e.kind === 'redundant').map((e) => `${e.from}-${e.to}`);
    expect(red).toEqual(['SW-A-SW-B', 'SW-B-SW-ADM']);
    expect(graph.edges.filter((e) => e.kind === 'wireless').every((e) => e.from === 'AP-1')).toBe(true);
  });
});

describe('other topologies build cleanly', () => {
  const base = emptyRequirements();
  const make = (overrides) => {
    const r = { ...base, ...overrides };
    r.departments = buildDepartments(r.departmentCount, r.pcs, r.printers, r.laptops);
    return r;
  };

  it('star with redundancy adds a backup core switch with an IP', () => {
    const out = designNetwork(make({ pcs: 8, needs: { ...base.needs, redundancy: true, internet: true } }));
    expect(out.design.topology).toBe('hybrid');
    const backup = out.graph.nodes.find((n) => n.id === 'SW-CORE-2');
    expect(backup.ip).toBeTruthy();
    expect(out.summary.connections).toBe(out.graph.edges.length);
  });

  it('ring links department switches in a loop', () => {
    const out = designNetwork(make({ pcs: 12, printers: 0, departmentCount: 3 }));
    expect(out.design.topology).toBe('ring');
    const ringEdges = out.graph.edges.filter((e) => e.from.startsWith('SW-') && e.to.startsWith('SW-'));
    expect(ringEdges).toHaveLength(3);
  });
});

describe('validation', () => {
  it('flags bad CIDR and mismatched department totals', () => {
    const r = demoRequirements();
    r.baseNetwork = '300.1.1.0/24';
    r.departments[0].pcs = 1;
    const { errors } = validateRequirements(r);
    expect(errors.some((e) => /between 0 and 255/.test(e))).toBe(true);
    expect(errors.some((e) => /Department PCs add up/.test(e))).toBe(true);
  });

  it('accepts the demo', () => {
    expect(validateRequirements(demoRequirements()).errors).toEqual([]);
  });
});
