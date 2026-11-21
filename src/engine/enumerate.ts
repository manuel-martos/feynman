import { channelOf } from './topology';
import type { Channel, Diagram, DiagramEdge, DiagramNode, Species } from './types';
import { validate } from './validate';

export interface ExternalSpec {
  id: string;
  kind: 'in' | 'out';
  species: Species;
}

/** Does the arrow of this external leg point into the vertex it attaches to? */
function arrowIntoVertex(ext: ExternalSpec): boolean | null {
  if (ext.species === 'gamma') return null;
  if (ext.kind === 'in') return ext.species === 'e-';
  return ext.species === 'e+';
}

function legEdge(ext: ExternalSpec, vertex: string): DiagramEdge {
  const id = `${ext.id}-${vertex}`;
  if (ext.species === 'gamma') return { id, type: 'photon', from: ext.id, to: vertex };
  return arrowIntoVertex(ext)
    ? { id, type: 'fermion', from: ext.id, to: vertex }
    : { id, type: 'fermion', from: vertex, to: ext.id };
}

/**
 * Third line needed at a vertex that already holds two legs, so that the
 * vertex satisfies the QED rule (1 arrow in, 1 arrow out, 1 photon).
 */
function missingLine(legs: ExternalSpec[]): { type: 'photon' } | { type: 'fermion'; into: boolean } | null {
  let photons = 0;
  let ins = 0;
  let outs = 0;
  for (const l of legs) {
    const into = arrowIntoVertex(l);
    if (into === null) photons++;
    else if (into) ins++;
    else outs++;
  }
  if (photons === 0 && ins === 1 && outs === 1) return { type: 'photon' };
  if (photons === 1 && ins === 1 && outs === 0) return { type: 'fermion', into: false };
  if (photons === 1 && ins === 0 && outs === 1) return { type: 'fermion', into: true };
  return null;
}

const EXT_POS = { in: [{ x: 8, y: 12 }, { x: 8, y: 60 }], out: [{ x: 92, y: 12 }, { x: 92, y: 60 }] };
const VERTEX_POS: Record<Channel, [{ x: number; y: number }, { x: number; y: number }]> = {
  t: [{ x: 50, y: 22 }, { x: 50, y: 50 }],
  s: [{ x: 32, y: 36 }, { x: 68, y: 36 }],
  u: [{ x: 50, y: 24 }, { x: 50, y: 48 }],
};

/**
 * Enumerates every tree-level QED diagram of a 2 → 2 process built from
 * electrons, positrons and photons, laid out with conventional geometry.
 */
export function enumerateTree2to2(externals: ExternalSpec[]): Diagram[] {
  const ins = externals.filter((e) => e.kind === 'in').sort((a, b) => a.id.localeCompare(b.id));
  const outs = externals.filter((e) => e.kind === 'out').sort((a, b) => a.id.localeCompare(b.id));
  if (ins.length !== 2 || outs.length !== 2) throw new Error('enumerateTree2to2 expects 2 → 2');
  const [a, ...rest] = [...ins, ...outs];
  const result: Diagram[] = [];

  for (const partner of rest) {
    const groupA = [a, partner];
    const groupB = rest.filter((r) => r !== partner);
    const lineA = missingLine(groupA);
    const lineB = missingLine(groupB);
    if (!lineA || !lineB || lineA.type !== lineB.type) continue;
    if (lineA.type === 'fermion' && lineB.type === 'fermion' && lineA.into === lineB.into) continue;

    const nodes: DiagramNode[] = [
      ...ins.map((e, i) => ({ id: e.id, kind: 'in' as const, ...EXT_POS.in[i], expect: e.species })),
      ...outs.map((e, i) => ({ id: e.id, kind: 'out' as const, ...EXT_POS.out[i], expect: e.species })),
    ];
    const edges: DiagramEdge[] = [...groupA.map((g) => legEdge(g, 'vA')), ...groupB.map((g) => legEdge(g, 'vB'))];
    if (lineA.type === 'photon') edges.push({ id: 'int', type: 'photon', from: 'vA', to: 'vB' });
    else edges.push(lineA.into ? { id: 'int', type: 'fermion', from: 'vB', to: 'vA' } : { id: 'int', type: 'fermion', from: 'vA', to: 'vB' });

    const draft: Diagram = { nodes: [...nodes, { id: 'vA', kind: 'vertex', x: 0, y: 0 }, { id: 'vB', kind: 'vertex', x: 0, y: 0 }], edges };
    const ch = channelOf(draft)!;
    const [pa, pb] = VERTEX_POS[ch];
    draft.nodes = [...nodes, { id: 'vA', kind: 'vertex', ...pa }, { id: 'vB', kind: 'vertex', ...pb }];
    if (validate(draft, { kinematics: true }).ok) result.push(draft);
  }
  return result;
}

export const PROCESSES: Record<string, ExternalSpec[]> = {
  moller: [
    { id: 'in1', kind: 'in', species: 'e-' },
    { id: 'in2', kind: 'in', species: 'e-' },
    { id: 'out1', kind: 'out', species: 'e-' },
    { id: 'out2', kind: 'out', species: 'e-' },
  ],
  bhabha: [
    { id: 'in1', kind: 'in', species: 'e-' },
    { id: 'in2', kind: 'in', species: 'e+' },
    { id: 'out1', kind: 'out', species: 'e-' },
    { id: 'out2', kind: 'out', species: 'e+' },
  ],
  annihilation: [
    { id: 'in1', kind: 'in', species: 'e-' },
    { id: 'in2', kind: 'in', species: 'e+' },
    { id: 'out1', kind: 'out', species: 'gamma' },
    { id: 'out2', kind: 'out', species: 'gamma' },
  ],
  compton: [
    { id: 'in1', kind: 'in', species: 'e-' },
    { id: 'in2', kind: 'in', species: 'gamma' },
    { id: 'out1', kind: 'out', species: 'e-' },
    { id: 'out2', kind: 'out', species: 'gamma' },
  ],
  pairProduction: [
    { id: 'in1', kind: 'in', species: 'gamma' },
    { id: 'in2', kind: 'in', species: 'gamma' },
    { id: 'out1', kind: 'out', species: 'e-' },
    { id: 'out2', kind: 'out', species: 'e+' },
  ],
  positronScattering: [
    { id: 'in1', kind: 'in', species: 'e+' },
    { id: 'in2', kind: 'in', species: 'e+' },
    { id: 'out1', kind: 'out', species: 'e+' },
    { id: 'out2', kind: 'out', species: 'e+' },
  ],
};
