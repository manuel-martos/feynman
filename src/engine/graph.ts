import type { Diagram, DiagramEdge, DiagramNode, Species } from './types';

export const isExternal = (n: DiagramNode) => n.kind !== 'vertex';

export function nodeMap(d: Diagram): Map<string, DiagramNode> {
  return new Map(d.nodes.map((n) => [n.id, n]));
}

export function incidentEdges(d: Diagram, nodeId: string): DiagramEdge[] {
  return d.edges.filter((e) => e.from === nodeId || e.to === nodeId);
}

export function degree(d: Diagram, nodeId: string): number {
  // A self loop counts twice, as in graph theory.
  return d.edges.reduce((acc, e) => acc + (e.from === nodeId ? 1 : 0) + (e.to === nodeId ? 1 : 0), 0);
}

export function otherEnd(e: DiagramEdge, nodeId: string): string {
  return e.from === nodeId ? e.to : e.from;
}

/**
 * Species carried by an edge attached to an external node, derived from the
 * arrow direction and the side of the diagram (initial / final state).
 */
export function externalSpecies(d: Diagram, edge: DiagramEdge): Species | null {
  if (edge.type === 'photon') return 'gamma';
  const nodes = nodeMap(d);
  const a = nodes.get(edge.from);
  const b = nodes.get(edge.to);
  const ext = a && isExternal(a) ? a : b && isExternal(b) ? b : undefined;
  if (!ext) return null;
  const arrowIntoDiagram = edge.from === ext.id;
  if (ext.kind === 'in') return arrowIntoDiagram ? 'e-' : 'e+';
  return arrowIntoDiagram ? 'e+' : 'e-';
}

export type EdgeRole = 'external' | 'internal';

export function edgeRole(d: Diagram, edge: DiagramEdge): EdgeRole {
  const nodes = nodeMap(d);
  const a = nodes.get(edge.from);
  const b = nodes.get(edge.to);
  return (a && isExternal(a)) || (b && isExternal(b)) ? 'external' : 'internal';
}

/** Display label for an edge: e⁻, e⁺, γ, or the virtual internal lines. */
export function edgeLabel(d: Diagram, edge: DiagramEdge): string {
  if (edge.labelOverride) return edge.labelOverride;
  if (edgeRole(d, edge) === 'internal') return edge.type === 'photon' ? 'γ*' : 'e*';
  const s = externalSpecies(d, edge);
  return s ? SPECIES_SYMBOL[s] : '';
}

export const SPECIES_SYMBOL: Record<Species, string> = { 'e-': 'e⁻', 'e+': 'e⁺', gamma: 'γ' };

export const SPECIES_CHARGE: Record<Species, number> = { 'e-': -1, 'e+': 1, gamma: 0 };

/** The edge attached to an external node, if exactly one. */
export function externalEdge(d: Diagram, nodeId: string): DiagramEdge | undefined {
  const inc = incidentEdges(d, nodeId);
  return inc.length === 1 ? inc[0] : undefined;
}

/** Union–find helper used for connectivity and cycle detection. */
export class DisjointSet {
  private parent = new Map<string, string>();
  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let p = this.parent.get(x)!;
    if (p !== x) {
      p = this.find(p);
      this.parent.set(x, p);
    }
    return p;
  }
  /** Returns false if x and y were already connected. */
  union(x: string, y: string): boolean {
    const rx = this.find(x);
    const ry = this.find(y);
    if (rx === ry) return false;
    this.parent.set(rx, ry);
    return true;
  }
}

let counter = 0;
export const newId = (prefix = 'e') => `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;

export function cloneDiagram(d: Diagram): Diagram {
  return { nodes: d.nodes.map((n) => ({ ...n })), edges: d.edges.map((e) => ({ ...e })) };
}
