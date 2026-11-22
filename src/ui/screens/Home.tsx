import { content } from '../../content';
import { plain, process } from '../../content/diagrams';
import { rankFor } from '../../game/scoring';
import { isLevelUnlocked, mathUnlocked, totalStars, useGame } from '../../game/store';
import { Logo } from '../components/Logo';
import { MechanicBadge } from '../components/MechanicBadge';
import { DiagramView } from '../diagram/DiagramView';
import { navigate } from '../router';
import { t } from '../../i18n';

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
          <p className="tagline">{t.home.tagline}</p>
        </div>
      </header>

      <section className="hero-card" style={{ ['--chapter' as string]: chapter.color }}>
        <div className="hero-diagram" aria-hidden>
          <DiagramView diagram={hero} showLabels={false} />
        </div>
        {next ? (
          <>
            <span className="eyebrow">
              {done === 0 ? t.home.firstTime : t.home.chapter(chapter.id, chapter.title)}
            </span>
            <h2>
              {t.home.level(next.id, next.title)}
            </h2>
            <div className="hero-meta">
              <MechanicBadge mechanic={next.mechanic} />
              <span>{t.home.challenges(next.steps.length)}</span>
            </div>
            <button className="btn primary block lg" onClick={() => navigate({ name: 'level', id: next.id })}>
              {done === 0 ? t.home.start : t.home.resume}
            </button>
          </>
        ) : (
          <>
            <span className="eyebrow">{t.home.campaignDone}</span>
            <h2>{t.home.fluent}</h2>
            <button className="btn primary block lg" onClick={() => navigate({ name: 'practice' })}>
              {t.home.trainMastery}
            </button>
          </>
        )}
      </section>

      <section className="stats">
        <div className="stat">
          <strong>{stars}</strong>
          <span>{t.home.ofStars(content.levels.length * 3)}</span>
        </div>
        <div className="stat">
          <strong>{done}</strong>
          <span>{t.home.ofLevels(content.levels.length)}</span>
        </div>
        <div className="stat">
          <strong>{concepts.length}</strong>
          <span>{t.home.ofConcepts(content.concepts.length)}</span>
        </div>
      </section>

      <section className="card rank-card">
        <div className="rank-row">
          <div>
            <span className="eyebrow">{t.home.rank}</span>
            <strong>{t.ranks[rank.id]}</strong>
          </div>
          <span className="xp">{xp} XP</span>
        </div>
        <div className="bar" aria-hidden>
          <i style={{ width: `${Math.round(rankProgress * 100)}%` }} />
        </div>
        {nextRank && (
          <small>
            {t.home.toNextRank(nextRank.minXp - xp, t.ranks[nextRank.id])}
          </small>
        )}
      </section>

      <button className={`card practice-card ${mathUnlocked(progress) ? '' : 'is-locked'}`} onClick={() => mathUnlocked(progress) && navigate({ name: 'practice' })} disabled={!mathUnlocked(progress)}>
        <span className="practice-icon" aria-hidden>
          ∞
        </span>
        <div>
          <strong>{t.home.mastery}</strong>
          <p>{mathUnlocked(progress) ? t.home.masteryOpen : t.home.masteryLocked}</p>
        </div>
        <span aria-hidden>{mathUnlocked(progress) ? '→' : '🔒'}</span>
      </button>

    </div>
  );
}
