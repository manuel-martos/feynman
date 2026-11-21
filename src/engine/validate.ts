import {
  DisjointSet,
  SPECIES_CHARGE,
  degree,
  edgeRole,
  externalEdge,
  externalSpecies,
  incidentEdges,
  isExternal,
  nodeMap,
} from './graph';
import { channelOf, sameTopology } from './topology';
import type { Channel, Diagram, Issue, Species } from './types';

export interface ValidationOptions {
  /**
   * Treat the diagram as a complete physical process with real (on-shell)
   * external particles and check kinematic feasibility. Disable it for
   * "building block" fragments such as an isolated vertex.
   */
  kinematics?: boolean;
  /** Require a specific Mandelstam channel (2 → 2 only). */
  channel?: Channel;
  /** Require a contribution topologically different from these diagrams. */
  differentFrom?: Diagram[];
}

export interface ValidationResult {
  ok: boolean;
  /** Ordered by priority: structural → theory → goal → physical. */
  issues: Issue[];
}

/**
 * Deterministic validator, organised in the three layers of the design:
 * structural, theoretical (QED vertex rules) and physical (kinematics),
 * plus level-specific goals.
 */
export function validate(d: Diagram, opts: ValidationOptions = {}): ValidationResult {
  const structural = structuralIssues(d);
  const theory = theoryIssues(d);
  const issues: Issue[] = [...structural, ...theory];

  if (issues.length === 0) issues.push(...goalIssues(d, opts));
  if (issues.length === 0) issues.push(...physicalIssues(d, opts));

  return { ok: issues.length === 0, issues };
}

export function structuralIssues(d: Diagram): Issue[] {
  const issues: Issue[] = [];
  const nodes = nodeMap(d);

  for (const e of d.edges) {
    if (e.from === e.to) issues.push({ code: 'SELF_LOOP', layer: 'structural', elements: [e.id, e.from] });
    const a = nodes.get(e.from);
    const b = nodes.get(e.to);
    if (a && b && isExternal(a) && isExternal(b)) {
      issues.push({ code: 'EXTERNAL_TO_EXTERNAL', layer: 'structural', elements: [e.id, a.id, b.id] });
    }
  }

  for (const n of d.nodes) {
    const deg = degree(d, n.id);
    const inc = incidentEdges(d, n.id).map((e) => e.id);
    if (isExternal(n)) {
      if (deg === 0) issues.push({ code: 'EXTERNAL_UNCONNECTED', layer: 'structural', elements: [n.id] });
      else if (deg > 1) issues.push({ code: 'EXTERNAL_OVERCONNECTED', layer: 'structural', elements: [n.id, ...inc] });
    } else if (deg === 0) {
      issues.push({ code: 'VERTEX_UNUSED', layer: 'structural', elements: [n.id] });
    } else if (deg !== 3) {
      issues.push({ code: 'VERTEX_DEGREE', layer: 'structural', elements: [n.id, ...inc], data: { degree: deg } });
    }
  }

  // Connectivity and loops (only meaningful once every node is used).
  const ds = new DisjointSet();
  d.nodes.forEach((n) => ds.find(n.id));
  const cycleEdges: string[] = [];
  for (const e of d.edges) {
    if (e.from === e.to) continue;
    if (!ds.union(e.from, e.to)) cycleEdges.push(e.id);
  }
  const used = d.nodes.filter((n) => degree(d, n.id) > 0);
  const groups = new Map<string, string[]>();
  for (const n of used) {
    const r = ds.find(n.id);
    groups.set(r, [...(groups.get(r) ?? []), n.id]);
  }
  if (groups.size > 1) {
    const sorted = [...groups.values()].sort((a, b) => b.length - a.length);
    const detached = sorted.slice(1).flat();
    const edgeIds = d.edges.filter((e) => detached.includes(e.from)).map((e) => e.id);
    issues.push({ code: 'DISCONNECTED', layer: 'structural', elements: [...detached, ...edgeIds] });
  }
  if (cycleEdges.length) issues.push({ code: 'LOOP', layer: 'structural', elements: cycleEdges });

  return issues;
}

/** QED: every vertex joins one incoming arrow, one outgoing arrow and one photon. */
export function theoryIssues(d: Diagram): Issue[] {
  const issues: Issue[] = [];
  for (const v of d.nodes) {
    if (v.kind !== 'vertex') continue;
    const inc = incidentEdges(d, v.id).filter((e) => e.from !== e.to);
    if (inc.length !== 3) continue; // reported structurally
    const photons = inc.filter((e) => e.type === 'photon');
    const ids = [v.id, ...inc.map((e) => e.id)];
    if (photons.length !== 1) {
      issues.push({ code: 'VERTEX_PHOTON_COUNT', layer: 'theory', elements: ids, data: { photons: photons.length } });
      continue;
    }
    const fermions = inc.filter((e) => e.type === 'fermion');
    const arrowsIn = fermions.filter((e) => e.to === v.id).length;
    if (arrowsIn !== 1) {
      issues.push({
        code: 'VERTEX_FERMION_FLOW',
        layer: 'theory',
        elements: [v.id, ...fermions.map((e) => e.id)],
        data: { arrowsIn },
      });
    }
  }
  return issues;
}

export function goalIssues(d: Diagram, opts: ValidationOptions): Issue[] {
  const issues: Issue[] = [];
  for (const n of d.nodes) {
    if (!isExternal(n) || !n.expect) continue;
    const e = externalEdge(d, n.id);
    if (!e) continue;
    const got = externalSpecies(d, e);
    if (got !== n.expect) {
      issues.push({
        code: 'EXTERNAL_MISMATCH',
        layer: 'goal',
        elements: [n.id, e.id],
        data: { expected: n.expect, got: got ?? '?' },
      });
    }
  }
  if (issues.length) return issues;

  if (opts.channel) {
    const ch = channelOf(d);
    if (ch !== opts.channel) {
      const internal = d.edges.filter((e) => edgeRole(d, e) === 'internal').map((e) => e.id);
      issues.push({ code: 'WRONG_CHANNEL', layer: 'goal', elements: internal, data: { expected: opts.channel, got: ch ?? '?' } });
    }
  }
  if (opts.differentFrom?.some((ref) => sameTopology(ref, d))) {
    issues.push({ code: 'SAME_AS_REFERENCE', layer: 'goal', elements: d.edges.map((e) => e.id) });
  }
  return issues;
}

export function chargeBalance(d: Diagram): { initial: number; final: number } {
  let initial = 0;
  let final = 0;
  for (const n of d.nodes) {
    if (!isExternal(n)) continue;
    const e = externalEdge(d, n.id);
    const s: Species | null = e ? externalSpecies(d, e) : null;
    if (!s) continue;
    if (n.kind === 'in') initial += SPECIES_CHARGE[s];
    else final += SPECIES_CHARGE[s];
  }
  return { initial, final };
}

export function physicalIssues(d: Diagram, opts: ValidationOptions): Issue[] {
  const issues: Issue[] = [];
  const { initial, final } = chargeBalance(d);
  if (initial !== final) {
    issues.push({ code: 'CHARGE_NOT_CONSERVED', layer: 'physical', elements: [], data: { initial, final } });
  }
  if (opts.kinematics) {
    const vertices = d.nodes.filter((n) => n.kind === 'vertex');
    const externals = d.nodes.filter(isExternal);
    // Every 3-point QED process with free, real particles (e → eγ, γ → e⁺e⁻,
    // e⁺e⁻ → γ) violates energy–momentum conservation.
    if (vertices.length === 1 && externals.length === 3) {
      issues.push({ code: 'KINEMATICALLY_FORBIDDEN', layer: 'physical', elements: [vertices[0].id] });
    }
  }
  return issues;
}
