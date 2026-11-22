/**
 * Exports the single sources of truth that the native apps consume:
 *   shared/content/{es,ca,en}.json — chapters, levels, concepts, ranks, Mastery-mode text
 *   shared/engine-cases.json       — golden cases computed by the TypeScript engine, with
 *                                    issue texts and narration in every language
 *
 * Run with `npm run export:shared`. CI fails if the committed files are stale.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  PROCESSES,
  channelOf,
  cloneDiagram,
  couplingOrder,
  edgeLabel,
  enumerateTree2to2,
  enumerateTrees,
  fermionLoops,
  loopCount,
  loopEdges,
  timeline,
  topologySignature,
  validate,
  type Diagram,
  type ValidationOptions,
} from '../src/engine';
import { LOCALES, pack } from '../src/content';
import { ca } from '../src/i18n/ca';
import { en } from '../src/i18n/en';
import { es } from '../src/i18n/es';
import { RANKS, XP_BASE, XP_PER_STAR } from '../src/game/scoring';
import { plain, process } from '../src/content/diagrams';

const root = resolve(import.meta.dirname, '..');
const write = (path: string, data: unknown, pretty = true) => {
  const file = resolve(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, (pretty ? JSON.stringify(data, null, 1) : JSON.stringify(data)) + '\n');
  console.log('wrote', path);
};

/* ---------------- content ---------------- */

const DICTS = { es, ca, en };
for (const l of LOCALES) {
  const p = pack(l);
  write(`shared/content/${l}.json`, {
    locale: l,
    chapters: p.content.chapters,
    levels: p.content.levels,
    concepts: p.content.concepts,
    scoring: { xpBase: XP_BASE, xpPerStar: XP_PER_STAR, ranks: RANKS.map((r) => ({ ...r, title: DICTS[l].ranks[r.id] })) },
    practice: p.practice,
    // Decorative diagrams used outside the levels (home hero, onboarding).
    art: { home: plain(process('bhabha', 's')), onboarding: plain(process('moller', 't')) },
  });
}
const { content } = pack('es');
const packs = LOCALES.map((l) => [l, pack(l)] as const);
const perLocale = <T,>(f: (p: ReturnType<typeof pack>) => T) => Object.fromEntries(packs.map(([l, p]) => [l, f(p)]));

/* ---------------- engine golden cases ---------------- */

// Deterministic PRNG so the case set is stable between runs.
let seed = 20261121;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];

const diagrams: { name: string; d: Diagram; opts: ValidationOptions[] }[] = [];
const add = (name: string, d: Diagram, opts: ValidationOptions[] = [{}]) => diagrams.push({ name, d, opts });

for (const l of content.levels) {
  for (const s of l.steps) {
    const key = `L${l.id}/${s.id}`;
    if (s.kind === 'build') add(key, s.diagram, [{}, s.validation]);
    else if (s.kind === 'tap') add(key, s.diagram);
    else {
      if (s.diagram) add(key, s.diagram, [{}, { kinematics: true }]);
      s.diagrams?.forEach((x, i) => add(`${key}/d${i}`, x.diagram));
      s.options.forEach((o) => o.diagram && add(`${key}/${o.id}`, o.diagram, [{}, { kinematics: true }]));
    }
  }
}
for (const c of content.concepts) if (c.diagram) add(`concept/${c.id}`, c.diagram, [{}, { kinematics: true }, { loops: 1 }]);
for (const [p, legs] of Object.entries(PROCESSES)) {
  enumerateTree2to2(legs).forEach((d, i) => add(`tree2/${p}/${i}`, d, [{ kinematics: true }, { kinematics: true, channel: 's' }, { channel: 't' }, { channel: 'u' }]));
}

// Every tree for a few processes, plus a copy with one external arrow flipped
// and its charge-conjugated copy.
const specOf = (s: string) => {
  const [i, o] = s.split('>').map((x) => x.trim().split(/\s+/));
  return [
    ...i.map((sp, k) => ({ id: `in${k + 1}`, kind: 'in' as const, species: sp as 'e-' })),
    ...o.map((sp, k) => ({ id: `out${k + 1}`, kind: 'out' as const, species: sp as 'e-' })),
  ];
};
for (const p of ['e- e- > e- e- gamma', 'e- e+ > gamma gamma gamma', 'e+ gamma > e+ gamma']) {
  enumerateTrees(specOf(p)).forEach((d, i) => {
    d.nodes.forEach((n, k) => ((n.x = (k * 37) % 100), (n.y = (k * 23) % 72)));
    add(`trees/${p}/${i}`, d, [{ kinematics: true }]);
    // Charge conjugation: flip every fermion line. Still a valid diagram,
    // but each electron becomes a positron → EXTERNAL_MISMATCH.
    const f = cloneDiagram(d);
    f.edges.forEach((e) => e.type === 'fermion' && ([e.from, e.to] = [e.to, e.from]));
    add(`trees-cc/${p}/${i}`, f, [{ kinematics: true }, {}]);
  });
}
// Odd and even closed electron loops (Furry).
for (const n of [1, 2, 3, 4, 5]) {
  const nodes: Diagram['nodes'] = [];
  const edges: Diagram['edges'] = [];
  for (let k = 0; k < n; k++) {
    nodes.push({ id: `v${k}`, kind: 'vertex', x: 50 + 20 * Math.cos(k), y: 36 + 20 * Math.sin(k) }, { id: `g${k}`, kind: k % 2 ? 'out' : 'in', x: k * 10, y: k * 5 });
    edges.push({ id: `p${k}`, type: 'photon', from: `g${k}`, to: `v${k}` });
    if (n > 1) edges.push({ id: `f${k}`, type: 'fermion', from: `v${k}`, to: `v${(k + 1) % n}` });
  }
  if (n === 1) edges.push({ id: 'self', type: 'fermion', from: 'v0', to: 'v0' });
  add(`furry/${n}`, { nodes, edges }, [{ loops: 1 }, { loops: 1, kinematics: true }]);
}

// Mutations: flip arrows, retype lines, delete or add lines, move vertices.
const base = [...diagrams];
for (let i = 0; i < 220; i++) {
  const src = pick(base);
  const d = cloneDiagram(src.d);
  const n = 1 + Math.floor(rnd() * 3);
  for (let k = 0; k < n; k++) {
    const op = rnd();
    const e = d.edges.length ? pick(d.edges) : undefined;
    if (op < 0.3 && e && e.type === 'fermion') [e.from, e.to] = [e.to, e.from];
    else if (op < 0.5 && e) e.type = e.type === 'photon' ? 'fermion' : 'photon';
    else if (op < 0.7 && e) d.edges = d.edges.filter((x) => x !== e);
    else if (op < 0.85 && d.nodes.length > 1) {
      const a = pick(d.nodes);
      const b = pick(d.nodes);
      d.edges.push({ id: `m${i}-${k}`, type: rnd() < 0.5 ? 'photon' : 'fermion', from: a.id, to: b.id });
    } else {
      const v = pick(d.nodes);
      v.x = Math.round(rnd() * 100);
      v.y = Math.round(rnd() * 72);
    }
  }
  add(`mut${i}/${src.name}`, d, [{}, { kinematics: true }, { loops: 1, kinematics: true }, pick([{ channel: 't' as const }, { differentFrom: [src.d] }])]);
}

const cases = diagrams.map(({ name, d, opts }) => {
  const tl = timeline(d);
  return {
    name,
    diagram: d,
    validations: opts.map((o) => {
      const r = validate(d, o);
      return { options: o, ok: r.ok, issues: r.issues, texts: perLocale((p) => r.issues.map(p.issueText)) };
    }),
    topology: topologySignature(d),
    channel: channelOf(d),
    loops: loopCount(d),
    loopEdges: loopEdges(d),
    fermionLoops: fermionLoops(d).map((l) => [...l].sort()),
    order: couplingOrder(d),
    labels: Object.fromEntries(d.edges.map((e) => [e.id, edgeLabel(d, e)])),
    timeline: {
      rank: Object.fromEntries(tl.rank),
      events: tl.events.map((ev) => ({
        vertex: ev.vertex,
        ins: ev.ins.map((t) => ({ edge: t.edge.id, start: t.start, end: t.end, species: t.species, virtual: t.virtual })),
        outs: ev.outs.map((t) => ({ edge: t.edge.id, start: t.start, end: t.end, species: t.species, virtual: t.virtual })),
      })),
      // Narration is only defined for diagrams whose vertices all have degree 3.
      narration: validate(d, { loops: 9 }).issues.some((i) => i.layer === 'structural' || i.layer === 'theory')
        ? null
        : perLocale((p) => Array.from({ length: tl.events.length + 2 }, (_, k) => p.narrate(tl, k))),
    },
  };
});

const enumerations = ['e- e- > e- e-', 'e- e+ > e- e+', 'e- gamma > e- gamma', 'gamma gamma > e- e+', 'e- e- > e- e- gamma', 'e- e+ > gamma gamma gamma', 'gamma gamma > gamma gamma', 'e- > e- gamma', 'e- e+ > e- e+ gamma'].map((s) => ({
  process: s,
  externals: specOf(s),
  signatures: enumerateTrees(specOf(s)).map(topologySignature).sort(),
}));

write('shared/engine-cases.json', { generatedBy: 'scripts/export-shared.ts', cases, enumerations }, false);
