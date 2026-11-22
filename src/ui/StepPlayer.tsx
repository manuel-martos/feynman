import { useMemo, useState } from 'react';
import { cloneDiagram, validate, type Diagram, type Issue } from '../engine';
import { issueText } from '../content';
import type { BuildStep, ChoiceStep, Step, TapStep } from '../game/types';
import { sfx } from './audio';
import { DiagramEditor } from './diagram/DiagramEditor';
import { DiagramView } from './diagram/DiagramView';
import { DiagramPlayback } from './diagram/DiagramPlayback';
import { t } from '../i18n';

export interface Feedback {
  tone: 'error' | 'info';
  title: string;
  body: string;
}

export interface StepPlayerProps {
  step: Step;
  solved: boolean;
  onMistake: () => void;
  onSolved: (diagram?: Diagram) => void;
  haptics?: boolean;
}

const buzz = (on?: boolean) => on && navigator.vibrate?.([30, 40, 30]);

export function StepPlayer(props: StepPlayerProps) {
  switch (props.step.kind) {
    case 'tap':
      return <TapPlayer {...props} step={props.step} />;
    case 'choice':
      return <ChoicePlayer {...props} step={props.step} />;
    case 'build':
      return <BuildPlayer {...props} step={props.step} />;
  }
}

function FeedbackBar({ fb }: { fb: Feedback | null }) {
  if (!fb) return <div className="feedback-slot" aria-live="polite" />;
  return (
    <div className="feedback-slot" aria-live="polite">
      <div className={`feedback ${fb.tone}`} key={fb.title + fb.body}>
        <strong>{fb.title}</strong>
        <span>{fb.body}</span>
      </div>
    </div>
  );
}

/* ---------------- Decode: tap elements ---------------- */

function TapPlayer({ step, solved, onMistake, onSolved, haptics }: StepPlayerProps & { step: TapStep }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [fb, setFb] = useState<Feedback | null>(null);
  const targets = useMemo(() => new Set(step.targets), [step.targets]);

  const wrong = (ids: string[], msg: string) => {
    setErrors(new Set(ids));
    setFb({ tone: 'error', title: t.step.wrong, body: msg });
    sfx('error');
    buzz(haptics);
    onMistake();
  };

  const onTap = (id: string) => {
    if (solved) return;
    setErrors(new Set());
    if (step.mode === 'any') {
      if (targets.has(id)) {
        setSelected(new Set([id]));
        setFb(null);
        sfx('select');
        onSolved();
      } else wrong([id], step.wrong?.[id] ?? step.wrongDefault);
      return;
    }
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    setFb(null);
    sfx('select');
  };

  const check = () => {
    const extra = [...selected].filter((id) => !targets.has(id));
    if (extra.length) {
      wrong(extra, step.wrong?.[extra[0]] ?? step.wrongDefault);
      setSelected(new Set([...selected].filter((id) => targets.has(id))));
      return;
    }
    const missing = step.targets.filter((t) => !selected.has(t));
    if (missing.length) {
      setFb({ tone: 'error', title: t.step.missing, body: t.step.missingBody(selected.size, step.targets.length) });
      sfx('error');
      buzz(haptics);
      onMistake();
      return;
    }
    onSolved();
  };

  return (
    <>
      <div className="diagram-card">
        <DiagramView
          diagram={step.diagram}
          tappable={solved ? 'none' : step.tappable}
          onTap={onTap}
          selected={solved ? targets : selected}
          errors={errors}
          success={solved}
        />
        {step.mode === 'all' && !solved && (
          <span className="counter-chip" aria-live="polite">
            {selected.size} seleccionadas
          </span>
        )}
      </div>
      <FeedbackBar fb={fb} />
      {step.mode === 'all' && !solved && (
        <div className="action-row">
          <button className="btn primary block" onClick={check} disabled={selected.size === 0}>
            {t.step.check}
          </button>
        </div>
      )}
      {step.mode === 'any' && !solved && <p className="tap-help">{t.step.tapHelp}</p>}
    </>
  );
}

/* ---------------- Decode: multiple choice ---------------- */

function ChoicePlayer({ step, solved, onMistake, onSolved, haptics }: StepPlayerProps & { step: ChoiceStep }) {
  const [wrongPicks, setWrongPicks] = useState<Set<string>>(new Set());
  const [fb, setFb] = useState<Feedback | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const hasOptionDiagrams = step.options.some((o) => o.diagram);

  const pick = (id: string) => {
    if (solved || wrongPicks.has(id)) return;
    const o = step.options.find((x) => x.id === id)!;
    setPicked(id);
    if (o.correct) {
      setFb(null);
      sfx('select');
      onSolved();
    } else {
      setWrongPicks(new Set([...wrongPicks, id]));
      setFb({ tone: 'error', title: t.step.notQuite, body: o.feedback ?? t.step.thinkAgain });
      sfx('error');
      buzz(haptics);
      onMistake();
    }
  };

  return (
    <>
      {step.diagram && (
        <div className="diagram-card">
          {step.playback ? <DiagramPlayback diagram={step.diagram} /> : <DiagramView diagram={step.diagram} success={solved} />}
        </div>
      )}
      {step.diagrams && (
        <div className={`diagram-grid n${step.diagrams.length}`}>
          {step.diagrams.map((d) => (
            <figure key={d.label} className="diagram-card mini">
              <figcaption>{d.label}</figcaption>
              <DiagramView diagram={d.diagram} compact showLabels={false} />
            </figure>
          ))}
        </div>
      )}
      <FeedbackBar fb={fb} />
      <div className={`choices ${hasOptionDiagrams ? 'with-diagrams' : ''}`} role="list">
        {step.options.map((o, i) => {
          const state = solved && o.correct ? 'is-correct' : wrongPicks.has(o.id) ? 'is-wrong' : '';
          return (
            <button
              key={o.id}
              role="listitem"
              className={`choice ${state} ${picked === o.id ? 'is-picked' : ''}`}
              onClick={() => pick(o.id)}
              disabled={solved || wrongPicks.has(o.id)}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {o.diagram ? (
                <>
                  <span className="choice-key">{o.text}</span>
                  <DiagramView diagram={o.diagram} compact showLabels={false} />
                </>
              ) : (
                <>
                  <span className="choice-key" aria-hidden>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="choice-text">{o.text}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- Build / Debug-fix ---------------- */

function BuildPlayer({ step, solved, onMistake, onSolved, haptics }: StepPlayerProps & { step: BuildStep }) {
  const [diagram, setDiagram] = useState<Diagram>(() => cloneDiagram(step.diagram));
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [fb, setFb] = useState<Feedback | null>(null);

  const onChange = (d: Diagram) => {
    setDiagram(d);
    setErrors(new Set());
    setFb(null);
  };

  const check = () => {
    const r = validate(diagram, step.validation);
    if (r.ok) {
      setErrors(new Set());
      setFb(null);
      onSolved(diagram);
      return;
    }
    const first: Issue = r.issues[0];
    const t = issueText(first);
    setErrors(new Set(r.issues.filter((i) => i.layer === first.layer).flatMap((i) => i.elements)));
    setFb({ tone: 'error', title: t.title, body: t.body });
    sfx('error');
    buzz(haptics);
    onMistake();
  };

  return (
    <>
      {step.reference && (
        <div className="reference">
          <span className="reference-label">{step.reference.label}</span>
          <div className="reference-diagram">
            <DiagramView diagram={step.reference.diagram} compact showLabels={false} />
          </div>
        </div>
      )}
      <div className="diagram-card editor-card">
        <DiagramEditor
          diagram={diagram}
          onChange={onChange}
          palette={step.palette}
          errors={errors}
          success={solved}
          disabled={solved}
          onNotice={(msg) => setFb({ tone: 'info', title: t.step.notice, body: msg })}
          allowParallel={!!step.validation.loops}
        />
      </div>
      <FeedbackBar fb={fb} />
      {!solved && (
        <div className="action-row">
          <button className="btn primary block" onClick={check}>
            {t.step.check}
          </button>
        </div>
      )}
    </>
  );
}
