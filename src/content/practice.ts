/**
 * "Dominio" (Mastery) mode — procedurally generated review questions. Diagrams come
 * from the engine's enumerator, so every question is new yet always correct.
 * The wording comes from a per-locale {@link PracticeText} table, which is also
 * exported to shared/content/<locale>.json for the Android app.
 */
import { PROCESSES, channelOf, cloneDiagram, edgeRole, enumerateTree2to2, validate, type Diagram, type Issue } from '../engine';
import type { ChoiceStep, Step, TapStep } from '../game/types';

type P = keyof typeof PROCESSES;
type Hints = [string, string];
type Side = { one: string; many: string };

export interface PracticeText {
  processes: Record<P, string>;
  identify: { prompt: string; feedback: string; hints: Hints };
  internal: { prompt: string; wrongDefault: string; hints: Hints };
  /** "Tap the/an <species> coming in/going out", by species, side and whether there are several. */
  species: { prompts: Record<'e-' | 'e+' | 'gamma', { in: Side; out: Side }>; wrongDefault: string; hintIn: string; hintOut: string; hint: string };
  validity: { prompt: string; yes: string; no: string; valid: string; hints: Hints };
  channel: { prompt: string; options: Record<'s' | 't' | 'u', string>; feedback: string; hints: Hints };
}

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

function identify(t: PracticeText, pool: P[]): ChoiceStep {
  const { p, d } = randomDiagram(pool);
  const others = shuffle((Object.keys(t.processes) as P[]).filter((x) => x !== p)).slice(0, 2);
  return {
    id: sid('identify'),
    kind: 'choice',
    prompt: t.identify.prompt,
    diagram: d,
    options: shuffle([p, ...others]).map((x) => ({
      id: x,
      text: t.processes[x],
      correct: x === p,
      feedback: x === p ? undefined : t.identify.feedback,
    })),
    hints: t.identify.hints,
  };
}

function tapInternal(t: PracticeText, pool: P[]): TapStep {
  const { d } = randomDiagram(pool);
  return {
    id: sid('internal'),
    kind: 'tap',
    prompt: t.internal.prompt,
    diagram: d,
    targets: d.edges.filter((e) => edgeRole(d, e) === 'internal').map((e) => e.id),
    mode: 'any',
    tappable: 'edges',
    wrongDefault: t.internal.wrongDefault,
    hints: t.internal.hints,
  };
}

function tapSpecies(t: PracticeText, pool: P[]): TapStep {
  const { p, d } = randomDiagram(pool);
  const legs = PROCESSES[p];
  const leg = pick(legs);
  const targets = legs.filter((l) => l.species === leg.species && l.kind === leg.kind).map((l) => l.id);
  const side = t.species.prompts[leg.species][leg.kind === 'in' ? 'in' : 'out'];
  return {
    id: sid('species'),
    kind: 'tap',
    prompt: targets.length > 1 ? side.many : side.one,
    diagram: d,
    targets,
    mode: 'any',
    tappable: 'edges',
    wrongDefault: t.species.wrongDefault,
    hints: [leg.kind === 'in' ? t.species.hintIn : t.species.hintOut, t.species.hint],
  };
}

function validity(t: PracticeText, issueBody: (i: Issue) => string, pool: P[]): ChoiceStep {
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
  const why = r.ok ? t.validity.valid : issueBody(r.issues[0]);
  return {
    id: sid('valid'),
    kind: 'choice',
    prompt: t.validity.prompt,
    diagram: shown,
    options: [
      { id: 'yes', text: t.validity.yes, correct: r.ok, feedback: r.ok ? undefined : why },
      { id: 'no', text: t.validity.no, correct: !r.ok, feedback: r.ok ? why : undefined },
    ],
    hints: t.validity.hints,
    solved: why,
  };
}

function channel(t: PracticeText, pool: P[]): ChoiceStep {
  const { d } = randomDiagram(pool);
  const ch = channelOf(d)!;
  return {
    id: sid('channel'),
    kind: 'choice',
    prompt: t.channel.prompt,
    diagram: d,
    options: (['s', 't', 'u'] as const).map((c) => ({ id: c, text: t.channel.options[c], correct: c === ch, feedback: c === ch ? undefined : t.channel.feedback })),
    hints: t.channel.hints,
  };
}

/** A fresh six-question session, with harder question kinds as the campaign progresses. */
export function practiceSession(levelsDone: number, t: PracticeText, issueBody: (i: Issue) => string): Step[] {
  const pool: P[] = ['moller', 'bhabha', 'annihilation'];
  if (levelsDone >= 16) pool.push('compton');
  if (levelsDone >= 22) pool.push('pairProduction', 'positronScattering');
  const makers: ((pool: P[]) => Step)[] = [(x) => identify(t, x), (x) => tapInternal(t, x), (x) => tapSpecies(t, x), (x) => validity(t, issueBody, x)];
  if (levelsDone >= 19) makers.push((x) => channel(t, x));
  const steps: Step[] = [tapSpecies(t, pool), identify(t, pool)];
  while (steps.length < 6) steps.push(pick(makers)(pool));
  return shuffle(steps);
}
