export interface Pt {
  x: number;
  y: number;
}

/** Control point of a quadratic curve bent perpendicular to a→b. */
export function controlPoint(a: Pt, b: Pt, bend = 0): Pt {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return { x: mx - dy * bend, y: my + dx * bend };
}

export function quadAt(a: Pt, c: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
}

export function quadTangent(a: Pt, c: Pt, b: Pt, t: number): Pt {
  const x = 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x);
  const y = 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y);
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
}

export function straightOrCurvedPath(a: Pt, b: Pt, bend = 0): string {
  if (!bend) return `M${a.x},${a.y} L${b.x},${b.y}`;
  const c = controlPoint(a, b, bend);
  return `M${a.x},${a.y} Q${c.x},${c.y} ${b.x},${b.y}`;
}

/**
 * Sinusoidal "photon" path along a (possibly curved) segment. The amplitude
 * tapers to zero at both ends so it meets vertices cleanly.
 */
export function wavyPath(a: Pt, b: Pt, bend = 0, amplitude = 1.6, wavelength = 4.2): string {
  const c = controlPoint(a, b, bend);
  const approxLen = Math.hypot(b.x - a.x, b.y - a.y) * (1 + Math.abs(bend) * 0.6);
  const waves = Math.max(2, Math.round(approxLen / wavelength));
  const steps = waves * 12;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = quadAt(a, c, b, t);
    const tan = quadTangent(a, c, b, t);
    const taper = Math.min(1, t * 8, (1 - t) * 8);
    const off = Math.sin(t * waves * Math.PI * 2) * amplitude * taper;
    const x = p.x - tan.y * off;
    const y = p.y + tan.x * off;
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)} `;
  }
  return d.trim();
}

/** Arrow head triangle centered at the curve midpoint, pointing a → b. */
export function arrowHead(a: Pt, b: Pt, bend = 0, size = 2.4): string {
  const c = controlPoint(a, b, bend);
  const p = quadAt(a, c, b, 0.5);
  const t = quadTangent(a, c, b, 0.5);
  const n = { x: -t.y, y: t.x };
  const tip = { x: p.x + t.x * size, y: p.y + t.y * size };
  const l = { x: p.x - t.x * size * 0.8 + n.x * size * 0.85, y: p.y - t.y * size * 0.8 + n.y * size * 0.85 };
  const r = { x: p.x - t.x * size * 0.8 - n.x * size * 0.85, y: p.y - t.y * size * 0.8 - n.y * size * 0.85 };
  return `M${tip.x},${tip.y} L${l.x},${l.y} L${r.x},${r.y} Z`;
}

/** Point where a label should sit: off the midpoint, on the normal. */
export function labelPoint(a: Pt, b: Pt, bend = 0, offset = 4.5): Pt {
  const c = controlPoint(a, b, bend);
  const p = quadAt(a, c, b, 0.5);
  const t = quadTangent(a, c, b, 0.5);
  // Prefer placing labels above the line.
  let n = { x: t.y, y: -t.x };
  if (n.y > 0) n = { x: -n.x, y: -n.y };
  return { x: p.x + n.x * offset, y: p.y + n.y * offset };
}

export function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
