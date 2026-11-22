import { useState } from 'react';
import { practiceSession } from '../../content';
import { mathUnlocked, useGame } from '../../game/store';
import type { Step } from '../../game/types';
import { sfx } from '../audio';
import { navigate } from '../router';
import { StepPlayer } from '../StepPlayer';
import { t } from '../../i18n';

export function Practice() {
  const { progress, recordMastery, settings } = useGame();
  const done = Object.keys(progress).length;
  const [steps, setSteps] = useState<Step[]>(() => practiceSession(done));
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState(false);
  const [firstTry, setFirstTry] = useState(0);
  const [missed, setMissed] = useState(false);
  const [finished, setFinished] = useState(false);

  if (!mathUnlocked(progress)) {
    return (
      <div className="screen center">
        <p>{t.practice.locked}</p>
        <button className="btn primary" onClick={() => navigate({ name: 'map' })}>
          {t.practice.toCampaign}
        </button>
      </div>
    );
  }

  const step = steps[idx];

  const next = () => {
    const ok = firstTry + (missed ? 0 : 1);
    if (idx === steps.length - 1) {
      setFirstTry(ok);
      recordMastery(ok, steps.length);
      setFinished(true);
      sfx('unlock');
      return;
    }
    setFirstTry(ok);
    setIdx(idx + 1);
    setSolved(false);
    setMissed(false);
  };

  const again = () => {
    setSteps(practiceSession(done));
    setIdx(0);
    setSolved(false);
    setMissed(false);
    setFirstTry(0);
    setFinished(false);
  };

  if (finished) {
    const pct = Math.round((firstTry / steps.length) * 100);
    return (
      <div className="screen level-done">
        <div className="done-hero">
          <div className="mastery-ring" style={{ ['--p' as string]: pct }}>
            <strong>{pct}%</strong>
          </div>
          <h1>{pct === 100 ? t.practice.total : pct >= 66 ? t.practice.good : t.practice.keepGoing}</h1>
          <p className="done-sub">
            {t.practice.firstTry(firstTry, steps.length)}
          </p>
        </div>
        <div className="sticky-actions two">
          <button className="btn ghost" onClick={() => navigate({ name: 'home' })}>
            {t.practice.home}
          </button>
          <button className="btn primary lg" onClick={again}>
            {t.practice.again}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen level-play" style={{ ['--chapter' as string]: 'var(--accent)' }}>
      <header className="topbar">
        <button className="icon-btn" onClick={() => navigate({ name: 'home' })} aria-label={t.practice.exit}>
          ✕
        </button>
        <div className="step-progress">
          {steps.map((s, i) => (
            <span key={s.id} className={i < idx || (i === idx && solved) ? 'done' : i === idx ? 'current' : ''} />
          ))}
        </div>
        <span className="badge mech-mastery">{t.practice.badge}</span>
      </header>
      <div className="prompt">
        <h2 key={step.id}>{step.prompt}</h2>
      </div>
      <div className="play-area" key={step.id}>
        <StepPlayer
          step={step}
          solved={solved}
          haptics={settings.haptics}
          onMistake={() => setMissed(true)}
          onSolved={() => {
            setSolved(true);
            sfx('success');
          }}
        />
      </div>
      {solved && (
        <div className="solved-sheet" role="status">
          <div className="solved-inner">
            <div className="solved-head">
              <span className="check" aria-hidden>
                ✓
              </span>
              <div>
                <strong>{missed ? t.practice.solved : t.practice.solvedFirstTry}</strong>
                {step.solved && <p>{step.solved}</p>}
              </div>
            </div>
            <button className="btn success block lg" onClick={next} autoFocus>
              {t.practice.next}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
