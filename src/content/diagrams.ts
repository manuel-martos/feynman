/**
 * Language-independent diagram fixtures shared by levels and the collection.
 * Edge ids: external legs take the id of their external node; the internal
 * line is "int". Vertices are "vA" / "vB".
 */
import { PROCESSES, channelOf, enumerateTree2to2, type Channel, type Diagram, type DiagramEdge, type DiagramNode, type Species } from '../engine';

export type ProcessName = keyof typeof PROCESSES;

export function process(name: ProcessName, channel: Channel): Diagram {
  const found = enumerateTree2to2(PROCESSES[name]).find((d) => channelOf(d) === channel);
  if (!found) throw new Error(`No ${channel}-channel diagram for ${name}`);
  return {
    nodes: found.nodes.map((n) => ({ ...n })),
    edges: found.edges.map((e) => {
      const ext = [e.from, e.to].find((x) => x !== 'vA' && x !== 'vB');
      return { ...e, id: ext ?? 'int', locked: true };
    }),
  };
}

/** Keep only the listed edges (locked); the rest must be built by the player. */
export function puzzle(d: Diagram, keep: string[]): Diagram {
  return { nodes: d.nodes.map((n) => ({ ...n })), edges: d.edges.filter((e) => keep.includes(e.id)).map((e) => ({ ...e, locked: true })) };
}

/** Remove the "expect" goals (for read-only diagrams). */
export function plain(d: Diagram): Diagram {
  return { nodes: d.nodes.map(({ expect: _e, ...n }) => n), edges: d.edges.map((e) => ({ ...e })) };
}

export function withTags(d: Diagram, tags: Record<string, string>): Diagram {
  return { ...d, nodes: d.nodes.map((n) => (tags[n.id] ? { ...n, tag: tags[n.id] } : n)) };
}

export function move(d: Diagram, pos: Record<string, [number, number]>): Diagram {
  return { ...d, nodes: d.nodes.map((n) => (pos[n.id] ? { ...n, x: pos[n.id][0], y: pos[n.id][1] } : n)) };
}

export function patchEdges(d: Diagram, patch: Record<string, Partial<DiagramEdge>>): Diagram {
  return { ...d, edges: d.edges.map((e) => (patch[e.id] ? { ...e, ...patch[e.id] } : e)) };
}

export interface Leg {
  id: string;
  kind: 'in' | 'out';
  species: Species;
  x: number;
  y: number;
}

/**
 * A single QED vertex with three legs, drawn with the correct arrows.
 * Used for "building block" levels.
 */
export function vertex(legs: Leg[], at: [number, number] = [50, 36]): Diagram {
  const nodes: DiagramNode[] = [
    ...legs.map((l) => ({ id: l.id, kind: l.kind, x: l.x, y: l.y, expect: l.species })),
    { id: 'v', kind: 'vertex', x: at[0], y: at[1] },
  ];
  const edges: DiagramEdge[] = legs.map((l) => {
    if (l.species === 'gamma') return { id: l.id, type: 'photon', from: l.id, to: 'v', locked: true };
    const into = l.kind === 'in' ? l.species === 'e-' : l.species === 'e+';
    return into
      ? { id: l.id, type: 'fermion', from: l.id, to: 'v', locked: true }
      : { id: l.id, type: 'fermion', from: 'v', to: l.id, locked: true };
  });
  return { nodes, edges };
}

/** Electron emitting a photon: e⁻ → e⁻ γ (building block). */
export const emission = () =>
  vertex([
    { id: 'in1', kind: 'in', species: 'e-', x: 10, y: 50 },
    { id: 'out1', kind: 'out', species: 'e-', x: 90, y: 50 },
    { id: 'g', kind: 'out', species: 'gamma', x: 82, y: 12 },
  ], [48, 50]);
