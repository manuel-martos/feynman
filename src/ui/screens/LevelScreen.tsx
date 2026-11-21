import { useEffect, useMemo, useRef, useState } from 'react';
import { content } from '../../content';
import { isLevelUnlocked, mathUnlocked, useGame, type LevelResult } from '../../game/store';
import type { Diagram } from '../../engine';
import type { Level } from '../../game/types';
import { sfx } from '../audio';
import { DiagramView } from '../diagram/DiagramView';
import { DiagramPlayback } from '../diagram/DiagramPlayback';
import { Explanation } from '../components/Explanation';
import { MechanicBadge } from '../components/MechanicBadge';
import { Stars } from '../components/Stars';
import { navigate } from '../router';
import { StepPlayer } from '../StepPlayer';

type Phase = 'intro' | 'play' | 'done';

export function LevelScreen({ id }: { id: number }) {
  const level = content.levels.find((l) => l.id === id);
  const progress = useGame((s) => s.progress);
  if (!level) return <NotFound />;
  if (!isLevelUnlocked(progress, id)) {
    return (
      <div className="screen center">
        <p>Este nivel aún está bloqueado.</p>
        <button className="btn primary" onClick={() => navigate({ name: 'map' })}>
          Volver a la campaña
        </button>
      </div>
    );
  }
  return <LevelRun key={id} level={level} />;
}

function NotFound() {
  return (
    <div className="screen center">
      <p>Nivel no encontrado.</p>
      <a className="btn" href="#/map">
        Campaña
      </a>
    </div>
  );
}

function firstDiagram(level: Level) {
  for (const s of level.steps) {
    if (s.kind !== 'choice') return s.diagram;
    if (s.diagram) return s.diagram;
    if (s.diagrams) return s.diagrams[0].diagram;
  }
  return undefined;
}

function LevelRun({ level }: { level: Level }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [stepIdx, setStepIdx] = useState(0);
  const [solved, setSolved] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintTier, setHintTier] = useState(0); // hints revealed for the current step
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<LevelResult | null>(null);
  const startedAt = useRef(0);
  const [built, setBuilt] = useState<Diagram | undefined>();
  const { startLevel, completeLevel, recordLayer, settings } = useGame();
  const progress = useGame((s) => s.progress);
  const chapter = content.chapters.find((c) => c.id === level.chapter)!;
  const step = level.steps[stepIdx];
  const isLast = stepIdx === level.steps.length - 1;
  const preview = useMemo(() => firstDiagram(level), [level]);
  const prevBest = progress[level.id]?.stars ?? 0;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase, stepIdx]);

  const begin = () => {
    const fromPrevious = sessionStorage.getItem('fq-last-completed') === String(level.id - 1);
    startLevel(level.id, fromPrevious);
    startedAt.current = performance.now();
    setPhase('play');
    sfx('tap');
  };

  const onSolved = (d?: Diagram) => {
    if (d) setBuilt(d);
    setSolved(true);
    setShowHint(false);
    sfx('success');
    if (settings.haptics) navigator.vibrate?.(20);
  };

  const next = () => {
    if (!isLast) {
      setStepIdx(stepIdx + 1);
      setSolved(false);
      setHintTier(0);
      setShowHint(false);
      sfx('tap');
      return;
    }
    const r = completeLevel(level.id, mistakes, hintsUsed, performance.now() - startedAt.current, level.concepts);
    try {
      sessionStorage.setItem('fq-last-completed', String(level.id));
    } catch {
      /* ignore */
    }
    setResult(r);
    setPhase('done');
    setTimeout(() => sfx('unlock'), 200);
    [0, 1, 2].slice(0, r.stars).forEach((i) => setTimeout(() => sfx('star'), 450 + i * 260));
  };

  const revealHint = () => {
    if (hintTier < 2) {
      setHintTier(hintTier + 1);
      setHintsUsed(hintsUsed + 1);
    }
    setShowHint(true);
    sfx('tap');
  };

  if (phase === 'intro') {
    return (
      <div className="screen level-intro" style={{ ['--chapter' as string]: chapter.color }}>
        <header className="topbar">
          <button className="icon-btn" onClick={() => navigate({ name: 'map', chapter: level.chapter })} aria-label="Volver">
            ←
          </button>
          <span className="topbar-title">
            Capítulo {chapter.id} · Nivel {level.id}
          </span>
          <span />
        </header>
        <div className="intro-hero">
          {preview && (
            <div className="intro-diagram">
              <DiagramView diagram={preview} showLabels={false} />
            </div>
          )}
          <MechanicBadge mechanic={level.mechanic} long />
          <h1 className="intro-title">{level.title}</h1>
          <p className="intro-text">{level.intro}</p>
          {prevBest > 0 && (
            <div className="intro-best">
              Mejor resultado: <Stars value={prevBest} />
            </div>
          )}
        </div>
        <div className="sticky-actions">
          <button className="btn primary block lg" onClick={begin} autoFocus>
            {prevBest > 0 ? 'Jugar de nuevo' : 'Empezar'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'done' && result) {
    return <LevelDone level={level} built={built} result={result} mistakes={mistakes} hints={hintsUsed} onLayer={(l) => recordLayer(level.id, l)} />;
  }

  return (
    <div className="screen level-play" style={{ ['--chapter' as string]: chapter.color }}>
      <header className="topbar">
        <button className="icon-btn" onClick={() => navigate({ name: 'map', chapter: level.chapter })} aria-label="Salir del nivel">
          ✕
        </button>
        <div className="step-progress" role="progressbar" aria-valuemin={0} aria-valuemax={level.steps.length} aria-valuenow={stepIdx + (solved ? 1 : 0)}>
          {level.steps.map((s, i) => (
            <span key={s.id} className={i < stepIdx || (i === stepIdx && solved) ? 'done' : i === stepIdx ? 'current' : ''} />
          ))}
        </div>
        <button className={`icon-btn hint-btn ${hintTier > 0 ? 'used' : ''}`} onClick={revealHint} disabled={solved} aria-label="Pista">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V17h5v-1.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z" />
          </svg>
          {hintTier > 0 && <i>{hintTier}</i>}
        </button>
      </header>

      <div className="prompt">
        <MechanicBadge mechanic={level.mechanic} />
        <h2 key={step.id}>{step.prompt}</h2>
      </div>

      {showHint && hintTier > 0 && !solved && (
        <div className="hint-card" role="note">
          <span className="hint-icon" aria-hidden>
            💡
          </span>
          <div>
            <strong>{hintTier === 1 ? 'Pista' : 'La regla'}</strong>
            <p>{step.hints[hintTier - 1]}</p>
            {hintTier === 1 && (
              <button className="link" onClick={revealHint}>
                Necesito más ayuda
              </button>
            )}
          </div>
          <button className="icon-btn sm" onClick={() => setShowHint(false)} aria-label="Cerrar pista">
            ✕
          </button>
        </div>
      )}

      <div className="play-area" key={step.id}>
        <StepPlayer step={step} solved={solved} onMistake={() => setMistakes((m) => m + 1)} onSolved={onSolved} haptics={settings.haptics} />
      </div>

      {solved && (
        <div className="solved-sheet" role="status">
          <div className="solved-inner">
            <div className="solved-head">
              <span className="check" aria-hidden>
                ✓
              </span>
              <div>
                <strong>{isLast ? '¡Nivel superado!' : '¡Correcto!'}</strong>
                {step.solved && <p>{step.solved}</p>}
              </div>
            </div>
            <button className="btn success block lg" onClick={next} autoFocus>
              {isLast ? 'Ver resultado' : 'Continuar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LevelDone({
  level,
  built,
  result,
  mistakes,
  hints,
  onLayer,
}: {
  level: Level;
  built?: Diagram;
  result: LevelResult;
  mistakes: number;
  hints: number;
  onLayer: (l: 'intuitive' | 'scientific' | 'math') => void;
}) {
  const progress = useGame((s) => s.progress);
  const nextLevel = content.levels.find((l) => l.id === level.id + 1);
  const chapterDone = !nextLevel || nextLevel.chapter !== level.chapter;
  const nextChapter = nextLevel && chapterDone ? content.chapters.find((c) => c.id === nextLevel.chapter) : undefined;
  const conceptMap = new Map(content.concepts.map((c) => [c.id, c]));
  const heroDiagram = useMemo(() => built ?? firstDiagram(level), [level, built]);

  useEffect(() => {
    onLayer('intuitive');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen level-done">
      <div className="done-hero">
        <div className="confetti" aria-hidden>
          {Array.from({ length: 18 }).map((_, i) => (
            <i key={i} style={{ ['--k' as string]: i }} />
          ))}
        </div>
        <Stars value={result.stars} size={48} animate />
        <h1>{!nextLevel ? '¡Campaña completada!' : starsTitle(result.stars)}</h1>
        <p className="done-sub">
          {mistakes === 0 ? 'Sin errores' : `${mistakes} ${mistakes === 1 ? 'error' : 'errores'}`} · {hints === 0 ? 'sin pistas' : `${hints} ${hints === 1 ? 'pista' : 'pistas'}`}
          {result.xp > 0 && <span className="xp-chip">+{result.xp} XP</span>}
        </p>
      </div>

      <section className="card success-card">
        {heroDiagram && (
          <div className="done-diagram">
            <DiagramPlayback diagram={heroDiagram} autoPlay />
          </div>
        )}
        <p className="success-text">{level.success}</p>
      </section>

      <section className="card">
        <h3 className="card-title">Comprende</h3>
        <Explanation ex={level.explanation} mathUnlocked={mathUnlocked(progress)} onView={onLayer} />
      </section>

      {result.newConcepts.length > 0 && (
        <section className="card new-concepts">
          <h3 className="card-title">Nuevo en tu colección</h3>
          <div className="concept-chips">
            {result.newConcepts.map((c) => (
              <a key={c} className="concept-chip" href="#/library">
                <span>{conceptMap.get(c)?.symbol ?? '✦'}</span> {conceptMap.get(c)?.title}
              </a>
            ))}
          </div>
        </section>
      )}

      {nextChapter && (
        <section className="card unlock-card" style={{ ['--chapter' as string]: nextChapter.color }}>
          <span className="unlock-label">Capítulo desbloqueado</span>
          <strong>
            {nextChapter.id}. {nextChapter.title}
          </strong>
          <p>{nextChapter.goals}</p>
        </section>
      )}
      {level.id === 5 && <p className="unlock-note">🔓 Has desbloqueado la capa de explicación matemática.</p>}

      <div className="sticky-actions two">
        <button className="btn ghost" onClick={() => navigate({ name: 'map', chapter: level.chapter })}>
          Campaña
        </button>
        {nextLevel ? (
          <button className="btn primary lg" onClick={() => navigate({ name: 'level', id: nextLevel.id })} autoFocus>
            Siguiente nivel →
          </button>
        ) : (
          <button className="btn primary lg" onClick={() => navigate({ name: 'practice' })}>
            Modo Dominio →
          </button>
        )}
      </div>
    </div>
  );
}

function starsTitle(s: number) {
  return s === 3 ? '¡Perfecto!' : s === 2 ? '¡Muy bien!' : '¡Superado!';
}
