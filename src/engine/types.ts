/**
 * Diagram Engine — typed graph model for tree-level QED Feynman diagrams.
 *
 * Conventions
 * - Time flows from left (initial state) to right (final state).
 * - Fermion edges are directed: `from → to` is the direction of the arrow
 *   (fermion-number flow). An electron has its arrow along time, a positron
 *   against time.
 * - Photon edges are undirected; `from`/`to` order carries no meaning.
 * - Geometry (x, y) is purely presentational and never affects validation.
 */

export type EdgeType = 'fermion' | 'photon';

/** Physical identity of an external leg. */
export type Species = 'e-' | 'e+' | 'gamma';

export type NodeKind = 'in' | 'out' | 'vertex';

export interface DiagramNode {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  /** For external nodes in Build levels: which particle must end here. */
  expect?: Species;
  /** Optional short tag shown next to an external node (e.g. "1", "2"). */
  tag?: string;
}

export interface DiagramEdge {
  id: string;
  type: EdgeType;
  from: string;
  to: string;
  /** Locked edges are part of the puzzle and cannot be edited. */
  locked?: boolean;
  /** Presentation: curvature as a fraction of the edge length (+/-). */
  bend?: number;
  /** Presentation override of the label (used by Debug levels on purpose). */
  labelOverride?: string;
}

export interface Diagram {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export type ValidationLayer = 'structural' | 'theory' | 'physical' | 'goal';

export type IssueCode =
  | 'EXTERNAL_UNCONNECTED'
  | 'EXTERNAL_OVERCONNECTED'
  | 'EXTERNAL_TO_EXTERNAL'
  | 'SELF_LOOP'
  | 'VERTEX_UNUSED'
  | 'VERTEX_DEGREE'
  | 'VERTEX_PHOTON_COUNT'
  | 'VERTEX_FERMION_FLOW'
  | 'DISCONNECTED'
  | 'LOOP'
  | 'FURRY'
  | 'EXTERNAL_MISMATCH'
  | 'CHARGE_NOT_CONSERVED'
  | 'KINEMATICALLY_FORBIDDEN'
  | 'WRONG_CHANNEL'
  | 'SAME_AS_REFERENCE';

export interface Issue {
  code: IssueCode;
  layer: ValidationLayer;
  /** Ids of nodes and/or edges involved, to be highlighted by the UI. */
  elements: string[];
  /** Extra data for message interpolation. */
  data?: Record<string, string | number>;
}

export type Channel = 's' | 't' | 'u';
