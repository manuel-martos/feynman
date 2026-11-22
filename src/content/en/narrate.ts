import type { Timeline, Traversal } from '../../engine';
import { cap, counts, list as listWith, sum, sup, type Caption } from '../narrate';

const NAME: Record<string, string> = { 'e-': 'electron', 'e+': 'positron', gamma: 'photon' };
const article = (next: string) => (/^[aeiou]/.test(next) ? 'an' : 'a');

const name = (t: Traversal) => {
  const words = `${t.virtual ? 'virtual ' : ''}${NAME[t.species]}`;
  return `${article(words)} ${words}`;
};
const list = (xs: string[]) => listWith(xs, 'and');

function summary(ts: Traversal[]) {
  const word = (s: string, n: number) => (n === 1 ? `${article(NAME[s])} ${NAME[s]}` : `${n === 2 ? 'two' : n === 3 ? 'three' : n} ${NAME[s]}s`);
  return list(counts(ts).map(([s, n]) => word(s, n)));
}

/** Plain-language description of one moment of a diagram read in time. */
export function narrate(tl: Timeline, step: number): Caption {
  const vertices = tl.events.length;
  if (step <= 0) {
    const ins = tl.traversals.filter((t) => tl.rank.get(t.start) === 0);
    const positron = ins.some((t) => t.species === 'e+');
    return {
      title: 'At the start',
      text: ins.length
        ? `${cap(summary(ins))} ${ins.length === 1 ? 'comes' : 'come'} in.${positron ? ' The positron moves forward in time like everything else, even though its arrow points backward.' : ''}`
        : 'No particle comes in: everything starts in the vacuum.',
    };
  }
  if (step > vertices) {
    const outs = tl.traversals.filter((t) => tl.rank.get(t.end) === vertices + 1);
    return {
      title: 'At the end',
      text: `${outs.length ? `${cap(summary(outs))} ${outs.length === 1 ? 'goes' : 'go'} out.` : 'No particle goes out.'} With ${vertices} ${vertices === 1 ? 'vertex' : 'vertices'}, the amplitude of this story is proportional to e${sup(vertices)}.`,
    };
  }
  const ev = tl.events[step - 1];
  const fIn = ev.ins.filter((t) => t.species !== 'gamma');
  const gIn = ev.ins.filter((t) => t.species === 'gamma');
  const fOut = ev.outs.filter((t) => t.species !== 'gamma');
  const gOut = ev.outs.filter((t) => t.species === 'gamma');
  let text: string;
  if (ev.ins.length === 0) text = `Out of the vacuum, for an instant, come ${list(ev.outs.map(name))}.`;
  else if (ev.outs.length === 0) text = `${cap(list(ev.ins.map(name)))} meet and vanish completely.`;
  else if (fIn.length === 1 && fOut.length === 1 && gOut.length === 1) {
    text = `${cap(name(fIn[0]))} emits ${name(gOut[0])}`;
    text += fIn[0].virtual === fOut[0].virtual ? ' and carries on.' : ` and continues as ${name(fOut[0])}.`;
  } else if (fIn.length === 1 && gIn.length === 1 && fOut.length === 1) {
    text = `${cap(name(fIn[0]))} absorbs ${name(gIn[0])}`;
    text += fIn[0].virtual === fOut[0].virtual ? '.' : ` and continues as ${name(fOut[0])}.`;
  } else if (fIn.length === 2) text = `${cap(name(fIn[0]))} and ${name(fIn[1])} annihilate into ${name(gOut[0])}.`;
  else text = `${cap(name(gIn[0]))} turns into a pair: ${name(fOut[0])} and ${name(fOut[1])}.`;
  return { title: `Vertex ${step}`, text, charge: `${sum(ev.ins)} → ${sum(ev.outs)}` };
}
