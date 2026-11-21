import type { Timeline, Traversal } from '../../engine';

export interface Caption {
  title: string;
  text: string;
  /** Charge balance at a vertex, e.g. "−1 → −1 + 0". */
  charge?: string;
}

const NAME: Record<string, string> = { 'e-': 'electrón', 'e+': 'positrón', gamma: 'fotón' };
const CHARGE: Record<string, number> = { 'e-': -1, 'e+': 1, gamma: 0 };

const name = (t: Traversal) => `un ${NAME[t.species]}${t.virtual ? ' virtual' : ''}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);
const num = (q: number) => (q < 0 ? `−${-q}` : q > 0 ? `+${q}` : '0');
const sum = (ts: Traversal[]) => {
  if (!ts.length) return '0';
  const qs = ts.map((t) => CHARGE[t.species]);
  return [num(qs[0]), ...qs.slice(1).map((q) => (q < 0 ? `− ${-q}` : `+ ${q}`))].join(' ');
};

function summary(ts: Traversal[]) {
  const counts = new Map<string, number>();
  for (const t of ts) counts.set(t.species, (counts.get(t.species) ?? 0) + 1);
  const word = (s: string, n: number) => {
    const base = NAME[s];
    if (n === 1) return `un ${base}`;
    const plural = base.endsWith('n') ? base.replace(/ón$/, 'ones') : `${base}s`;
    return `${n === 2 ? 'dos' : n === 3 ? 'tres' : n} ${plural}`;
  };
  return list([...counts].map(([s, n]) => word(s, n)));
}

/** Plain-language description of one moment of a diagram read in time. */
export function narrate(tl: Timeline, step: number): Caption {
  const vertices = tl.events.length;
  if (step <= 0) {
    const ins = tl.traversals.filter((t) => tl.rank.get(t.start) === 0);
    const positron = ins.some((t) => t.species === 'e+');
    return {
      title: 'Al principio',
      text: ins.length
        ? `Entran ${summary(ins)}.${positron ? ' El positrón avanza en el tiempo como todo lo demás, aunque su flecha apunte hacia atrás.' : ''}`
        : 'No entra ninguna partícula: todo empieza en el vacío.',
    };
  }
  if (step > vertices) {
    const outs = tl.traversals.filter((t) => tl.rank.get(t.end) === vertices + 1);
    return {
      title: 'Al final',
      text: `${outs.length ? `Salen ${summary(outs)}.` : 'No sale ninguna partícula.'} Con ${vertices} ${vertices === 1 ? 'vértice' : 'vértices'}, la amplitud de esta historia es proporcional a e${sup(vertices)}.`,
    };
  }
  const ev = tl.events[step - 1];
  const fIn = ev.ins.filter((t) => t.species !== 'gamma');
  const gIn = ev.ins.filter((t) => t.species === 'gamma');
  const fOut = ev.outs.filter((t) => t.species !== 'gamma');
  const gOut = ev.outs.filter((t) => t.species === 'gamma');
  let text: string;
  if (ev.ins.length === 0) text = `Del vacío surgen, por un instante, ${list(ev.outs.map(name))}.`;
  else if (ev.outs.length === 0) text = `${cap(list(ev.ins.map(name)))} se encuentran y desaparecen por completo.`;
  else if (fIn.length === 1 && fOut.length === 1 && gOut.length === 1) {
    text = `${cap(name(fIn[0]))} emite ${name(gOut[0])}`;
    text += fIn[0].virtual === fOut[0].virtual ? ' y sigue su camino.' : ` y continúa como ${name(fOut[0])}.`;
  } else if (fIn.length === 1 && gIn.length === 1 && fOut.length === 1) {
    text = `${cap(name(fIn[0]))} absorbe ${name(gIn[0])}`;
    text += fIn[0].virtual === fOut[0].virtual ? '.' : ` y continúa como ${name(fOut[0])}.`;
  } else if (fIn.length === 2) text = `${cap(name(fIn[0]))} y ${name(fIn[1])} se aniquilan en ${name(gOut[0])}.`;
  else text = `${cap(name(gIn[0]))} se convierte en un par: ${name(fOut[0])} y ${name(fOut[1])}.`;
  return { title: `Vértice ${step}`, text, charge: `${sum(ev.ins)} → ${sum(ev.outs)}` };
}

function sup(n: number) {
  return String(n)
    .split('')
    .map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)])
    .join('');
}
