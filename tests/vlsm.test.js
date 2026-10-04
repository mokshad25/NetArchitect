import { describe, it, expect } from 'vitest';
import { calculateVlsm, blockSizeFor } from '../src/engine/vlsm.js';
import { parseCidr } from '../src/engine/ipUtils.js';
import { designNetwork } from '../src/engine/designNetwork.js';
import { demoRequirements } from '../src/engine/constants.js';

const DEMO_SEGMENTS = [
  { id: 'servers', name: 'Servers', hosts: 6 },
  { id: 'router', name: 'Router link', hosts: 2 },
  { id: 'a', name: 'Dept A', hosts: 60 },
  { id: 'admin', name: 'Admin', hosts: 12 },
  { id: 'b', name: 'Dept B', hosts: 30 },
  { id: 'wifi', name: 'Wi-Fi', hosts: 5, phase: 'extension' },
];

const EXPECTED = [
  ['Dept A', '192.168.10.0/26', '255.255.255.192', '192.168.10.1', '192.168.10.62', '192.168.10.63', 64],
  ['Dept B', '192.168.10.64/27', '255.255.255.224', '192.168.10.65', '192.168.10.94', '192.168.10.95', 32],
  ['Admin', '192.168.10.96/28', '255.255.255.240', '192.168.10.97', '192.168.10.110', '192.168.10.111', 16],
  ['Servers', '192.168.10.112/29', '255.255.255.248', '192.168.10.113', '192.168.10.118', '192.168.10.119', 8],
  ['Router link', '192.168.10.120/30', '255.255.255.252', '192.168.10.121', '192.168.10.122', '192.168.10.123', 4],
];

function checkDemo(result) {
  expect(result.ok).toBe(true);
  const core = result.allocations.filter((a) => a.phase === 'core');
  expect(core.map((a) => a.name)).toEqual(EXPECTED.map((e) => e[0]));
  EXPECTED.forEach(([name, cidr, mask, first, last, bcast, block], i) => {
    expect(core[i]).toMatchObject({
      name,
      cidr,
      mask,
      firstUsable: first,
      lastUsable: last,
      broadcast: bcast,
      blockSize: block,
    });
  });
  expect(result.core.used).toBe(124);
  expect(result.core.free).toBe(132);
  expect(result.core.freeRanges).toHaveLength(1);
  expect(result.core.freeRanges[0]).toMatchObject({ start: '192.168.10.124', end: '192.168.10.255', size: 132 });
  const wifi = result.allocations.find((a) => a.name === 'Wi-Fi');
  expect(wifi).toMatchObject({ cidr: '192.168.10.128/29', phase: 'extension', firstUsable: '192.168.10.129' });
  expect(result.total.used).toBe(132);
}

describe('VLSM calculator', () => {
  it('returns the exact demo scenario values', () => {
    checkDemo(calculateVlsm('192.168.10.0/24', DEMO_SEGMENTS));
  });

  it('produces the same plan through the full pipeline (Load Demo)', () => {
    const out = designNetwork(demoRequirements());
    expect(out.ok).toBe(true);
    checkDemo(out.vlsm);
  });

  it('returns an error and suggests a bigger base when segments overflow', () => {
    const r = calculateVlsm('192.168.10.0/24', [
      { name: 'Big', hosts: 200 },
      { name: 'Medium', hosts: 100 },
    ]);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/did not fit/);
    expect(r.suggestion).toBe('192.168.10.0/23');
  });

  it('skips 0-host segments', () => {
    const r = calculateVlsm('10.0.0.0/24', [
      { name: 'Empty', hosts: 0 },
      { name: 'Real', hosts: 10 },
    ]);
    expect(r.ok).toBe(true);
    expect(r.skipped).toEqual(['Empty']);
    expect(r.allocations).toHaveLength(1);
    expect(r.allocations[0].cidr).toBe('10.0.0.0/28');
  });

  it('rejects invalid base networks', () => {
    expect(calculateVlsm('192.168.10/24', []).ok).toBe(false);
    const notNetwork = parseCidr('192.168.10.5/24');
    expect(notNetwork.ok).toBe(false);
    expect(notNetwork.suggestion).toBe('192.168.10.0/24');
  });

  it('sizes blocks as the smallest power of two >= hosts + 2', () => {
    expect(blockSizeFor(60)).toBe(64);
    expect(blockSizeFor(62)).toBe(64);
    expect(blockSizeFor(63)).toBe(128);
    expect(blockSizeFor(2)).toBe(4);
    expect(blockSizeFor(1)).toBe(4);
  });
});
