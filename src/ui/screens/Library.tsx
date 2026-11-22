import { useEffect, useState } from 'react';
import { content } from '../../content';
import { useGame } from '../../game/store';
import type { Concept } from '../../game/types';
import { DiagramPlayback } from '../diagram/DiagramPlayback';
import { sfx } from '../audio';
import { t } from '../../i18n';

const KINDS: (Concept['kind'] | 'all')[] = ['all', 'particle', 'rule', 'process', 'idea'];

export function Library() {
  const { concepts: unlocked, seenConcepts, markConceptsSeen } = useGame();
  const [filter, setFilter] = useState<(typeof KINDS)[number]>('all');
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
        <h1>{t.library.title}</h1>
        <p>
          {t.library.count(unlocked.length, content.concepts.length)}
        </p>
        <div className="bar">
          <i style={{ width: `${(unlocked.length / content.concepts.length) * 100}%` }} />
        </div>
      </header>
      <div className="chips-row" role="tablist">
        {KINDS.map((k) => (
          <button key={k} role="tab" aria-selected={filter === k} className={`chip ${filter === k ? 'is-active' : ''}`} onClick={() => setFilter(k)}>
            {t.library.filters[k]}
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
              <small>{has ? c.summary : t.library.locked}</small>
              {fresh.has(c.id) && <em className="new-tag">{t.library.fresh}</em>}
            </button>
          );
        })}
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(null)}>
          <div className={`modal kind-${open.kind}`} role="dialog" aria-modal="true" aria-labelledby="concept-title" onClick={(e) => e.stopPropagation()}>
            <button className="icon-btn modal-close" onClick={() => setOpen(null)} aria-label={t.library.close} autoFocus>
              ✕
            </button>
            <span className="eyebrow">{t.library.kinds[open.kind]}</span>
            <h2 id="concept-title">
              {open.symbol && <span className="concept-symbol inline">{open.symbol}</span>} {open.title}
            </h2>
            {open.diagram && (
              <div className="diagram-card">
                <DiagramPlayback diagram={open.diagram} />
              </div>
            )}
            <p className="lead">{open.summary}</p>
            <p>{open.body}</p>
          </div>
        </div>
      )}
    </div>
  );
}
