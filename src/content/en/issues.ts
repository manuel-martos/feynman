import type { Issue, IssueCode } from '../../engine';
import type { IssueText } from '../es/issues';

const SPECIES: Record<string, string> = { 'e-': 'an electron (e⁻)', 'e+': 'a positron (e⁺)', gamma: 'a photon (γ)', '?': 'something else' };
const CHANNEL: Record<string, string> = {
  s: 's channel (the initial particles meet at a vertex)',
  t: 't channel (each particle keeps its “side”)',
  u: 'u channel (the lines cross)',
  '?': 'another kind',
};

const MESSAGES: Record<IssueCode, (i: Issue) => IssueText> = {
  EXTERNAL_UNCONNECTED: () => ({
    title: 'A connection is missing',
    body: 'There\'s an external particle with no line. Every particle coming in and going out must take part in the diagram.',
  }),
  EXTERNAL_OVERCONNECTED: () => ({
    title: 'Too many lines',
    body: 'Each external particle is drawn as a single line that reaches a vertex.',
  }),
  EXTERNAL_TO_EXTERNAL: () => ({
    title: 'A line that doesn\'t interact',
    body: 'You\'ve joined two external particles directly. Without a vertex there\'s no interaction: lines must meet at a vertex.',
  }),
  SELF_LOOP: () => ({ title: 'Line in a loop', body: 'In this campaign a line can\'t start and end at the same point.' }),
  VERTEX_UNUSED: () => ({
    title: 'Empty vertex',
    body: 'There\'s an unused vertex. In this challenge every vertex must be part of the diagram.',
  }),
  VERTEX_DEGREE: (i) => ({
    title: `Vertex with ${i.data?.degree ?? '?'} lines`,
    body: 'A fundamental QED vertex joins exactly three lines: two fermion lines (one arrow in and one out) and a photon.',
  }),
  VERTEX_PHOTON_COUNT: (i) => ({
    title: i.data?.photons === 0 ? 'Vertex without a photon' : 'Too many photons at a vertex',
    body:
      i.data?.photons === 0
        ? 'This vertex joins three fermion lines. In QED, the electron interacts by emitting or absorbing a photon: every vertex needs exactly one photon.'
        : 'A QED vertex has a single photon. The photon has no charge, so two photons can\'t interact directly at a fundamental vertex.',
  }),
  VERTEX_FERMION_FLOW: (i) => ({
    title: 'The arrows don\'t flow',
    body: `At this vertex ${i.data?.arrowsIn === 0 ? 'no arrow comes in' : 'two arrows come in'}. At every vertex one arrow must come in and another go out: it's the visual form of electric charge conservation.`,
  }),
  DISCONNECTED: () => ({
    title: 'Separate parts',
    body: 'The diagram is split into pieces that don\'t touch. For all the particles to interact, everything must be connected.',
  }),
  LOOP: () => ({
    title: 'There\'s a loop',
    body: 'Your diagram contains a closed circuit (a loop). Loops are higher-order corrections; in this challenge we\'re looking for tree-level diagrams.',
  }),
  FURRY: (i) => ({
    title: 'A loop that cancels out',
    body: `Your electron loop has ${i.data?.photons} ${i.data?.photons === 1 ? 'photon' : 'photons'} attached: an odd number. By Furry's theorem, this loop and the same path traversed in the opposite direction cancel exactly.`,
  }),
  EXTERNAL_MISMATCH: (i) => ({
    title: 'Wrong particle',
    body: `There should be ${SPECIES[String(i.data?.expected)]} there, but your line represents ${SPECIES[String(i.data?.got)]}. Remember: an arrow forward in time is an electron; against time, a positron.`,
  }),
  CHARGE_NOT_CONSERVED: (i) => ({
    title: 'Charge isn\'t conserved',
    body: `The initial charge is ${i.data?.initial} and the final one ${i.data?.final}. No QED process can change the total charge.`,
  }),
  KINEMATICALLY_FORBIDDEN: () => ({
    title: 'Allowed, but not possible',
    body: 'The vertex is correct, but a single-vertex process with real free particles can\'t conserve energy and momentum at the same time.',
  }),
  WRONG_CHANNEL: (i) => ({
    title: 'Valid diagram, but not the one asked for',
    body: `You've built a ${CHANNEL[String(i.data?.got)]} diagram. The challenge asked for a ${CHANNEL[String(i.data?.expected)]} one.`,
  }),
  SAME_AS_REFERENCE: () => ({
    title: 'It\'s the same diagram',
    body: 'Even if you draw it differently, it connects the same particles at the same vertices: it\'s the same contribution. Look for another way to pair up the particles.',
  }),
};

export function issueText(i: Issue): IssueText {
  return MESSAGES[i.code](i);
}
