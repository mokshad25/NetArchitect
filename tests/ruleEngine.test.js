import { describe, it, expect } from 'vitest';
import { evaluateRules, RULES } from '../src/engine/ruleEngine.js';
import { emptyRequirements, buildDepartments, demoRequirements } from '../src/engine/constants.js';

/** Build a requirements object with sensible defaults. */
function req({ pcs = 10, printers = 0, laptops = 0, servers = 0, depts = 1, needs = {} } = {}) {
  const base = emptyRequirements();
  return {
    ...base,
    pcs,
    printers,
    laptops,
    servers,
    departmentCount: depts,
    departments: buildDepartments(depts, pcs, printers, laptops),
    needs: { ...base.needs, ...needs },
  };
}

describe('rule engine', () => {
  it('1 department, 10 devices → Star', () => {
    const d = evaluateRules(req({ pcs: 10 }));
    expect(d.topology).toBe('star');
    expect(d.firedRules).toContain('star');
    expect(d.reasons.length).toBeGreaterThan(0);
  });

  it('3 departments + scalability → Hierarchical Star', () => {
    const d = evaluateRules(req({ pcs: 30, depts: 3, needs: { scalability: true } }));
    expect(d.topology).toBe('hierarchical');
    expect(d.topologyLabel).toMatch(/Hierarchical/);
    expect(d.structure.core && d.structure.deptSwitches).toBe(true);
  });

  it('hierarchical + redundancy → Hybrid with partial mesh', () => {
    const d = evaluateRules(req({ pcs: 30, depts: 3, needs: { scalability: true, redundancy: true } }));
    expect(d.topology).toBe('hybrid');
    expect(d.components.map((c) => c.topology)).toEqual(['Hierarchical Star', 'Partial Mesh']);
    expect(d.structure.mesh).toBe(true);
    expect(d.reasons.some((r) => r.ruleId === 'hybrid')).toBe(true);
  });

  it('security checked → VLAN feature present', () => {
    expect(evaluateRules(req({ needs: { security: true } })).features).toContain('vlan');
    expect(evaluateRules(req({ needs: { separation: true } })).features).toContain('vlan');
    expect(evaluateRules(req()).features).not.toContain('vlan');
  });

  it('small multi-switch network without internet → Ring', () => {
    const d = evaluateRules(req({ pcs: 12, depts: 3 }));
    expect(d.topology).toBe('ring');
  });

  it('more than 24 devices in one department → Hierarchical', () => {
    expect(evaluateRules(req({ pcs: 40 })).topology).toBe('hierarchical');
  });

  it('Wi-Fi, internet and servers add their features', () => {
    const d = evaluateRules(req({ laptops: 2, servers: 2, needs: { wifi: true, internet: true } }));
    expect(d.features).toEqual(expect.arrayContaining(['wifi', 'internet', 'serverSegment']));
  });

  it('demo scenario → Hybrid (hierarchical star + partial mesh) with VLANs', () => {
    const d = evaluateRules(demoRequirements());
    expect(d.topology).toBe('hybrid');
    expect(d.topologyLabel).toBe('Hybrid (Hierarchical Star + Partial Mesh)');
    expect(d.features).toEqual(expect.arrayContaining(['vlan', 'wifi', 'internet', 'serverSegment']));
  });

  it('is data-driven: a custom rule can be appended', () => {
    const custom = {
      id: 'printers',
      kind: 'feature',
      condition: (r) => r.printers > 0,
      action: (d) => d.features.push('printServer'),
      reason: () => 'A print server was added.',
    };
    const d = evaluateRules(req({ printers: 2 }), [...RULES, custom]);
    expect(d.features).toContain('printServer');
    expect(d.reasons.at(-1).text).toBe('A print server was added.');
  });
});
