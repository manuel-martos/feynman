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
