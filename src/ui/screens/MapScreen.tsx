import { useEffect } from 'react';
import { content } from '../../content';
import { isLevelUnlocked, useGame } from '../../game/store';
import { Stars } from '../components/Stars';
import { navigate } from '../router';

const MECH_ICON = { decode: '◉', build: '✦', debug: '⚠' } as const;
const OFFSETS = [0, 34, 52, 34, 0, -34, -52, -34];

export function MapScreen({ chapter: focus }: { chapter?: number }) {
  const progress = useGame((s) => s.progress);
  const current = content.levels.find((l) => !progress[l.id] && isLevelUnlocked(progress, l.id))?.id;

  useEffect(() => {
    const target = document.getElementById(focus ? `chapter-${focus}` : current ? `level-${current}` : '');
    target?.scrollIntoView({ block: focus ? 'start' : 'center' });
  }, [focus, current]);

  return (
    <div className="screen map with-nav">
      <header className="page-head">
        <h1>Campaña</h1>
        <p>
          {content.levels.length} niveles · {content.chapters.length} capítulos
        </p>
      </header>
      {content.chapters.map((ch) => {
        const levels = content.levels.filter((l) => l.chapter === ch.id);
        const unlocked = isLevelUnlocked(progress, levels[0].id);
        const done = levels.filter((l) => progress[l.id]).length;
        const stars = levels.reduce((a, l) => a + (progress[l.id]?.stars ?? 0), 0);
        return (
          <section key={ch.id} id={`chapter-${ch.id}`} className={`chapter ${unlocked ? '' : 'is-locked'}`} style={{ ['--chapter' as string]: ch.color }}>
            <div className="chapter-head">
              <span className="chapter-num">{ch.id}</span>
              <div>
                <h2>{ch.title}</h2>
                <p>{unlocked ? ch.goals : 'Completa el capítulo anterior para desbloquearlo.'}</p>
              </div>
            </div>
            <div className="chapter-meta">
              <div className="bar">
                <i style={{ width: `${(done / levels.length) * 100}%` }} />
              </div>
              <span>
                {done}/{levels.length} · {stars}★
              </span>
            </div>
            <ol className="path">
              {levels.map((l, i) => {
                const open = isLevelUnlocked(progress, l.id);
                const p = progress[l.id];
                const isCurrent = l.id === current;
                return (
                  <li key={l.id} id={`level-${l.id}`} style={{ ['--dx' as string]: `${OFFSETS[(l.id - 1) % OFFSETS.length]}px` }}>
                    <button
                      className={`level-node ${p ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''} ${open ? '' : 'is-locked'}`}
                      disabled={!open}
                      onClick={() => navigate({ name: 'level', id: l.id })}
                      aria-label={`Nivel ${l.id}: ${l.title}${p ? `, ${p.stars} estrellas` : open ? '' : ', bloqueado'}`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <span className="level-num">{open ? l.id : '🔒'}</span>
                      <span className="level-mech" aria-hidden>
                        {MECH_ICON[l.mechanic]}
                      </span>
                    </button>
                    <div className="level-caption">
                      <span>{l.title}</span>
                      {p && <Stars value={p.stars} size={12} />}
                      {isCurrent && <em>Siguiente</em>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
