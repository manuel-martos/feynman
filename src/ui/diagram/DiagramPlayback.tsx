import { useEffect, useMemo, useRef, useState } from 'react';
import { nodeMap, timeline, type Diagram } from '../../engine';
import { narrate } from '../../content';
import { useGame } from '../../game/store';
import { sfx } from '../audio';
import { DiagramView } from './DiagramView';
import { controlPoint, quadAt } from './geometry';

/** Milliseconds to advance one step in time, and pause at each vertex. */
const TRAVEL_MS = 900;
const HOLD_MS = 1700;

const prefersReduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Reads a diagram as a story in time: lines are drawn left to right, particles
 * travel along them, and every vertex is explained (with its charge balance)
 * when the story reaches it. Can be played or stepped through.
 */
export function DiagramPlayback({ diagram, autoPlay = false, showLabels = true }: { diagram: Diagram; autoPlay?: boolean; showLabels?: boolean }) {
  const tl = useMemo(() => timeline(diagram), [diagram]);
  const nodes = useMemo(() => nodeMap(diagram), [diagram]);
  const steps = tl.events.length + 1;
  const reduced = useGame((s) => s.settings.reducedMotion) || prefersReduced();
  const start = autoPlay && !reduced ? 0 : steps;
  const [tau, setTau] = useState(start);
  const [target, setTarget] = useState(start);
  const [playing, setPlaying] = useState(autoPlay && !reduced);
  const [started, setStarted] = useState(autoPlay && !reduced);
  const [flash, setFlash] = useState<{ id: string; k: number } | null>(null);
  const tauRef = useRef(start);
  const arrived = useRef(start);

  useEffect(() => {
    let raf = 0;
    let timer = 0;
    const arrive = () => {
      if (arrived.current !== target) {
        arrived.current = target;
        const ev = tl.events[target - 1];
        if (ev) {
          setFlash({ id: ev.vertex, k: Date.now() });
          if (playing) sfx('snap');
        }
      }
      if (!playing) return;
      if (target >= steps) setPlaying(false);
      else timer = window.setTimeout(() => setTarget((t) => Math.min(steps, t + 1)), target === 0 ? 900 : HOLD_MS);
    };
    if (reduced || tauRef.current === target) {
      tauRef.current = target;
      setTau(target);
      arrive();
    } else {
      let last = performance.now();
      const tick = (now: number) => {
        const dir = Math.sign(target - tauRef.current);
        let next = tauRef.current + (dir * (now - last)) / TRAVEL_MS;
        last = now;
        if ((dir > 0 && next >= target) || (dir < 0 && next <= target)) next = target;
        tauRef.current = next;
        setTau(next);
        if (next === target) arrive();
        else raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [target, playing, reduced, steps, tl]);

  const go = (t: number) => {
    setStarted(true);
    setTarget(Math.max(0, Math.min(steps, t)));
    sfx('tap');
  };
  const toggle = () => {
    setStarted(true);
    if (playing) {
      setPlaying(false);
      return;
    }
    if (target >= steps) {
      tauRef.current = 0;
      arrived.current = 0;
      setTau(0);
      setTarget(0);
    }
    setPlaying(true);
    sfx('tap');
  };

  const reveal = new Map<string, { p: number; fromStart: boolean }>();
  const particles: { id: string; x: number; y: number; cls: string; sign: string }[] = [];
  for (const t of tl.traversals) {
    const rs = tl.rank.get(t.start)!;
    const re = tl.rank.get(t.end)!;
    const p = Math.max(0, Math.min(1, (tau - rs) / (re - rs || 1)));
    const fromStart = t.edge.from === t.start;
    reveal.set(t.edge.id, { p, fromStart });
    if (p > 0 && p < 1) {
      const a = nodes.get(t.edge.from)!;
      const b = nodes.get(t.edge.to)!;
      const q = quadAt(a, controlPoint(a, b, t.edge.bend), b, fromStart ? p : 1 - p);
      const cls = `${t.species === 'gamma' ? 'photon' : t.species === 'e-' ? 'electron' : 'positron'} ${t.virtual ? 'is-virtual' : ''}`;
      particles.push({ id: t.edge.id, x: q.x, y: q.y, cls, sign: t.species === 'e-' ? '−' : t.species === 'e+' ? '+' : '' });
    }
  }
  const pending = new Set(tl.events.filter((e) => tl.rank.get(e.vertex)! > tau + 1e-6).map((e) => e.vertex));
  const flashNode = flash ? nodes.get(flash.id) : undefined;
  const frac = tau / steps;
  const caption = narrate(tl, Math.floor(tau + 1e-6));
  const idle = !started && !playing;

  return (
    <div className="playback">
      <DiagramView
        diagram={diagram}
        showLabels={showLabels}
        reveal={reveal}
        pendingNodes={pending}
        overlay={
          <g aria-hidden>
            <line className="time-progress" x1={30} y1={69.5} x2={30 + 40 * frac} y2={69.5} />
            <circle className="time-cursor" cx={30 + 40 * frac} cy={69.5} r={1.1} />
            {flashNode && (
              <g key={flash!.k}>
                <circle className="ripple" cx={flashNode.x} cy={flashNode.y} r={2.4} />
                <circle className="ripple r2" cx={flashNode.x} cy={flashNode.y} r={2.4} />
              </g>
            )}
            {particles.map((p) => (
              <g key={p.id} className={`particle ${p.cls}`}>
                <circle className="aura" cx={p.x} cy={p.y} r={3} />
                <circle className="core" cx={p.x} cy={p.y} r={p.sign ? 1.7 : 1.2} />
                {p.sign && (
                  <text x={p.x} y={p.y + 0.1}>
                    {p.sign}
                  </text>
                )}
              </g>
            ))}
          </g>
        }
      />
      <div className="playback-caption" aria-live="polite">
        {idle ? (
          <p className="playback-hint">Pulsa ▶ para leer el diagrama como una historia en el tiempo.</p>
        ) : (
          <div key={caption.title} className="caption-in">
            <strong>{caption.title}</strong>
            <p>{caption.text}</p>
            {caption.charge && (
              <span className="charge-chip">
                Carga: {caption.charge} <b aria-label="se conserva">✓</b>
              </span>
            )}
          </div>
        )}
      </div>
      <div className="playback-bar">
        <button className="icon-btn" onClick={() => go(Math.ceil(tau - 1e-6) - 1)} disabled={target <= 0} aria-label="Paso anterior">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <button className="btn primary play-btn" onClick={toggle} aria-label={playing ? 'Pausa' : 'Reproducir en el tiempo'}>
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M8 5v14M16 5v14" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden>
              <path className="fill" d="M7 4.5v15l12-7.5z" />
            </svg>
          )}
          <span>{playing ? 'Pausa' : tau >= steps ? 'Ver en el tiempo' : 'Seguir'}</span>
        </button>
        <button className="icon-btn" onClick={() => go(Math.floor(tau + 1e-6) + 1)} disabled={target >= steps} aria-label="Paso siguiente">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      <div className="playback-steps" aria-hidden>
        {Array.from({ length: steps + 1 }).map((_, i) => (
          <i key={i} className={i <= tau + 1e-6 ? 'on' : ''} />
        ))}
      </div>
    </div>
  );
}
