/**
 * ipUtils.js — small helpers for working with IPv4 addresses.
 *
 * Internally every address is an unsigned 32-bit integer, which makes
 * subnet math (masks, alignment, block sizes) simple arithmetic.
 */

const CIDR_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/;

/** "192.168.10.5" -> 3232238085 */
export function ipToInt(ip) {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/** 3232238085 -> "192.168.10.5" */
export function intToIp(n) {
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

/** 26 -> "255.255.255.192" */
export function prefixToMask(prefix) {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return intToIp(mask);
}

/** Smallest power of two that is >= n (minimum 1). */
export function nextPow2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** Block size -> prefix length, e.g. 64 -> 26. */
export function blockToPrefix(block) {
  return 32 - Math.log2(block);
}

/** Last octet shown as ".62" — handy for compact ranges in the UI. */
export function shortIp(n) {
  return '.' + (n & 255);
}

/**
 * Parse and validate a CIDR string.
 * Returns { ok, network, prefix, size, error?, suggestion? }.
 * The address must be the network address of its block (host bits zero).
 */
export function parseCidr(cidr) {
  const text = String(cidr || '').trim();
  const m = text.match(CIDR_PATTERN);
  if (!m) {
    return { ok: false, error: 'Base network must look like 192.168.10.0/24 (four numbers, a slash, and a prefix).' };
  }
  const octets = m.slice(1, 5).map(Number);
  const prefix = Number(m[5]);
  if (octets.some((o) => o > 255)) {
    return { ok: false, error: 'Each part of the address must be between 0 and 255.' };
  }
  if (prefix < 8 || prefix > 30) {
    return { ok: false, error: 'Prefix must be between /8 and /30.' };
  }
  const ip = ipToInt(octets.join('.'));
  const size = 2 ** (32 - prefix);
  const network = Math.floor(ip / size) * size;
  if (network !== ip) {
    const fixed = `${intToIp(network)}/${prefix}`;
    return {
      ok: false,
      error: `${text} is not a network address (its host bits are not zero). Did you mean ${fixed}?`,
      suggestion: fixed,
    };
  }
  return { ok: true, network, prefix, size };
}
