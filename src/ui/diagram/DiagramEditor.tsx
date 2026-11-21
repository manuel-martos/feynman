import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { degree, isExternal, newId, nodeMap, type Diagram, type DiagramEdge, type EdgeType } from '../../engine';
import { sfx } from '../audio';
import { DiagramView, VIEW_H, VIEW_W } from './DiagramView';
import { arrowHead, controlPoint, quadAt, straightOrCurvedPath, wavyPath, type Pt } from './geometry';

export interface DiagramEditorProps {
  diagram: Diagram;
  onChange: (d: Diagram) => void;
  palette: EdgeType[];
  errors?: ReadonlySet<string>;
  success?: boolean;
  disabled?: boolean;
  onNotice?: (msg: string) => void;
  /** Allow a second line between the same two vertices (loop levels). */
  allowParallel?: boolean;
}

const NODE_GRAB = 8;
const BEND = 0.42;

function distToCurve(p: Pt, a: Pt, b: Pt, bend = 0): number {
  const c = controlPoint(a, b, bend);
  let best = Infinity;
  for (let i = 0; i <= 24; i++) {
    const q = quadAt(a, c, b, i / 24);
    best = Math.min(best, Math.hypot(q.x - p.x, q.y - p.y));
  }
  return best;
}

/** If a straight line would run over another node, bend it around. */
function clearBend(a: Pt, b: Pt, others: Pt[]): number {
  const clearance = (bend: number) => Math.min(Infinity, ...others.map((o) => distToCurve(o, a, b, bend)));
  if (clearance(0) >= 4) return 0;
  let best = 0;
  for (const bend of [0.2, -0.2, 0.3, -0.3, 0.45, -0.45]) if (clearance(bend) > clearance(best) + 0.5) best = bend;
  return best;
}
const SNAP = 10;

export function DiagramEditor({ diagram, onChange, palette, errors, success, disabled, onNotice, allowParallel }: DiagramEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tool, setTool] = useState<EdgeType>(palette[0] ?? 'fermion');
  type Drag = { from: string; to: Pt; moved: boolean };
  const [drag, setDragState] = useState<Drag | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [snap, setSnapState] = useState<string | null>(null);
  // Refs mirror the gesture state so fast gestures never read stale values.
  const dragRef = useRef<Drag | null>(null);
  const snapRef = useRef<string | null>(null);
  const setDrag = (d: Drag | null) => {
    dragRef.current = d;
    setDragState(d);
  };
  const setSnap = (s: string | null) => {
    snapRef.current = s;
    setSnapState(s);
  };
  const [menu, setMenu] = useState<{ edge: string; at: Pt } | null>(null);
  const [history, setHistory] = useState<Diagram[]>([]);
  const initial = useRef(diagram);

  useEffect(() => {
    if (!palette.includes(tool)) setTool(palette[0]);
  }, [palette, tool]);

  const nodes = nodeMap(diagram);

  const toView = (e: { clientX: number; clientY: number }): Pt => {
    const svg = svgRef.current!;
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  const nearestNode = (p: Pt, radius: number, exclude?: string) => {
    let best: string | null = null;
    let bestD = radius;
    for (const n of diagram.nodes) {
      if (n.id === exclude) continue;
      const dd = Math.hypot(n.x - p.x, n.y - p.y);
      if (dd < bestD) {
        bestD = dd;
        best = n.id;
      }
    }
    return best;
  };

  const commit = (next: Diagram) => {
    setHistory((h) => [...h.slice(-30), diagram]);
    onChange(next);
  };

  const capacity = (id: string) => (nodes.get(id)?.kind === 'vertex' ? 3 : 1);

  const connect = useCallback(
    (from: string, to: string) => {
      const a = nodes.get(from)!;
      const b = nodes.get(to)!;
      if (isExternal(a) && isExternal(b)) {
        sfx('deny');
        onNotice?.('Cada partícula externa debe llegar a un vértice: ahí es donde ocurre la interacción.');
        return;
      }
      if (from === to) return;
      const parallel = diagram.edges.filter((e) => (e.from === from && e.to === to) || (e.from === to && e.to === from));
      if (parallel.length && (!allowParallel || parallel.length >= 2 || isExternal(a) || isExternal(b))) {
        sfx('deny');
        onNotice?.('Ya hay una línea entre esos dos puntos.');
        return;
      }
      for (const id of [from, to]) {
        if (degree(diagram, id) >= capacity(id)) {
          sfx('deny');
          onNotice?.(
            nodes.get(id)!.kind === 'vertex'
              ? 'Un vértice QED une exactamente tres líneas. Borra una para cambiarla.'
              : 'Cada partícula externa tiene una sola línea.',
          );
          return;
        }
      }
      let edges = diagram.edges;
      let bend = 0;
      if (parallel.length) {
        // Two lines between the same vertices: curve them apart.
        const old = parallel[0];
        const canon = (e: { from: string; to: string }) => (e.from < e.to ? 1 : -1);
        let side = (old.bend ?? 0) * canon(old);
        if (!side) {
          side = -BEND;
          if (old.locked === false) edges = edges.map((e) => (e === old ? { ...e, bend: side * canon(old) } : e));
        }
        bend = (side > 0 ? -BEND : BEND) * canon({ from, to });
      } else {
        bend = clearBend(a, b, diagram.nodes.filter((n) => n.id !== from && n.id !== to));
      }
      const edge: DiagramEdge = { id: newId(), type: tool, from, to, locked: false, ...(bend ? { bend } : {}) };
      sfx('connect');
      navigator.vibrate?.(12);
      commit({ ...diagram, edges: [...edges, edge] });
    },
    [diagram, tool, onNotice, allowParallel],
  );

  const edgeAt = (p: Pt) => {
    let best: DiagramEdge | null = null;
    let bestD = 3.2;
    for (const e of diagram.edges) {
      const a = nodes.get(e.from);
      const b = nodes.get(e.to);
      if (!a || !b) continue;
      const dd = distToCurve(p, a, b, e.bend);
      if (dd < bestD) {
        bestD = dd;
        best = e;
      }
    }
    return best;
  };

  const onPointerDown = (e: RPointerEvent<SVGSVGElement>) => {
    if (disabled) return;
    const p = toView(e);
    const hitNode = nearestNode(p, NODE_GRAB);
    setMenu(null);
    if (hitNode) {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDrag({ from: hitNode, to: p, moved: false });
      sfx('tap');
      return;
    }
    const hitEdge = edgeAt(p);
    if (hitEdge) {
      if (hitEdge.locked !== false) {
        onNotice?.('Esta línea forma parte del enunciado y no se puede cambiar.');
        sfx('deny');
        return;
      }
      const a = nodes.get(hitEdge.from)!;
      const b = nodes.get(hitEdge.to)!;
      setMenu({ edge: hitEdge.id, at: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } });
      sfx('tap');
      return;
    }
    setPending(null);
  };

  const onPointerMove = (e: RPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const p = toView(e);
    const start = nodes.get(drag.from)!;
    const moved = drag.moved || Math.hypot(p.x - start.x, p.y - start.y) > 3;
    setDrag({ ...drag, to: p, moved });
    const s = moved ? nearestNode(p, SNAP, drag.from) : null;
    if (s !== snapRef.current) {
      setSnap(s);
      if (s) {
        sfx('snap');
        navigator.vibrate?.(6);
      }
    }
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    const snap = snapRef.current;
    if (!drag) return;
    if (drag.moved) {
      if (snap) connect(drag.from, snap);
      setPending(null);
    } else if (pending && pending !== drag.from) {
      connect(pending, drag.from);
      setPending(null);
    } else {
      setPending(pending === drag.from ? null : drag.from);
    }
    setDrag(null);
    setSnap(null);
  };

  const editEdge = (action: 'flip' | 'delete') => {
    if (!menu) return;
    const edges =
      action === 'delete'
        ? diagram.edges.filter((x) => x.id !== menu.edge)
        : diagram.edges.map((x) => (x.id === menu.edge ? { ...x, from: x.to, to: x.from } : x));
    sfx(action === 'delete' ? 'remove' : 'connect');
    commit({ ...diagram, edges });
    setMenu(null);
  };

  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    onChange(prev);
    sfx('remove');
  };

  const reset = () => {
    commit(initial.current);
    setMenu(null);
    setPending(null);
    sfx('remove');
  };

  const ghostFrom = drag ? nodes.get(drag.from) : null;
  const ghostTo = drag && snap ? nodes.get(snap)! : drag?.to;
  const menuEdge = menu ? diagram.edges.find((x) => x.id === menu.edge) : null;

  return (
    <div className="editor">
      <div className="editor-canvas">
        <DiagramView
          ref={svgRef}
          diagram={diagram}
          errors={errors}
          success={success}
          snapNode={snap}
          activeNode={drag?.from ?? pending}
          socketHints
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (setDrag(null), setSnap(null))}
          ariaLabel="Editor de diagrama: arrastra desde un punto a otro para trazar una línea"
          overlay={
            ghostFrom && ghostTo && drag?.moved ? (
              <g>
                <path
                  className={`ghost-line ${tool}`}
                  d={tool === 'photon' ? wavyPath(ghostFrom, ghostTo) : straightOrCurvedPath(ghostFrom, ghostTo)}
                />
                {tool === 'fermion' && <path className="ghost-arrow" d={arrowHead(ghostFrom, ghostTo)} />}
              </g>
            ) : null
          }
        />
        {menu && menuEdge && (
          <div
            className="edge-menu"
            style={{ left: `${(menu.at.x / VIEW_W) * 100}%`, top: `${(menu.at.y / VIEW_H) * 100}%` }}
            role="menu"
          >
            {menuEdge.type === 'fermion' && (
              <button role="menuitem" onClick={() => editEdge('flip')}>
                <span aria-hidden>⇄</span> Invertir flecha
              </button>
            )}
            <button role="menuitem" className="danger" onClick={() => editEdge('delete')}>
              <span aria-hidden>✕</span> Borrar
            </button>
          </div>
        )}
      </div>

      {/* keyboard-accessible connection picker */}
      <KeyboardConnect diagram={diagram} onConnect={connect} disabled={disabled} />

      <div className="editor-toolbar">
        <div className="palette" role="radiogroup" aria-label="Tipo de línea">
          {palette.map((t) => (
            <button
              key={t}
              role="radio"
              aria-checked={tool === t}
              className={`piece ${t} ${tool === t ? 'is-active' : ''}`}
              onClick={() => (setTool(t), sfx('tap'))}
              disabled={disabled}
            >
              <svg viewBox="0 0 40 14" aria-hidden>
                {t === 'photon' ? (
                  <path d={wavyPath({ x: 3, y: 7 }, { x: 37, y: 7 }, 0, 3, 6.5)} />
                ) : (
                  <>
                    <path d="M3,7 L37,7" />
                    <path className="fill" d="M24,7 L16,2.5 L16,11.5 Z" />
                  </>
                )}
              </svg>
              <span>{t === 'photon' ? 'Fotón' : 'Electrón / positrón'}</span>
            </button>
          ))}
        </div>
        <div className="editor-actions">
          <button className="icon-btn" onClick={undo} disabled={!history.length || disabled} aria-label="Deshacer" title="Deshacer">
            <svg viewBox="0 0 24 24" aria-hidden><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
          </button>
          <button className="icon-btn" onClick={reset} disabled={disabled} aria-label="Reiniciar diagrama" title="Reiniciar">
            <svg viewBox="0 0 24 24" aria-hidden><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
          </button>
        </div>
      </div>
      <p className="editor-help">
        {pending
          ? 'Ahora toca el punto de destino.'
          : tool === 'fermion'
            ? 'Arrastra entre dos puntos. La flecha sigue el sentido de tu gesto.'
            : 'Arrastra entre dos puntos para trazar un fotón.'}
      </p>
    </div>
  );
}

function KeyboardConnect({
  diagram,
  onConnect,
  disabled,
}: {
  diagram: Diagram;
  onConnect: (a: string, b: string) => void;
  disabled?: boolean;
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const name = (id: string) => {
    const n = diagram.nodes.find((x) => x.id === id)!;
    const same = diagram.nodes.filter((x) => x.kind === n.kind);
    const base = n.kind === 'vertex' ? 'Vértice' : n.kind === 'in' ? 'Entrada' : 'Salida';
    return `${base} ${n.tag ?? same.indexOf(n) + 1}`;
  };
  return (
    <div className="sr-only-focusable kb-connect">
      <label>
        Desde{' '}
        <select value={from} onChange={(e) => setFrom(e.target.value)} disabled={disabled}>
          <option value="">—</option>
          {diagram.nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {name(n.id)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Hasta{' '}
        <select value={to} onChange={(e) => setTo(e.target.value)} disabled={disabled}>
          <option value="">—</option>
          {diagram.nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {name(n.id)}
            </option>
          ))}
        </select>
      </label>
      <button disabled={!from || !to || from === to || disabled} onClick={() => onConnect(from, to)}>
        Trazar línea
      </button>
    </div>
  );
}
