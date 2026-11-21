import { edgeRole, isExternal, nodeMap } from './graph';
import type { Diagram, DiagramEdge, Species } from './types';

export interface Traversal {
  edge: DiagramEdge;
  /** Node where the particle starts (earlier in time) and where it ends. */
  start: string;
  end: string;
  /** Species as seen moving forward in time along this line. */
  species: Species;
  virtual: boolean;
}

export interface VertexEvent {
  vertex: string;
  /** Lines arriving from the past and leaving towards the future. */
  ins: Traversal[];
  outs: Traversal[];
}

export interface Timeline {
  /** Rank in time of every node: incoming 0, vertices 1..n, outgoing n+1. */
  rank: Map<string, number>;
  steps: number;
  traversals: Traversal[];
  events: VertexEvent[];
}

/**
 * Reads a diagram as a story in time (left → right). Vertices are ordered by
 * their horizontal position (ties broken top to bottom). Every line is then
 * travelled from its earlier to its later end; a fermion line whose arrow
 * points backwards in time is seen as a positron.
 */
export function timeline(d: Diagram): Timeline {
  const nodes = nodeMap(d);
  const vertices = d.nodes.filter((n) => n.kind === 'vertex').sort((a, b) => a.x - b.x || a.y - b.y);
  const rank = new Map<string, number>();
  for (const n of d.nodes) if (n.kind === 'in') rank.set(n.id, 0);
  vertices.forEach((v, i) => rank.set(v.id, i + 1));
  for (const n of d.nodes) if (n.kind === 'out') rank.set(n.id, vertices.length + 1);

  const traversals: Traversal[] = [];
  for (const e of d.edges) {
    const a = nodes.get(e.from);
    const b = nodes.get(e.to);
    if (!a || !b || a === b) continue;
    const forward = rank.get(a.id)! <= rank.get(b.id)!;
    const [start, end] = forward ? [a.id, b.id] : [b.id, a.id];
    const species: Species = e.type === 'photon' ? 'gamma' : e.from === start ? 'e-' : 'e+';
    traversals.push({ edge: e, start, end, species, virtual: edgeRole(d, e) === 'internal' && !isExternal(a) && !isExternal(b) });
  }
  const events = vertices.map((v) => ({
    vertex: v.id,
    ins: traversals.filter((t) => t.end === v.id),
    outs: traversals.filter((t) => t.start === v.id),
  }));
  return { rank, steps: vertices.length + 1, traversals, events };
}
