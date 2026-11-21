/**
 * "Dominio" mode — procedurally generated review questions. Diagrams come
 * from the engine's enumerator, so every question is new yet always correct.
 */
import { PROCESSES, channelOf, cloneDiagram, edgeRole, enumerateTree2to2, validate, type Diagram } from '../../engine';
import type { ChoiceStep, Step, TapStep } from '../../game/types';
import { issueText } from './issues';

type P = keyof typeof PROCESSES;

const NAMES: Record<P, string> = {
  moller: 'Dispersión de Møller (e⁻e⁻ → e⁻e⁻)',
  bhabha: 'Dispersión de Bhabha (e⁻e⁺ → e⁻e⁺)',
  annihilation: 'Aniquilación (e⁻e⁺ → γγ)',
  compton: 'Dispersión Compton (e⁻γ → e⁻γ)',
  pairProduction: 'Creación de pares (γγ → e⁻e⁺)',
  positronScattering: 'Dispersión positrón–positrón (e⁺e⁺ → e⁺e⁺)',
};

const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
const shuffle = <T,>(xs: T[]): T[] => xs.map((x) => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

function randomDiagram(pool: P[]): { p: P; d: Diagram } {
  const p = pick(pool);
  const d = pick(enumerateTree2to2(PROCESSES[p]));
  // Rename edges like the campaign fixtures and drop goals.
  return {
    p,
    d: {
      nodes: d.nodes.map(({ expect: _x, ...n }) => n),
      edges: d.edges.map((e) => ({ ...e, id: [e.from, e.to].find((x) => x !== 'vA' && x !== 'vB') ?? 'int' })),
    },
  };
}

let uid = 0;
const sid = (k: string) => `${k}-${uid++}`;

function identify(pool: P[]): ChoiceStep {
  const { p, d } = randomDiagram(pool);
  const others = shuffle((Object.keys(NAMES) as P[]).filter((x) => x !== p)).slice(0, 2);
  return {
    id: sid('identify'),
    kind: 'choice',
    prompt: '¿Qué proceso representa este diagrama?',
    diagram: d,
    options: shuffle([p, ...others]).map((x) => ({
      id: x,
      text: NAMES[x],
      correct: x === p,
      feedback: x === p ? undefined : 'Lee primero las partículas de la izquierda (entran) y después las de la derecha (salen).',
    })),
    hints: ['Identifica las partículas que entran por la izquierda.', 'Flecha a favor del tiempo: e⁻. Contra el tiempo: e⁺. Ondulada: γ.'],
  };
}

function tapInternal(pool: P[]): TapStep {
  const { d } = randomDiagram(pool);
  return {
    id: sid('internal'),
    kind: 'tap',
    prompt: 'Toca la línea interna (la partícula virtual).',
    diagram: d,
    targets: d.edges.filter((e) => edgeRole(d, e) === 'internal').map((e) => e.id),
    mode: 'any',
    tappable: 'edges',
    wrongDefault: 'Esa línea toca un borde: es externa.',
    hints: ['Busca la línea que une dos vértices.', 'No toca ningún borde del diagrama.'],
  };
}

function tapSpecies(pool: P[]): TapStep {
  const { p, d } = randomDiagram(pool);
  const legs = PROCESSES[p];
  const leg = pick(legs);
  const word = { 'e-': 'electrón', 'e+': 'positrón', gamma: 'fotón' }[leg.species];
  const side = leg.kind === 'in' ? 'entra' : 'sale';
  const targets = legs.filter((l) => l.species === leg.species && l.kind === leg.kind).map((l) => l.id);
  return {
    id: sid('species'),
    kind: 'tap',
    prompt: `Toca ${targets.length > 1 ? 'un' : 'el'} ${word} que ${side}.`,
    diagram: d,
    targets,
    mode: 'any',
    tappable: 'edges',
    wrongDefault: 'Fíjate en el tipo de línea, en su flecha y en el lado donde está.',
    hints: [leg.kind === 'in' ? 'Lo que entra está a la izquierda.' : 'Lo que sale está a la derecha.', 'Flecha a favor del tiempo: e⁻. Contra el tiempo: e⁺. Ondulada: γ.'],
  };
}

function validity(pool: P[]): ChoiceStep {
  const { d } = randomDiagram(pool);
  const broken = Math.random() < 0.6;
  let shown = d;
  if (broken) {
    shown = cloneDiagram(d);
    const fermions = shown.edges.filter((e) => e.type === 'fermion');
    const victim = pick(fermions);
    if (Math.random() < 0.5 || !fermions.length) {
      const e = pick(shown.edges);
      e.type = e.type === 'photon' ? 'fermion' : 'photon';
    } else {
      [victim.from, victim.to] = [victim.to, victim.from];
    }
  }
  const r = validate(shown);
  const why = r.ok ? 'Cada vértice tiene un fotón, una flecha que entra y otra que sale.' : issueText(r.issues[0]).body;
  return {
    id: sid('valid'),
    kind: 'choice',
    prompt: '¿Cumple este diagrama las reglas de QED?',
    diagram: shown,
    options: [
      { id: 'yes', text: 'Sí, es válido', correct: r.ok, feedback: r.ok ? undefined : why },
      { id: 'no', text: 'No, rompe alguna regla', correct: !r.ok, feedback: r.ok ? why : undefined },
    ],
    hints: ['Revisa los vértices uno a uno.', 'En cada vértice: exactamente un fotón, una flecha que entra y una que sale.'],
    solved: why,
  };
}

function channel(pool: P[]): ChoiceStep {
  const { d } = randomDiagram(pool);
  const ch = channelOf(d)!;
  const text = {
    s: 'Canal s: las dos partículas iniciales comparten vértice',
    t: 'Canal t: cada partícula inicial comparte vértice con la final del mismo lado',
    u: 'Canal u: las líneas se cruzan',
  };
  return {
    id: sid('channel'),
    kind: 'choice',
    prompt: '¿Qué tipo de contribución (canal) es este diagrama?',
    diagram: d,
    options: (['s', 't', 'u'] as const).map((c) => ({ id: c, text: text[c], correct: c === ch, feedback: c === ch ? undefined : 'Mira qué partículas comparten el vértice con la de arriba a la izquierda.' })),
    hints: ['Fíjate en la partícula de arriba a la izquierda.', '¿Comparte vértice con la otra inicial (s), con la final de arriba (t) o con la final de abajo (u)?'],
  };
}

export function practiceSession(levelsDone: number): Step[] {
  const pool: P[] = ['moller', 'bhabha', 'annihilation'];
  if (levelsDone >= 16) pool.push('compton');
  if (levelsDone >= 22) pool.push('pairProduction', 'positronScattering');
  const makers = [identify, tapInternal, tapSpecies, validity];
  if (levelsDone >= 19) makers.push(channel);
  const steps: Step[] = [tapSpecies(pool), identify(pool)];
  while (steps.length < 6) steps.push(pick(makers)(pool));
  return shuffle(steps);
}
