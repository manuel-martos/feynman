import { useEffect, useState } from 'react';
import { content } from '../../content';
import { useGame } from '../../game/store';
import type { Concept } from '../../game/types';
import { BottomNav } from '../components/BottomNav';
import { DiagramView } from '../diagram/DiagramView';
import { sfx } from '../audio';

const KINDS: { id: Concept['kind'] | 'all'; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'particle', label: 'Partículas' },
  { id: 'rule', label: 'Reglas' },
  { id: 'process', label: 'Procesos' },
  { id: 'idea', label: 'Ideas' },
];

const KIND_LABEL: Record<Concept['kind'], string> = { particle: 'Partícula', rule: 'Regla', process: 'Proceso', idea: 'Idea clave' };

export function Library() {
  const { concepts: unlocked, seenConcepts, markConceptsSeen } = useGame();
  const [filter, setFilter] = useState<(typeof KINDS)[number]['id']>('all');
  const [open, setOpen] = useState<Concept | null>(null);
  const [fresh] = useState(() => new Set(unlocked.filter((c) => !seenConcepts.includes(c))));

  useEffect(() => {
    markConceptsSeen();
  }, [markConceptsSeen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const list = content.concepts.filter((c) => filter === 'all' || c.kind === filter);

  return (
    <div className="screen library with-nav">
      <header className="page-head">
        <h1>Colección</h1>
        <p>
          {unlocked.length} de {content.concepts.length} descubrimientos
        </p>
        <div className="bar">
          <i style={{ width: `${(unlocked.length / content.concepts.length) * 100}%` }} />
        </div>
      </header>
      <div className="chips-row" role="tablist">
        {KINDS.map((k) => (
          <button key={k.id} role="tab" aria-selected={filter === k.id} className={`chip ${filter === k.id ? 'is-active' : ''}`} onClick={() => setFilter(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      <div className="concept-grid">
        {list.map((c, i) => {
          const has = unlocked.includes(c.id);
          return (
            <button
              key={c.id}
              className={`concept-card kind-${c.kind} ${has ? '' : 'is-locked'} ${fresh.has(c.id) ? 'is-new' : ''}`}
              disabled={!has}
              onClick={() => (setOpen(c), sfx('tap'))}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="concept-symbol">{has ? (c.symbol ?? '✦') : '?'}</span>
              <strong>{has ? c.title : '???'}</strong>
              <small>{has ? c.summary : 'Sigue jugando para descubrirlo'}</small>
              {fresh.has(c.id) && <em className="new-tag">Nuevo</em>}
            </button>
          );
        })}
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(null)}>
          <div className={`modal kind-${open.kind}`} role="dialog" aria-modal="true" aria-labelledby="concept-title" onClick={(e) => e.stopPropagation()}>
            <button className="icon-btn modal-close" onClick={() => setOpen(null)} aria-label="Cerrar" autoFocus>
              ✕
            </button>
            <span className="eyebrow">{KIND_LABEL[open.kind]}</span>
            <h2 id="concept-title">
              {open.symbol && <span className="concept-symbol inline">{open.symbol}</span>} {open.title}
            </h2>
            {open.diagram && (
              <div className="diagram-card">
                <DiagramView diagram={open.diagram} />
              </div>
            )}
            <p className="lead">{open.summary}</p>
            <p>{open.body}</p>
          </div>
        </div>
      )}
      <BottomNav active="library" />
    </div>
  );
}
