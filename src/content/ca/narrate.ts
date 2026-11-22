import type { Timeline, Traversal } from '../../engine';
import { cap, counts, list as listWith, sum, sup, type Caption } from '../narrate';

const NAME: Record<string, string> = { 'e-': 'electró', 'e+': 'positró', gamma: 'fotó' };
const PLURAL: Record<string, string> = { 'e-': 'electrons', 'e+': 'positrons', gamma: 'fotons' };

const name = (t: Traversal) => `un ${NAME[t.species]}${t.virtual ? ' virtual' : ''}`;
const list = (xs: string[]) => listWith(xs, 'i');

function summary(ts: Traversal[]) {
  const word = (s: string, n: number) => (n === 1 ? `un ${NAME[s]}` : `${n === 2 ? 'dos' : n === 3 ? 'tres' : n} ${PLURAL[s]}`);
  return list(counts(ts).map(([s, n]) => word(s, n)));
}

/** Plain-language description of one moment of a diagram read in time. */
export function narrate(tl: Timeline, step: number): Caption {
  const vertices = tl.events.length;
  if (step <= 0) {
    const ins = tl.traversals.filter((t) => tl.rank.get(t.start) === 0);
    const positron = ins.some((t) => t.species === 'e+');
    return {
      title: 'Al principi',
      text: ins.length
        ? `${ins.length === 1 ? 'Entra' : 'Entren'} ${summary(ins)}.${positron ? ' El positró avança en el temps com tota la resta, encara que la seva fletxa apunti cap enrere.' : ''}`
        : 'No entra cap partícula: tot comença en el buit.',
    };
  }
  if (step > vertices) {
    const outs = tl.traversals.filter((t) => tl.rank.get(t.end) === vertices + 1);
    return {
      title: 'Al final',
      text: `${outs.length ? `${outs.length === 1 ? 'Surt' : 'Surten'} ${summary(outs)}.` : 'No surt cap partícula.'} Amb ${vertices} ${vertices === 1 ? 'vèrtex' : 'vèrtexs'}, l'amplitud d'aquesta història és proporcional a e${sup(vertices)}.`,
    };
  }
  const ev = tl.events[step - 1];
  const fIn = ev.ins.filter((t) => t.species !== 'gamma');
  const gIn = ev.ins.filter((t) => t.species === 'gamma');
  const fOut = ev.outs.filter((t) => t.species !== 'gamma');
  const gOut = ev.outs.filter((t) => t.species === 'gamma');
  let text: string;
  if (ev.ins.length === 0) text = `Del buit sorgeixen, per un instant, ${list(ev.outs.map(name))}.`;
  else if (ev.outs.length === 0) text = `${cap(list(ev.ins.map(name)))} es troben i desapareixen del tot.`;
  else if (fIn.length === 1 && fOut.length === 1 && gOut.length === 1) {
    text = `${cap(name(fIn[0]))} emet ${name(gOut[0])}`;
    text += fIn[0].virtual === fOut[0].virtual ? ' i continua el seu camí.' : ` i continua com a ${name(fOut[0])}.`;
  } else if (fIn.length === 1 && gIn.length === 1 && fOut.length === 1) {
    text = `${cap(name(fIn[0]))} absorbeix ${name(gIn[0])}`;
    text += fIn[0].virtual === fOut[0].virtual ? '.' : ` i continua com a ${name(fOut[0])}.`;
  } else if (fIn.length === 2) text = `${cap(name(fIn[0]))} i ${name(fIn[1])} s'anihilen en ${name(gOut[0])}.`;
  else text = `${cap(name(gIn[0]))} es converteix en un parell: ${name(fOut[0])} i ${name(fOut[1])}.`;
  return { title: `Vèrtex ${step}`, text, charge: `${sum(ev.ins)} → ${sum(ev.outs)}` };
}
