import { useState } from 'react';
import { plain, process } from '../../content/diagrams';
import { useGame } from '../../game/store';
import { sfx } from '../audio';
import { Logo } from '../components/Logo';
import { DiagramView } from '../diagram/DiagramView';
import { navigate } from '../router';

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

const SLIDES = [
  {
    title: 'El universo tiene un idioma',
    body: 'Richard Feynman inventó una forma de dibujar cómo interactúan las partículas. Con estos dibujos los físicos calculan desde el color del cielo hasta lo que ocurre en el CERN.',
    art: () => (
      <div className="onb-art">
        <DiagramView diagram={moller} showLabels={false} />
      </div>
    ),
  },
  {
    title: 'Tres letras para empezar',
    body: 'Cada línea es una partícula. El tiempo avanza de izquierda a derecha.',
    art: () => (
      <ul className="legend-list">
        <LegendLine kind="electron" label="Electrón e⁻" desc="Recta, flecha a favor del tiempo" />
        <LegendLine kind="positron" label="Positrón e⁺" desc="Recta, flecha contra el tiempo" />
        <LegendLine kind="photon" label="Fotón γ" desc="Ondulada: la partícula de la luz" />
      </ul>
    ),
  },
  {
    title: 'Aprende haciendo',
    body: 'Descifra diagramas, constrúyelos con tus manos y caza errores. Cada reto dura entre 2 y 5 minutos, y la física te explica por qué tu solución funciona.',
    art: () => (
      <ol className="loop-list">
        <li><b>1</b> Observa</li>
        <li><b>2</b> Experimenta</li>
        <li><b>3</b> Comprende</li>
        <li><b>4</b> Progresa</li>
      </ol>
    ),
  },
];

export function Onboarding() {
  const [i, setI] = useState(0);
  const finish = useGame((s) => s.finishOnboarding);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

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
          Saltar
        </button>
      </div>
      <div className="onb-slide" key={i}>
        {slide.art()}
        <h1>{slide.title}</h1>
        <p>{slide.body}</p>
      </div>
      <div className="onb-dots" aria-hidden>
        {SLIDES.map((_, k) => (
          <i key={k} className={k === i ? 'on' : ''} />
        ))}
      </div>
      <div className="sticky-actions">
        <button className="btn primary block lg" onClick={() => (last ? done() : (setI(i + 1), sfx('tap')))} autoFocus>
          {last ? 'Empezar el nivel 1' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}
