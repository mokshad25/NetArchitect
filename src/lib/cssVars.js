/**
 * Read CSS custom properties from <html>, e.g. readVars(['--text', '--accent'])
 * → { '--text': '#1c1a17', '--accent': '#b4532a' }.
 * Used by canvas code (vis-network) that cannot use var() directly.
 */
export function readVars(names) {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(names.map((n) => [n, style.getPropertyValue(n).trim()]));
}
