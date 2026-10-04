/**
 * constants.js — shared defaults, demo preset and palette.
 */

export const NEED_KEYS = [
  { key: 'internet', label: 'Internet access' },
  { key: 'multipleDepartments', label: 'Multiple departments' },
  { key: 'separation', label: 'Network separation' },
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'redundancy', label: 'Redundancy' },
  { key: 'security', label: 'Security / isolation' },
  { key: 'scalability', label: 'Scalability' },
];

export const DEFAULT_BASE = '192.168.10.0/24';

/** Max devices drawn per group before collapsing into "+N more". */
export const COLLAPSE_THRESHOLD = 8;
export const COLLAPSE_SAMPLES = 3;

/** Default department name for position i of n. */
export function defaultDeptName(i, n) {
  if (n >= 3 && i === n - 1) return 'Admin';
  return `Dept ${String.fromCharCode(65 + (i % 26))}`;
}

/** Split `total` into `n` near-equal integer parts (earlier parts get the extra). */
export function splitEvenly(total, n) {
  const base = Math.floor(total / n);
  const extra = total % n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

/** Build department rows by splitting the counts evenly. */
export function buildDepartments(count, pcs, printers, laptops, names = []) {
  const n = Math.max(1, count);
  const p = splitEvenly(pcs, n);
  const pr = splitEvenly(printers, n);
  const l = splitEvenly(laptops, n);
  return Array.from({ length: n }, (_, i) => ({
    name: names[i] || defaultDeptName(i, n),
    pcs: p[i],
    printers: pr[i],
    laptops: l[i],
  }));
}

export function emptyRequirements() {
  return {
    pcs: 10,
    laptops: 0,
    servers: 0,
    printers: 1,
    departmentCount: 1,
    departments: buildDepartments(1, 10, 1, 0),
    needs: {
      internet: false,
      multipleDepartments: false,
      separation: false,
      wifi: false,
      redundancy: false,
      security: false,
      scalability: false,
    },
    baseNetwork: DEFAULT_BASE,
  };
}

/**
 * The demo scenario. Each segment's host count includes its gateway
 * (switch / AP), so:
 *   Dept A: 55 PCs + 4 printers + SW-A   = 60 hosts -> /26
 *   Dept B: 27 PCs + 2 printers + SW-B   = 30 hosts -> /27
 *   Admin : 10 PCs + 1 printer  + SW-ADM = 12 hosts -> /28
 *   Servers: 5 servers + gateway         =  6 hosts -> /29
 *   Router link: R1 + SW-CORE            =  2 hosts -> /30
 *   Wi-Fi : 4 laptops + AP-1             =  5 hosts -> /29 (allocated last)
 */
export function demoRequirements() {
  return {
    pcs: 92,
    laptops: 4,
    servers: 5,
    printers: 7,
    departmentCount: 3,
    departments: [
      { name: 'Dept A', pcs: 55, printers: 4, laptops: 0 },
      { name: 'Dept B', pcs: 27, printers: 2, laptops: 0 },
      { name: 'Admin', pcs: 10, printers: 1, laptops: 0 },
    ],
    needs: {
      internet: true,
      multipleDepartments: true,
      separation: false,
      wifi: true,
      redundancy: true,
      security: true,
      scalability: true,
    },
    baseNetwork: DEFAULT_BASE,
  };
}
