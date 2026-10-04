import { describe, it, expect } from 'vitest';
import { vlsmExampleRows, vlsmExampleUsage, getDemoDesign } from '../src/features/landing/demoDesign.js';

describe('landing page worked example', () => {
  it('shows exactly the brief’s VLSM values, straight from the engine', () => {
    expect(vlsmExampleRows().map((r) => [r.name, r.hosts, r.cidr, r.mask, r.usable, r.broadcast])).toEqual([
      ['Dept A', 60, '192.168.10.0/26', '255.255.255.192', '.1–.62', '.63'],
      ['Dept B', 30, '192.168.10.64/27', '255.255.255.224', '.65–.94', '.95'],
      ['Admin', 12, '192.168.10.96/28', '255.255.255.240', '.97–.110', '.111'],
      ['Servers', 6, '192.168.10.112/29', '255.255.255.248', '.113–.118', '.119'],
      ['Router link', 2, '192.168.10.120/30', '255.255.255.252', '.121–.122', '.123'],
    ]);
  });

  it('reports 124 of 256 used with .124–.255 free (132)', () => {
    expect(vlsmExampleUsage()).toEqual({
      base: '192.168.10.0/24',
      size: 256,
      used: 124,
      free: 132,
      freeFrom: '.124',
      freeTo: '.255',
    });
  });

  it('uses the same design object as the app’s Load demo', () => {
    expect(getDemoDesign().design.topologyLabel).toBe('Hybrid (Hierarchical Star + Partial Mesh)');
  });
});
