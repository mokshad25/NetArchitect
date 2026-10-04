/**
 * The landing page's worked example, computed by the real engine at render
 * time so the numbers on the page always match what the designer produces.
 */
import { designNetwork } from '../../engine/designNetwork.js';
import { demoRequirements } from '../../engine/constants.js';
import { shortIp } from '../../engine/ipUtils.js';

let cached = null;

/** Full pipeline output for the demo scenario (memoised). */
export function getDemoDesign() {
  if (!cached) cached = designNetwork(demoRequirements());
  return cached;
}

/** The five core VLSM segments as display rows. */
export function vlsmExampleRows() {
  return getDemoDesign()
    .vlsm.allocations.filter((a) => a.phase === 'core')
    .map((a) => ({
      id: a.id,
      name: a.name,
      hosts: a.hosts,
      cidr: a.cidr,
      mask: a.mask,
      usable: `${shortIp(a.firstUsableInt)}–${shortIp(a.lastUsableInt)}`,
      broadcast: shortIp(a.lastUsableInt + 1),
      blockSize: a.blockSize,
      prefix: a.prefix,
    }));
}

/** "124 of 256 used, .124–.255 free (132)" as data. */
export function vlsmExampleUsage() {
  const { vlsm } = getDemoDesign();
  const free = vlsm.core.freeRanges[0];
  return {
    base: vlsm.base.cidr,
    size: vlsm.base.size,
    used: vlsm.core.used,
    free: vlsm.core.free,
    freeFrom: shortIp(free.startInt),
    freeTo: shortIp(free.endInt),
  };
}
