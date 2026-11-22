import { useState } from 'react';
import { plain, process } from '../../content/diagrams';
import { useGame } from '../../game/store';
import { sfx } from '../audio';
import { Logo } from '../components/Logo';
import { DiagramView } from '../diagram/DiagramView';
import { navigate } from '../router';
import { t } from '../../i18n';

const moller = plain(process('moller', 't'));

const LegendLine = ({ kind, label, desc }: { kind: 'electron' | 'positron' | 'photon'; label: string; desc: string }) => (
  <li className={`legend ${kind}`}>
    <svg viewBox="0 0 60 16" aria-hidden>
      {kind === 'photon' ? (
        <path d="M4 8 q3.5 -6 7 0 t7 0 t7 0 t7 0 t7 0 t7 0 t7 0" />
      ) : (
        <>
          <path d="M4 8 H56" />
          <path className="fill" d={kind === 'electron' ? 'M36 8 L26 3 L26 13 Z' : 'M24 8 L34 3 L34 13 Z'} />
        </>
      )}
    </svg>
    <div>
      <strong>{label}</strong>
      <span>{desc}</span>
    </div>
  </li>
);

const ART = [
  {
    art: () => (
      <div className="onb-art">
        <DiagramView diagram={moller} showLabels={false} />
      </div>
    ),
  },
  {
    art: () => (
      <ul className="legend-list">
        <LegendLine kind="electron" {...t.onboarding.electron} />
        <LegendLine kind="positron" {...t.onboarding.positron} />
        <LegendLine kind="photon" {...t.onboarding.photon} />
      </ul>
    ),
  },
  {
    art: () => (
      <ol className="loop-list">
        {t.onboarding.loop.map((s, k) => (
          <li key={s}><b>{k + 1}</b> {s}</li>
        ))}
      </ol>
    ),
  },
];

export function Onboarding() {
  const [i, setI] = useState(0);
  const finish = useGame((s) => s.finishOnboarding);
  const slide = { ...t.onboarding.slides[i], ...ART[i] };
  const last = i === ART.length - 1;

  const done = () => {
    finish();
    sfx('unlock');
    navigate({ name: 'level', id: 1 });
  };

  return (
    <div className="screen onboarding">
      <div className="onb-top">
        <Logo size={36} />
        <button className="link" onClick={() => (finish(), navigate({ name: 'home' }))}>
          {t.onboarding.skip}
        </button>
      </div>
      <div className="onb-slide" key={i}>
        {slide.art()}
        <h1>{slide.title}</h1>
        <p>{slide.body}</p>
      </div>
      <div className="onb-dots" aria-hidden>
        {ART.map((_, k) => (
          <i key={k} className={k === i ? 'on' : ''} />
        ))}
      </div>
      <div className="sticky-actions">
        <button className="btn primary block lg" onClick={() => (last ? done() : (setI(i + 1), sfx('tap')))} autoFocus>
          {last ? t.onboarding.startLevel1 : t.onboarding.next}
        </button>
      </div>
    </div>
  );
}
