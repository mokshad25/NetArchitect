/** Earthy segment color token for the i-th allocation (cycles through 8). */
export const segmentColor = (i) => `var(--seg-${(i % 8) + 1})`;
