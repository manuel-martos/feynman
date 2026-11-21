import { describe, expect, it } from 'vitest';
import { PROCESSES, channelOf, couplingOrder, edgeLabel, enumerateTree2to2, sameTopology, validate } from './index';
import type { Diagram } from './types';

const moller = (): Diagram => ({
  nodes: [
    { id: 'in1', kind: 'in', x: 0, y: 0 },
    { id: 'in2', kind: 'in', x: 0, y: 1 },
    { id: 'out1', kind: 'out', x: 1, y: 0 },
    { id: 'out2', kind: 'out', x: 1, y: 1 },
    { id: 'vA', kind: 'vertex', x: 0.5, y: 0 },
    { id: 'vB', kind: 'vertex', x: 0.5, y: 1 },
  ],
  edges: [
    { id: 'a', type: 'fermion', from: 'in1', to: 'vA' },
    { id: 'b', type: 'fermion', from: 'vA', to: 'out1' },
    { id: 'c', type: 'fermion', from: 'in2', to: 'vB' },
    { id: 'd', type: 'fermion', from: 'vB', to: 'out2' },
    { id: 'g', type: 'photon', from: 'vA', to: 'vB' },
  ],
});

describe('labels', () => {
  it('derives e⁻ / e⁺ from arrow direction and side', () => {
    const d = moller();
    expect(edgeLabel(d, d.edges[0])).toBe('e⁻');
    d.edges[0] = { id: 'a', type: 'fermion', from: 'vA', to: 'in1' };
    expect(edgeLabel(d, d.edges[0])).toBe('e⁺');
    expect(edgeLabel(d, d.edges[4])).toBe('γ*');
  });
});

describe('validate', () => {
  it('accepts tree-level Møller scattering', () => {
    expect(validate(moller(), { kinematics: true }).ok).toBe(true);
    expect(couplingOrder(moller())).toBe(2);
  });

  it('rejects a vertex without a photon', () => {
    const d = moller();
    d.edges[4] = { id: 'g', type: 'fermion', from: 'vA', to: 'vB' };
    const r = validate(d);
    expect(r.issues[0].code).toBe('VERTEX_PHOTON_COUNT');
  });

  it('rejects broken fermion flow (charge violation at vertex)', () => {
    const d = moller();
    d.edges[1] = { id: 'b', type: 'fermion', from: 'out1', to: 'vA' };
    expect(validate(d).issues[0].code).toBe('VERTEX_FERMION_FLOW');
  });

  it('rejects four lines at a vertex', () => {
    const d = moller();
    d.nodes.push({ id: 'out3', kind: 'out', x: 1, y: 2 });
    d.edges.push({ id: 'x', type: 'photon', from: 'vA', to: 'out3' });
    expect(validate(d).issues.map((i) => i.code)).toContain('VERTEX_DEGREE');
  });

  it('reports missing connections and unused vertices', () => {
    const d = moller();
    d.edges = d.edges.filter((e) => e.id !== 'g');
    const codes = validate(d).issues.map((i) => i.code);
    expect(codes).toContain('VERTEX_DEGREE');
    expect(codes).toContain('DISCONNECTED');
  });

  it('reports loops', () => {
    const d = moller();
    d.edges.push({ id: 'g2', type: 'photon', from: 'vA', to: 'vB' });
    expect(validate(d).issues.map((i) => i.code)).toContain('LOOP');
  });

  it('checks expected external species', () => {
    const d = moller();
    d.nodes[1].expect = 'e+';
    expect(validate(d).issues[0].code).toBe('EXTERNAL_MISMATCH');
  });

  it('flags single-vertex processes as kinematically forbidden', () => {
    const d: Diagram = {
      nodes: [
        { id: 'i', kind: 'in', x: 0, y: 0 },
        { id: 'o', kind: 'out', x: 1, y: 0 },
        { id: 'g', kind: 'out', x: 1, y: 1 },
        { id: 'v', kind: 'vertex', x: 0.5, y: 0.5 },
      ],
      edges: [
        { id: '1', type: 'fermion', from: 'i', to: 'v' },
        { id: '2', type: 'fermion', from: 'v', to: 'o' },
        { id: '3', type: 'photon', from: 'v', to: 'g' },
      ],
    };
    expect(validate(d).ok).toBe(true);
    expect(validate(d, { kinematics: true }).issues[0].code).toBe('KINEMATICALLY_FORBIDDEN');
  });
});

describe('topology', () => {
  it('ignores geometry', () => {
    const a = moller();
    const b = moller();
    b.nodes.forEach((n) => (n.x = n.x * 3 + 7));
    b.edges[4] = { ...b.edges[4], from: 'vB', to: 'vA', bend: 0.3 };
    expect(sameTopology(a, b)).toBe(true);
  });

  it('distinguishes t and u channels', () => {
    const t = moller();
    const u = moller();
    u.edges[1] = { id: 'b', type: 'fermion', from: 'vA', to: 'out2' };
    u.edges[3] = { id: 'd', type: 'fermion', from: 'vB', to: 'out1' };
    expect(channelOf(t)).toBe('t');
    expect(channelOf(u)).toBe('u');
    expect(sameTopology(t, u)).toBe(false);
  });
});

describe('enumerator', () => {
  const channels = (p: keyof typeof PROCESSES) => enumerateTree2to2(PROCESSES[p]).map(channelOf).sort();
  it('Møller: t and u', () => expect(channels('moller')).toEqual(['t', 'u']));
  it('Bhabha: s and t', () => expect(channels('bhabha')).toEqual(['s', 't']));
  it('Annihilation: t and u', () => expect(channels('annihilation')).toEqual(['t', 'u']));
  it('Compton: s and u', () => expect(channels('compton')).toEqual(['s', 'u']));
  it('Pair production: t and u', () => expect(channels('pairProduction')).toEqual(['t', 'u']));
});

import { enumerateTrees, fermionLoops, loopCount, loopEdges, timeline } from './index';
import type { ExternalSpec } from './enumerate';

const ext = (spec: string): ExternalSpec[] => {
  // "e- e- > e- e- gamma"
  const [i, o] = spec.split('>').map((s) => s.trim().split(/\s+/));
  return [
    ...i.map((s, k) => ({ id: `in${k + 1}`, kind: 'in' as const, species: s as ExternalSpec['species'] })),
    ...o.map((s, k) => ({ id: `out${k + 1}`, kind: 'out' as const, species: s as ExternalSpec['species'] })),
  ];
};

describe('enumerateTrees', () => {
  it('reproduces the 2 → 2 counts', () => {
    expect(enumerateTrees(ext('e- e- > e- e-'))).toHaveLength(2);
    expect(enumerateTrees(ext('e- e+ > e- e+'))).toHaveLength(2);
    expect(enumerateTrees(ext('e- gamma > e- gamma'))).toHaveLength(2);
  });
  it('counts higher-order trees', () => {
    expect(enumerateTrees(ext('e- e- > e- e- gamma'))).toHaveLength(8);
    expect(enumerateTrees(ext('e- e+ > gamma gamma gamma'))).toHaveLength(6);
    expect(enumerateTrees(ext('gamma gamma > gamma gamma'))).toHaveLength(0);
  });
});

const box = (): Diagram => ({
  nodes: [
    { id: 'in1', kind: 'in', x: 0, y: 0 },
    { id: 'in2', kind: 'in', x: 0, y: 1 },
    { id: 'out1', kind: 'out', x: 1, y: 0 },
    { id: 'out2', kind: 'out', x: 1, y: 1 },
    { id: 'a', kind: 'vertex', x: 0.3, y: 0 },
    { id: 'b', kind: 'vertex', x: 0.7, y: 0 },
    { id: 'c', kind: 'vertex', x: 0.7, y: 1 },
    { id: 'd', kind: 'vertex', x: 0.3, y: 1 },
  ],
  edges: [
    { id: 'g1', type: 'photon', from: 'in1', to: 'a' },
    { id: 'g2', type: 'photon', from: 'in2', to: 'd' },
    { id: 'g3', type: 'photon', from: 'out1', to: 'b' },
    { id: 'g4', type: 'photon', from: 'out2', to: 'c' },
    { id: 'ab', type: 'fermion', from: 'a', to: 'b' },
    { id: 'bc', type: 'fermion', from: 'b', to: 'c' },
    { id: 'cd', type: 'fermion', from: 'c', to: 'd' },
    { id: 'da', type: 'fermion', from: 'd', to: 'a' },
  ],
});

describe('loops', () => {
  it('rejects loops at tree level and accepts them when allowed', () => {
    expect(validate(box()).issues[0].code).toBe('LOOP');
    expect(validate(box(), { loops: 1, kinematics: true }).ok).toBe(true);
    expect(loopCount(box())).toBe(1);
    expect(loopEdges(box()).sort()).toEqual(['ab', 'bc', 'cd', 'da']);
    expect(fermionLoops(box())[0].sort()).toEqual(['a', 'b', 'c', 'd']);
  });
  it("applies Furry's theorem to odd photon loops", () => {
    const tri: Diagram = {
      nodes: [
        { id: 'in1', kind: 'in', x: 0, y: 0 },
        { id: 'out1', kind: 'out', x: 1, y: 0 },
        { id: 'out2', kind: 'out', x: 1, y: 1 },
        { id: 'a', kind: 'vertex', x: 0.3, y: 0.5 },
        { id: 'b', kind: 'vertex', x: 0.7, y: 0 },
        { id: 'c', kind: 'vertex', x: 0.7, y: 1 },
      ],
      edges: [
        { id: 'g1', type: 'photon', from: 'in1', to: 'a' },
        { id: 'g2', type: 'photon', from: 'out1', to: 'b' },
        { id: 'g3', type: 'photon', from: 'out2', to: 'c' },
        { id: 'ab', type: 'fermion', from: 'a', to: 'b' },
        { id: 'bc', type: 'fermion', from: 'b', to: 'c' },
        { id: 'ca', type: 'fermion', from: 'c', to: 'a' },
      ],
    };
    expect(validate(tri, { loops: 1 }).issues.map((i) => i.code)).toEqual(['FURRY']);
  });
});

describe('timeline', () => {
  it('reads Møller as a story in time', () => {
    const t = timeline(moller());
    expect(t.events.map((e) => e.vertex)).toEqual(['vA', 'vB']);
    expect(t.events[0].ins.map((x) => x.species)).toEqual(['e-']);
    expect(t.events[0].outs.map((x) => x.species).sort()).toEqual(['e-', 'gamma']);
  });
  it('sees a backwards arrow as a positron moving forward', () => {
    const d = moller();
    d.edges[0] = { id: 'a', type: 'fermion', from: 'vA', to: 'in1' };
    const t = timeline(d);
    expect(t.traversals.find((x) => x.edge.id === 'a')?.species).toBe('e+');
  });
});
