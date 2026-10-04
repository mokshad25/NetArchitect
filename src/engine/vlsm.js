/**
 * vlsm.js — Variable Length Subnet Mask calculator (pure function).
 *
 * Algorithm:
 *   1. Sort segments by host count, largest first.
 *   2. For each, find the smallest power-of-2 block >= hosts + 2
 *      (+2 for the network and broadcast addresses).
 *   3. Allocate it from the next free address that is aligned to the
 *      block size, then repeat.
 *
 * Segments can carry a `phase`: all "core" segments are allocated first,
 * then "extension" segments (e.g. Wi-Fi) are fitted into the free space.
 */
import { intToIp, nextPow2, blockToPrefix, parseCidr, prefixToMask } from './ipUtils.js';

const PHASES = ['core', 'extension'];
const MIN_BLOCK = 4; // a /30 is the smallest useful subnet

/** Block size needed for a given number of hosts. */
export function blockSizeFor(hosts) {
  return Math.max(MIN_BLOCK, nextPow2(hosts + 2));
}

/** Free ranges inside [start, end) given a list of used blocks. */
function freeRanges(start, size, used) {
  const sorted = [...used].sort((a, b) => a.start - b.start);
  const ranges = [];
  let cursor = start;
  for (const block of sorted) {
    if (block.start > cursor) ranges.push({ start: cursor, end: block.start - 1 });
    cursor = Math.max(cursor, block.start + block.size);
  }
  if (cursor < start + size) ranges.push({ start: cursor, end: start + size - 1 });
  return ranges.map((r) => ({
    start: intToIp(r.start),
    end: intToIp(r.end),
    startInt: r.start,
    endInt: r.end,
    size: r.end - r.start + 1,
  }));
}

/** Find the lowest aligned start address where `block` fits, or -1. */
function findSlot(baseStart, baseSize, used, block) {
  for (let addr = baseStart; addr + block <= baseStart + baseSize; addr += block) {
    const clash = used.some((u) => addr < u.start + u.size && u.start < addr + block);
    if (!clash) return addr;
  }
  return -1;
}

function stats(base, used) {
  const usedCount = used.reduce((sum, u) => sum + u.size, 0);
  return {
    used: usedCount,
    free: base.size - usedCount,
    freeRanges: freeRanges(base.network, base.size, used),
  };
}

/**
 * Calculate a VLSM plan.
 * @param {string} baseCidr  e.g. "192.168.10.0/24"
 * @param {Array<{id?, name, hosts, phase?}>} segments
 * @returns {object} see PLAN.md (vlsmResult)
 */
export function calculateVlsm(baseCidr, segments) {
  const parsed = parseCidr(baseCidr);
  if (!parsed.ok)
    return { ok: false, error: parsed.error, suggestion: parsed.suggestion, allocations: [], skipped: [] };

  const base = {
    network: parsed.network,
    prefix: parsed.prefix,
    size: parsed.size,
    cidr: `${intToIp(parsed.network)}/${parsed.prefix}`,
  };
  const skipped = segments.filter((s) => !(s.hosts > 0)).map((s) => s.name);
  const active = segments.map((s, index) => ({ ...s, index, phase: s.phase || 'core' })).filter((s) => s.hosts > 0);

  const used = []; // { start, size }
  const allocations = [];
  let coreStats = null;

  for (const phase of PHASES) {
    // Largest first; ties keep the order the segments were given in.
    const list = active.filter((s) => s.phase === phase).sort((a, b) => b.hosts - a.hosts || a.index - b.index);
    for (const seg of list) {
      const block = blockSizeFor(seg.hosts);
      const start = findSlot(base.network, base.size, used, block);
      if (start < 0) return overflow(base, active, seg, skipped);
      used.push({ start, size: block });
      const prefix = blockToPrefix(block);
      allocations.push({
        id: seg.id || seg.name,
        name: seg.name,
        kind: seg.kind,
        phase,
        hosts: seg.hosts,
        needed: seg.hosts + 2,
        blockSize: block,
        prefix,
        networkInt: start,
        network: intToIp(start),
        cidr: `${intToIp(start)}/${prefix}`,
        mask: prefixToMask(prefix),
        firstUsableInt: start + 1,
        lastUsableInt: start + block - 2,
        firstUsable: intToIp(start + 1),
        lastUsable: intToIp(start + block - 2),
        broadcast: intToIp(start + block - 1),
        usableCount: block - 2,
      });
    }
    if (phase === 'core') coreStats = stats(base, used);
  }

  return { ok: true, base, allocations, skipped, core: coreStats, total: stats(base, used) };
}

/** Build the "does not fit" error with a suggested bigger base network. */
function overflow(base, active, failed, skipped) {
  const needed = active.reduce((sum, s) => sum + blockSizeFor(s.hosts), 0);
  const size = nextPow2(needed);
  const prefix = blockToPrefix(size);
  const network = Math.floor(base.network / size) * size;
  const suggestion = prefix >= 8 ? `${intToIp(network)}/${prefix}` : null;
  return {
    ok: false,
    error:
      `The segments need ${needed} addresses but ${base.cidr} only has ${base.size}. ` +
      `"${failed.name}" (${failed.hosts} hosts) did not fit.` +
      (suggestion ? ` Try a bigger base network such as ${suggestion}.` : ''),
    suggestion,
    needed,
    base,
    allocations: [],
    skipped,
  };
}

/**
 * Hand out addresses from an allocation in order.
 * The first usable address goes to the gateway (switch / AP / router),
 * end devices follow.
 * @returns {number[]} integer addresses (length n, or fewer if the subnet is full)
 */
export function assignIps(allocation, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const addr = allocation.firstUsableInt + i;
    if (addr > allocation.lastUsableInt) break;
    out.push(addr);
  }
  return out;
}
