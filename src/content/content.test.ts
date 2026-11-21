import { describe, expect, it } from 'vitest';
import { PROCESSES, channelOf, enumerateTree2to2, enumerateTrees, fermionLoops, loopCount, sameTopology, validate, type Diagram } from '../engine';
import type { BuildStep } from '../game/types';
import { content } from './index';
import { fourLineVertex, brokenMoller } from './es/ch2';
import { mollerT, mollerTRedrawn, mollerU, bhabhaS, bhabhaT } from './es/ch4';
import { brokenCompton, bogusBhabhaU } from './es/ch5';
import { process, vertex } from './diagrams';
import { bremsAfter, bremsBefore, threePhotons, threePhotonsSwapped } from './es/ch6';
import { lightByLight, mollerBox, photonSelfEnergy, schwinger, triangle, vacuumPolarization, vertexCorrection } from './es/ch7';

const { levels, chapters, concepts } = content;

/** Reference solutions for every build step, keyed "level/step". */
const SOLUTIONS: Record<string, () => Diagram> = {
  '7/out-electron': () => vertex([{ id: 'in1', kind: 'in', species: 'e-', x: 0, y: 0 }, { id: 'out1', kind: 'out', species: 'e-', x: 0, y: 0 }, { id: 'g', kind: 'out', species: 'gamma', x: 0, y: 0 }]),
  '7/in-positron': () => vertex([{ id: 'in1', kind: 'in', species: 'e-', x: 0, y: 0 }, { id: 'in2', kind: 'in', species: 'e+', x: 0, y: 0 }, { id: 'g', kind: 'out', species: 'gamma', x: 0, y: 0 }]),
  '8/fix-flow': () => process('moller', 't'),
  '10/pair': () => vertex([{ id: 'g', kind: 'in', species: 'gamma', x: 0, y: 0 }, { id: 'out1', kind: 'out', species: 'e-', x: 0, y: 0 }, { id: 'out2', kind: 'out', species: 'e+', x: 0, y: 0 }]),
  '10/positron': () => vertex([{ id: 'in1', kind: 'in', species: 'e+', x: 0, y: 0 }, { id: 'out1', kind: 'out', species: 'e+', x: 0, y: 0 }, { id: 'g', kind: 'out', species: 'gamma', x: 0, y: 0 }]),
  '12/exchange': () => process('moller', 't'),
  '13/bhabha': () => process('bhabha', 't'),
  '15/build': () => process('annihilation', 't'),
  '16/build': () => process('compton', 's'),
  '18/u': () => process('moller', 'u'),
  '19/s': () => process('bhabha', 's'),
  '21/fix': () => process('compton', 's'),
  '22/build': () => process('pairProduction', 't'),
  '24/t': () => process('moller', 't'),
  '24/u': () => process('moller', 'u'),
  '25/build': bremsAfter,
  '27/build': threePhotons,
  '28/other': threePhotonsSwapped,
  '30/build': vacuumPolarization,
  '31/build': schwinger,
  '32/box': lightByLight,
  '34/box': mollerBox,
};

describe('campaign structure', () => {
  it('has 34 levels in 7 chapters with the planned distribution', () => {
    expect(levels).toHaveLength(34);
    expect(levels.map((l) => l.id)).toEqual(Array.from({ length: 34 }, (_, i) => i + 1));
    const per = chapters.map((c) => levels.filter((l) => l.chapter === c.id).length);
    expect(per).toEqual([5, 5, 6, 4, 4, 4, 6]);
  });

  it('uses all three mechanics', () => {
    const mechanics = new Set(levels.map((l) => l.mechanic));
    expect(mechanics).toEqual(new Set(['decode', 'build', 'debug']));
  });

  it('references only existing concepts and unlocks every concept', () => {
    const ids = new Set(concepts.map((c) => c.id));
    const used = new Set(levels.flatMap((l) => l.concepts));
    for (const c of used) expect(ids.has(c), c).toBe(true);
    for (const c of ids) expect(used.has(c), `concept ${c} never unlocked`).toBe(true);
  });

  it('every step has a well-formed task', () => {
    for (const l of levels) {
      expect(l.explanation.intuitive && l.explanation.scientific && l.explanation.math).toBeTruthy();
      for (const s of l.steps) {
        expect(s.hints).toHaveLength(2);
        if (s.kind === 'choice') expect(s.options.filter((o) => o.correct)).toHaveLength(1);
        if (s.kind === 'tap') {
          const ids = new Set([...s.diagram.nodes.map((n) => n.id), ...s.diagram.edges.map((e) => e.id)]);
          for (const t of s.targets) expect(ids.has(t), `${l.id}/${s.id}: ${t}`).toBe(true);
        }
      }
    }
  });
});

describe('build steps', () => {
  const builds = levels.flatMap((l) => l.steps.filter((s): s is BuildStep => s.kind === 'build').map((s) => ({ key: `${l.id}/${s.id}`, s })));

  it('every build step has a reference solution', () => {
    expect(builds.map((b) => b.key).sort()).toEqual(Object.keys(SOLUTIONS).sort());
  });

  for (const { key, s } of builds) {
    it(`${key}: starting diagram is not already solved`, () => {
      expect(validate(s.diagram, s.validation).ok).toBe(false);
    });
    it(`${key}: reference solution passes, on the level's own nodes`, () => {
      const sol = SOLUTIONS[key]();
      const nodeIds = new Set(s.diagram.nodes.map((n) => n.id));
      for (const e of sol.edges) {
        expect(nodeIds.has(e.from) && nodeIds.has(e.to)).toBe(true);
      }
      const candidate: Diagram = { nodes: s.diagram.nodes, edges: sol.edges };
      const r = validate(candidate, s.validation);
      expect(r.issues).toEqual([]);
    });
    it(`${key}: locked edges are compatible with the solution`, () => {
      const sol = SOLUTIONS[key]();
      for (const e of s.diagram.edges.filter((x) => x.locked !== false)) {
        expect(sol.edges.some((x) => x.type === e.type && x.from === e.from && x.to === e.to), e.id).toBe(true);
      }
    });
  }
});

describe('scientific claims made by the content', () => {
  it('L8: four-line vertex is invalid; broken Møller violates fermion flow', () => {
    expect(validate(fourLineVertex()).issues[0].code).toBe('VERTEX_DEGREE');
    expect(validate(brokenMoller()).issues[0].code).toBe('VERTEX_FERMION_FLOW');
  });
  it('L9: single-vertex processes are not kinematically realizable', () => {
    const l9 = levels[8];
    for (const s of l9.steps) if (s.kind === 'choice' && s.diagram) expect(validate(s.diagram, { kinematics: true }).issues[0].code).toBe('KINEMATICALLY_FORBIDDEN');
  });
  it('L17: redrawn diagram is the same topology; crossed one is not', () => {
    expect(sameTopology(mollerT(), mollerTRedrawn())).toBe(true);
    expect(sameTopology(mollerT(), mollerU())).toBe(false);
  });
  it('L20: counts of tree-level diagrams', () => {
    expect(enumerateTree2to2(PROCESSES.moller).map(channelOf).sort()).toEqual(['t', 'u']);
    expect(enumerateTree2to2(PROCESSES.bhabha).map(channelOf).sort()).toEqual(['s', 't']);
  });
  it('L21: broken Compton has issues at both vertices', () => {
    const r = validate(brokenCompton(), { kinematics: true });
    expect(r.ok).toBe(false);
    const codes = r.issues.map((i) => i.code);
    expect(codes).toContain('VERTEX_FERMION_FLOW');
    expect(codes).toContain('VERTEX_PHOTON_COUNT');
  });
  it('L23: A and B are valid Bhabha contributions, C is not', () => {
    expect(validate(bhabhaS(), { kinematics: true }).ok).toBe(true);
    expect(validate(bhabhaT(), { kinematics: true }).ok).toBe(true);
    const c = validate(bogusBhabhaU());
    expect(c.issues.map((i) => i.code)).toEqual(['VERTEX_FERMION_FLOW', 'VERTEX_FERMION_FLOW']);
  });

  const spec = (str: string) => {
    const [i, o] = str.split('>').map((x) => x.trim().split(/\s+/));
    return [
      ...i.map((sp, k) => ({ id: `in${k + 1}`, kind: 'in' as const, species: sp as 'e-' })),
      ...o.map((sp, k) => ({ id: `out${k + 1}`, kind: 'out' as const, species: sp as 'e-' })),
    ];
  };
  it('L25–28: higher-order tree diagrams and their counts', () => {
    expect(validate(bremsAfter(), { kinematics: true }).ok).toBe(true);
    expect(validate(bremsBefore(), { kinematics: true }).ok).toBe(true);
    expect(enumerateTrees(spec('e- e- > e- e- gamma'))).toHaveLength(8);
    expect(enumerateTrees(spec('e- e+ > gamma gamma gamma'))).toHaveLength(6);
    expect(sameTopology(threePhotons(), threePhotonsSwapped())).toBe(false);
  });
  it('L29–34: one-loop diagrams are valid and have exactly one loop', () => {
    for (const d of [vertexCorrection(), vacuumPolarization(), lightByLight(), mollerBox(), photonSelfEnergy()]) {
      expect(validate(d, { kinematics: true, loops: 1 }).issues).toEqual([]);
      expect(loopCount(d)).toBe(1);
    }
    expect(validate(schwinger(), { loops: 1 }).ok).toBe(true);
    expect(validate(vertexCorrection()).issues[0].code).toBe('LOOP');
  });
  it('L32: light-by-light has no tree diagram', () => {
    expect(enumerateTrees(spec('gamma gamma > gamma gamma'))).toHaveLength(0);
    expect(fermionLoops(lightByLight())).toHaveLength(1);
  });
  it("L33: odd photon loops are cancelled (Furry), even ones are not", () => {
    expect(validate(triangle(), { loops: 1 }).issues.map((i) => i.code)).toEqual(['FURRY']);
    expect(validate(triangle(true), { loops: 1 }).issues.map((i) => i.code)).toEqual(['FURRY']);
    expect(validate(photonSelfEnergy(), { loops: 1 }).ok).toBe(true);
  });
});
