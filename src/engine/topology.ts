import { edgeRole, isExternal, nodeMap, otherEnd } from './graph';
import type { Channel, Diagram, DiagramEdge } from './types';

/**
 * Leaf ids reachable from `start` without crossing `cut`.
 */
function leavesOnSide(d: Diagram, start: string, cut: DiagramEdge): string[] {
  const nodes = nodeMap(d);
  const seen = new Set<string>([start]);
  const stack = [start];
  const leaves: string[] = [];
  while (stack.length) {
    const id = stack.pop()!;
    const n = nodes.get(id);
    if (n && isExternal(n)) leaves.push(id);
    for (const e of d.edges) {
      if (e === cut) continue;
      if (e.from !== id && e.to !== id) continue;
      const nxt = otherEnd(e, id);
      if (!seen.has(nxt)) {
        seen.add(nxt);
        stack.push(nxt);
      }
    }
  }
  return leaves.sort();
}

/**
 * Canonical, drawing-independent signature of a tree diagram.
 *
 * A tree with labelled leaves is fully determined by the set of leaf
 * bipartitions ("splits") induced by its internal edges, together with the
 * type of each internal line. Positions, curvature and orientation on screen
 * are irrelevant: two drawings with the same signature are the same diagram.
 */
export function topologySignature(d: Diagram): string {
  const allLeaves = d.nodes.filter(isExternal).map((n) => n.id).sort();
  const first = allLeaves[0];
  const splits: string[] = [];
  for (const e of d.edges) {
    if (edgeRole(d, e) !== 'internal') continue;
    let side = leavesOnSide(d, e.from, e);
    if (first && !side.includes(first)) side = allLeaves.filter((l) => !side.includes(l));
    splits.push(`${e.type}:{${side.join(',')}}`);
  }
  // Attachments of leaves to a vertex shared with other leaves only matter
  // through splits; for a single vertex the signature is just the leaf set.
  return `[${allLeaves.join(',')}]|${splits.sort().join('|')}`;
}

export function sameTopology(a: Diagram, b: Diagram): boolean {
  return topologySignature(a) === topologySignature(b);
}

/**
 * Mandelstam channel of a 2 → 2 tree diagram with a single internal line.
 * The first initial-state leg (by id) is paired with:
 *   - the other initial leg  → s-channel (annihilation / fusion)
 *   - the first final leg    → t-channel
 *   - the second final leg   → u-channel (crossed)
 */
export function channelOf(d: Diagram): Channel | null {
  const ins = d.nodes.filter((n) => n.kind === 'in').map((n) => n.id).sort();
  const outs = d.nodes.filter((n) => n.kind === 'out').map((n) => n.id).sort();
  if (ins.length !== 2 || outs.length !== 2) return null;
  const internal = d.edges.filter((e) => edgeRole(d, e) === 'internal');
  if (internal.length !== 1) return null;
  const side = leavesOnSide(d, internal[0].from, internal[0]);
  const withFirst = side.includes(ins[0]) ? side : [...ins, ...outs].filter((l) => !side.includes(l));
  if (withFirst.length !== 2) return null;
  const partner = withFirst.find((l) => l !== ins[0]);
  if (partner === ins[1]) return 's';
  if (partner === outs[0]) return 't';
  if (partner === outs[1]) return 'u';
  return null;
}

/** Perturbative order: each QED vertex contributes one power of e. */
export function couplingOrder(d: Diagram): number {
  return d.nodes.filter((n) => n.kind === 'vertex').length;
}

/** Edges that lie on a closed loop (removing them keeps the graph connected). */
export function loopEdges(d: Diagram): string[] {
  return d.edges
    .filter((cut) => {
      if (cut.from === cut.to) return true;
      const seen = new Set([cut.from]);
      const stack = [cut.from];
      while (stack.length) {
        const id = stack.pop()!;
        for (const e of d.edges) {
          if (e === cut || (e.from !== id && e.to !== id)) continue;
          const nxt = otherEnd(e, id);
          if (!seen.has(nxt)) {
            seen.add(nxt);
            stack.push(nxt);
          }
        }
      }
      return seen.has(cut.to);
    })
    .map((e) => e.id);
}

/** Number of independent loops: E − N + (connected components). */
export function loopCount(d: Diagram): number {
  const used = new Set(d.edges.flatMap((e) => [e.from, e.to]));
  const parent = new Map<string, string>();
  const find = (x: string): string => (parent.get(x) ?? x) === x ? x : find(parent.get(x)!);
  let components = used.size;
  for (const e of d.edges) {
    const a = find(e.from);
    const b = find(e.to);
    if (a !== b) {
      parent.set(a, b);
      components--;
    }
  }
  return d.edges.length - used.size + components;
}
