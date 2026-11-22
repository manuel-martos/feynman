import type { Timeline, Traversal } from '../../engine';
import { cap, counts, list as listWith, sum, sup, type Caption } from '../narrate';

const NAME: Record<string, string> = { 'e-': 'electrón', 'e+': 'positrón', gamma: 'fotón' };

const name = (t: Traversal) => `un ${NAME[t.species]}${t.virtual ? ' virtual' : ''}`;
const list = (xs: string[]) => listWith(xs, 'y');

function summary(ts: Traversal[]) {
  const word = (s: string, n: number) => {
    const base = NAME[s];
    if (n === 1) return `un ${base}`;
    const plural = base.endsWith('n') ? base.replace(/ón$/, 'ones') : `${base}s`;
    return `${n === 2 ? 'dos' : n === 3 ? 'tres' : n} ${plural}`;
  };
  return list(counts(ts).map(([s, n]) => word(s, n)));
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
