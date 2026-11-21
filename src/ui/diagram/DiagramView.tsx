import { forwardRef, useId, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { SPECIES_SYMBOL, edgeLabel, edgeRole, nodeMap, type Diagram, type DiagramEdge, type DiagramNode } from '../../engine';
import { arrowHead, labelPoint, straightOrCurvedPath, wavyPath } from './geometry';
import './diagram.css';

export const VIEW_W = 100;
export const VIEW_H = 72;

export type Tappable = 'none' | 'edges' | 'nodes' | 'all';

export interface DiagramViewProps {
  diagram: Diagram;
  selected?: ReadonlySet<string>;
  errors?: ReadonlySet<string>;
  /** Elements to emphasise (e.g. explanation highlights). Others are dimmed. */
  focus?: ReadonlySet<string>;
  success?: boolean;
  tappable?: Tappable;
  onTap?: (id: string, kind: 'node' | 'edge') => void;
  showLabels?: boolean;
  showTags?: boolean;
  compact?: boolean;
  /** Nodes currently glowing as a magnetic snap target. */
  snapNode?: string | null;
  /** Node from which a connection is being drawn. */
  activeNode?: string | null;
  /** Vertices drawn as empty sockets waiting for lines. */
  socketHints?: boolean;
  overlay?: ReactNode;
  /** Playback: how much of each line has been travelled (0–1), and from which end. */
  reveal?: ReadonlyMap<string, { p: number; fromStart: boolean }>;
  /** Playback: vertices not reached yet. */
  pendingNodes?: ReadonlySet<string>;
  ariaLabel?: string;
  onPointerDown?: (e: RPointerEvent<SVGSVGElement>) => void;
  onPointerMove?: (e: RPointerEvent<SVGSVGElement>) => void;
  onPointerUp?: (e: RPointerEvent<SVGSVGElement>) => void;
  onPointerCancel?: (e: RPointerEvent<SVGSVGElement>) => void;
}

export function edgeClass(d: Diagram, e: DiagramEdge): string {
  if (e.type === 'photon') return 'photon';
  if (edgeRole(d, e) === 'internal') return 'virtual';
  const nodes = nodeMap(d);
  const a = nodes.get(e.from)!;
  const ext = a.kind !== 'vertex' ? a : nodes.get(e.to)!;
  const arrowIn = e.from === ext.id;
  const electron = ext.kind === 'in' ? arrowIn : !arrowIn;
  return electron ? 'electron' : 'positron';
}

const SPECIES_NAME: Record<string, string> = {
  electron: 'electrón',
  positron: 'positrón',
  photon: 'fotón',
  virtual: 'electrón virtual',
};

export const DiagramView = forwardRef<SVGSVGElement, DiagramViewProps>(function DiagramView(
  {
    diagram,
    selected,
    errors,
    focus,
    success,
    tappable = 'none',
    onTap,
    showLabels = true,
    showTags = true,
    compact,
    snapNode,
    activeNode,
    socketHints,
    overlay,
    reveal,
    pendingNodes,
    ariaLabel,
    ...pointer
  },
  ref,
) {
  const uid = useId().replace(/:/g, '');
  const nodes = nodeMap(diagram);
  const edgeTappable = tappable === 'edges' || tappable === 'all';
  const nodeTappable = tappable === 'nodes' || tappable === 'all';

  const stateClass = (id: string) =>
    [
      selected?.has(id) && 'is-selected',
      errors?.has(id) && 'is-error',
      focus && (focus.has(id) ? 'is-focus' : 'is-dim'),
    ]
      .filter(Boolean)
      .join(' ');

  const degreeOf = (id: string) => diagram.edges.filter((e) => e.from === id || e.to === id).length;

  return (
    <svg
      ref={ref}
      className={`diagram ${success ? 'is-success' : ''} ${compact ? 'is-compact' : ''} ${reveal ? 'is-playback' : ''}`}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={ariaLabel ?? 'Diagrama de Feynman'}
      {...pointer}
    >
      <defs>
        <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* time axis hint */}
      {!compact && (
        <g className="time-axis" aria-hidden>
          <line x1="30" y1="69.5" x2="70" y2="69.5" />
          <path d="M70,69.5 l-2,-1.3 v2.6 z" />
          <text x="50" y="67.6">tiempo</text>
        </g>
      )}

      <g filter={compact ? undefined : `url(#glow-${uid})`}>
        {diagram.edges.map((e, i) => {
          const a = nodes.get(e.from);
          const b = nodes.get(e.to);
          if (!a || !b) return null;
          const cls = edgeClass(diagram, e);
          const isPhoton = e.type === 'photon';
          const d = isPhoton ? wavyPath(a, b, e.bend) : straightOrCurvedPath(a, b, e.bend);
          const r = reveal?.get(e.id);
          if (reveal) {
            const p = Math.max(0, Math.min(1, r?.p ?? 1));
            const dash = r?.fromStart === false ? `0 ${1 - p} ${p} 1` : `${p} 2`;
            return (
              <g key={e.id} className={`edge ${cls} ${stateClass(e.id)}`} data-edge={e.id}>
                <path className="edge-ghost" d={d} />
                <path className="edge-line" d={d} pathLength={1} strokeDasharray={dash} />
                {!isPhoton && <path className="edge-arrow" style={{ opacity: p > 0.55 ? 1 : 0 }} d={arrowHead(a, b, e.bend, compact ? 3 : 2.4)} />}
              </g>
            );
          }
          return (
            <g
              key={e.id}
              className={`edge ${cls} ${stateClass(e.id)} ${e.locked === false ? 'is-editable' : ''}`}
              style={{ ['--i' as string]: i }}
              data-edge={e.id}
            >
              <path className="edge-line" d={d} />
              <path className="edge-flow" d={d} />
              {!isPhoton && <path className="edge-arrow" d={arrowHead(a, b, e.bend, compact ? 3 : 2.4)} />}
            </g>
          );
        })}
      </g>

      {/* labels */}
      {showLabels &&
        diagram.edges.map((e) => {
          const a = nodes.get(e.from);
          const b = nodes.get(e.to);
          if (!a || !b) return null;
          const p = labelPoint(a, b, e.bend, e.type === 'photon' ? 5.2 : 4);
          return (
            <text
              key={`l-${e.id}`}
              className={`edge-label ${edgeClass(diagram, e)} ${stateClass(e.id)}`}
              x={p.x}
              y={p.y + 1.3}
              style={reveal ? { opacity: (reveal.get(e.id)?.p ?? 1) >= 0.5 ? 1 : 0 } : undefined}
            >
              {edgeLabel(diagram, e)}
            </text>
          );
        })}

      {/* nodes */}
      {diagram.nodes.map((n) => (
        <NodeGlyph
          key={n.id}
          n={n}
          cls={`${stateClass(n.id)} ${pendingNodes?.has(n.id) ? 'is-pending' : ''}`}
          showTag={showTags}
          snap={snapNode === n.id}
          active={activeNode === n.id}
          socket={!!socketHints && n.kind === 'vertex' ? 3 - degreeOf(n.id) : 0}
          expectLabel={socketHints && n.expect && degreeOf(n.id) === 0 ? SPECIES_SYMBOL[n.expect] : undefined}
        />
      ))}

      {overlay}

      {/* hit targets on top */}
      {edgeTappable &&
        diagram.edges.map((e) => {
          const a = nodes.get(e.from);
          const b = nodes.get(e.to);
          if (!a || !b) return null;
          const name = SPECIES_NAME[edgeClass(diagram, e)];
          return (
            <path
              key={`h-${e.id}`}
              className="hit"
              d={straightOrCurvedPath(a, b, e.bend)}
              role="button"
              tabIndex={0}
              aria-label={`Línea: ${name} (${edgeLabel(diagram, e)})`}
              aria-pressed={selected?.has(e.id) ?? false}
              onClick={() => onTap?.(e.id, 'edge')}
              onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && (ev.preventDefault(), onTap?.(e.id, 'edge'))}
            />
          );
        })}
      {nodeTappable &&
        diagram.nodes.map((n) => (
          <circle
            key={`hn-${n.id}`}
            className="hit"
            cx={n.x}
            cy={n.y}
            r={5}
            role="button"
            tabIndex={0}
            aria-label={n.kind === 'vertex' ? 'Vértice' : n.kind === 'in' ? 'Partícula inicial' : 'Partícula final'}
            aria-pressed={selected?.has(n.id) ?? false}
            onClick={() => onTap?.(n.id, 'node')}
            onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && (ev.preventDefault(), onTap?.(n.id, 'node'))}
          />
        ))}
    </svg>
  );
});

function NodeGlyph({
  n,
  cls,
  showTag,
  snap,
  active,
  socket,
  expectLabel,
}: {
  n: DiagramNode;
  cls: string;
  showTag: boolean;
  snap: boolean;
  active: boolean;
  socket: number;
  expectLabel?: string;
}) {
  if (n.kind === 'vertex') {
    return (
      <g className={`node vertex ${cls} ${snap ? 'is-snap' : ''} ${active ? 'is-active' : ''} ${socket > 0 ? 'is-open' : ''}`} data-node={n.id}>
        <circle className="vertex-halo" cx={n.x} cy={n.y} r={4.4} />
        <circle className="vertex-ring" cx={n.x} cy={n.y} r={2.6} />
        <circle className="vertex-core" cx={n.x} cy={n.y} r={1.5} />
        {socket > 0 &&
          Array.from({ length: socket }).map((_, i) => (
            <circle key={i} className="vertex-socket" cx={n.x - (socket - 1) * 1.2 + i * 2.4} cy={n.y + 5.2} r={0.6} />
          ))}
      </g>
    );
  }
  const tagX = n.kind === 'in' ? n.x - 3 : n.x + 3;
  return (
    <g className={`node external ${n.kind} ${cls} ${snap ? 'is-snap' : ''} ${active ? 'is-active' : ''}`} data-node={n.id}>
      <circle className="ext-halo" cx={n.x} cy={n.y} r={3.6} />
      <circle className="ext-dot" cx={n.x} cy={n.y} r={1.4} />
      {expectLabel && (
        <text className={`ext-expect ${expectLabel === 'γ' ? 'photon' : expectLabel === 'e⁺' ? 'positron' : 'electron'}`} x={n.kind === 'in' ? n.x + 5.5 : n.x - 5.5} y={n.y - 3.4}>
          {expectLabel}
        </text>
      )}
      {showTag && n.tag && (
        <text className="ext-tag" x={tagX} y={n.y + 1} textAnchor={n.kind === 'in' ? 'end' : 'start'}>
          {n.tag}
        </text>
      )}
    </g>
  );
}
