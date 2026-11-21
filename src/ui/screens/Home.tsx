import { content } from '../../content';
import { plain, process } from '../../content/diagrams';
import { rankFor } from '../../game/scoring';
import { isLevelUnlocked, mathUnlocked, totalStars, useGame } from '../../game/store';
import { BottomNav } from '../components/BottomNav';
import { Logo } from '../components/Logo';
import { MechanicBadge } from '../components/MechanicBadge';
import { DiagramView } from '../diagram/DiagramView';
import { navigate } from '../router';

const hero = plain(process('bhabha', 's'));

export function Home() {
  const { progress, xp, concepts } = useGame();
  const next = content.levels.find((l) => !progress[l.id] && isLevelUnlocked(progress, l.id));
  const done = Object.keys(progress).length;
  const chapter = content.chapters.find((c) => c.id === (next?.chapter ?? 5))!;
  const { rank, next: nextRank, progress: rankProgress } = rankFor(xp);
  const stars = totalStars(progress);

  return (
    <div className="screen home with-nav">
      <header className="home-head">
        <Logo size={40} />
        <div>
          <h1 className="wordmark">
            Feynman <span>Quest</span>
          </h1>
          <p className="tagline">Aprende el lenguaje del universo, una interacción cada vez.</p>
        </div>
      </header>

      <section className="hero-card" style={{ ['--chapter' as string]: chapter.color }}>
        <div className="hero-diagram" aria-hidden>
          <DiagramView diagram={hero} showLabels={false} />
        </div>
        {next ? (
          <>
            <span className="eyebrow">
              {done === 0 ? 'Tu aventura empieza aquí' : `Capítulo ${chapter.id} · ${chapter.title}`}
            </span>
            <h2>
              Nivel {next.id}: {next.title}
            </h2>
            <div className="hero-meta">
              <MechanicBadge mechanic={next.mechanic} />
              <span>{next.steps.length} {next.steps.length === 1 ? 'reto' : 'retos'} · 2–5 min</span>
            </div>
            <button className="btn primary block lg" onClick={() => navigate({ name: 'level', id: next.id })}>
              {done === 0 ? 'Empezar' : 'Continuar'}
            </button>
          </>
        ) : (
          <>
            <span className="eyebrow">Campaña completada</span>
            <h2>Hablas el lenguaje de Feynman</h2>
            <button className="btn primary block lg" onClick={() => navigate({ name: 'practice' })}>
              Entrenar en modo Dominio
            </button>
          </>
        )}
      </section>

      <section className="stats">
        <div className="stat">
          <strong>{stars}</strong>
          <span>de {content.levels.length * 3} ★</span>
        </div>
        <div className="stat">
          <strong>{done}</strong>
          <span>de {content.levels.length} niveles</span>
        </div>
        <div className="stat">
          <strong>{concepts.length}</strong>
          <span>de {content.concepts.length} conceptos</span>
        </div>
      </section>

      <section className="card rank-card">
        <div className="rank-row">
          <div>
            <span className="eyebrow">Rango</span>
            <strong>{rank.title}</strong>
          </div>
          <span className="xp">{xp} XP</span>
        </div>
        <div className="bar" aria-hidden>
          <i style={{ width: `${Math.round(rankProgress * 100)}%` }} />
        </div>
        {nextRank && (
          <small>
            {nextRank.minXp - xp} XP para «{nextRank.title}»
          </small>
        )}
      </section>

      <button className={`card practice-card ${mathUnlocked(progress) ? '' : 'is-locked'}`} onClick={() => mathUnlocked(progress) && navigate({ name: 'practice' })} disabled={!mathUnlocked(progress)}>
        <span className="practice-icon" aria-hidden>
          ∞
        </span>
        <div>
          <strong>Modo Dominio</strong>
          <p>{mathUnlocked(progress) ? 'Repasa con diagramas nuevos generados al momento.' : 'Se desbloquea al completar el capítulo 1.'}</p>
        </div>
        <span aria-hidden>{mathUnlocked(progress) ? '→' : '🔒'}</span>
      </button>

      <BottomNav active="home" />
    </div>
  );
}
