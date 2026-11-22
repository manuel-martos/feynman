/** Language-neutral pieces of "watch it in time" narration, shared by every locale's narrate.ts. */
import type { Traversal } from '../engine';

export interface Caption {
  title: string;
  text: string;
  /** Charge balance at a vertex, e.g. "−1 → −1 + 0". */
  charge?: string;
}

const CHARGE: Record<string, number> = { 'e-': -1, 'e+': 1, gamma: 0 };

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "a, b <and> c". */
export const list = (xs: string[], and: string) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${and} ${xs[xs.length - 1]}`);
const num = (q: number) => (q < 0 ? `−${-q}` : q > 0 ? `+${q}` : '0');
/** Signed charge sum, e.g. "−1 + 0". */
export const sum = (ts: Traversal[]) => {
  if (!ts.length) return '0';
  const qs = ts.map((t) => CHARGE[t.species]);
  return [num(qs[0]), ...qs.slice(1).map((q) => (q < 0 ? `− ${-q}` : `+ ${q}`))].join(' ');
};
/** Species and how many of each, in order of first appearance. */
export const counts = (ts: Traversal[]) => {
  const m = new Map<string, number>();
  for (const t of ts) m.set(t.species, (m.get(t.species) ?? 0) + 1);
  return [...m];
};
export const sup = (n: number) =>
  String(n)
    .split('')
    .map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)])
    .join('');
