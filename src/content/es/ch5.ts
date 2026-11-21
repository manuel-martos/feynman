import type { Diagram } from '../../engine';
import type { Level } from '../../game/types';
import { patchEdges, plain, process, puzzle, withTags } from '../diagrams';
import { bhabhaS, bhabhaT } from './ch4';

const TAGS = { in1: '1', in2: '2', out1: '3', out2: '4' };

/** Compton diagram with two errors: reversed internal arrow, fermion where a photon should be. */
export const brokenCompton = (): Diagram =>
  patchEdges(process('compton', 's'), {
    int: { from: 'vB', to: 'vA', locked: false },
    out2: { type: 'fermion', from: 'vB', to: 'out2', locked: false },
  });

/** A bogus u-channel for Bhabha: charge flow broken at both vertices. */
export const bogusBhabhaU = (): Diagram => {
  const base = withTags(plain(process('moller', 'u')), TAGS);
  return {
    nodes: base.nodes,
    edges: [
      { id: 'in1', type: 'fermion', from: 'in1', to: 'vA' },
      { id: 'out2', type: 'fermion', from: 'out2', to: 'vA' },
      { id: 'int', type: 'photon', from: 'vA', to: 'vB' },
      { id: 'in2', type: 'fermion', from: 'vB', to: 'in2' },
      { id: 'out1', type: 'fermion', from: 'vB', to: 'out1' },
    ],
  };
};

export const chapter5: Level[] = [
  {
    id: 21,
    chapter: 5,
    title: 'Diagnóstico',
    mechanic: 'debug',
    intro: 'Bienvenido al desafío final. Ya no hay instrucciones paso a paso. Este diagrama de dispersión Compton tiene dos errores.',
    steps: [
      {
        id: 'fix',
        kind: 'build',
        prompt: 'Corrige el diagrama para que sea una contribución válida a e⁻γ → e⁻γ. Puedes invertir, borrar y redibujar las líneas editables.',
        diagram: brokenCompton(),
        palette: ['fermion', 'photon'],
        validation: { kinematics: true },
        hints: ['Comprueba la regla QED en cada vértice: un fotón, una flecha que entra y una que sale.', 'La salida de abajo debe ser un fotón, y la flecha interna debe ir de izquierda a derecha.'],
      },
    ],
    success: 'Diagnóstico perfecto. Has reparado un diagrama sin ayuda.',
    explanation: {
      intuitive: 'Primero encuentras qué regla se rompe y después lo reparas: así se depura cualquier sistema.',
      scientific:
        'El diagrama corregido es la contribución de canal s a la dispersión Compton. La flecha interna continúa el flujo del electrón entrante, y cada vértice tiene exactamente un fotón.',
      math: '𝓜_s ∝ e² ε*_ν(k′) ū(p′) γ^ν [(p̸ + k̸ + m)/((p + k)² − m²)] γ^μ u(p) ε_μ(k).',
    },
    concepts: [],
  },
  {
    id: 22,
    chapter: 5,
    title: 'Luz que se hace materia',
    mechanic: 'build',
    intro: 'Dos fotones chocan y, de pura luz, nace un electrón y un positrón. Constrúyelo sin ayuda.',
    steps: [
      {
        id: 'build',
        kind: 'build',
        prompt: 'Construye un diagrama de orden árbol para γγ → e⁻e⁺.',
        diagram: puzzle(process('pairProduction', 't'), []),
        palette: ['fermion', 'photon'],
        validation: { kinematics: true },
        hints: ['Cada fotón inicial va a un vértice distinto.', 'El electrón sale del vértice de arriba, el positrón «entra» en el de abajo (flecha hacia el vértice) y un electrón virtual une los vértices.'],
      },
      {
        id: 'amplitude',
        kind: 'choice',
        prompt: 'Tu diagrama tiene dos vértices. ¿A qué potencia de la carga e es proporcional su amplitud 𝓜?',
        options: [
          { id: 'e', text: 'e' },
          { id: 'e2', text: 'e²', correct: true, feedback: 'Un factor e por vértice.' },
          { id: 'e4', text: 'e⁴', feedback: 'Ese es el orden de la probabilidad, que va como |𝓜|².' },
        ],
        hints: ['Cada vértice aporta un factor e.', 'Cuenta los vértices.'],
      },
      {
        id: 'probability',
        kind: 'choice',
        prompt: 'La probabilidad del proceso es proporcional a |𝓜|². ¿A qué es proporcional?',
        options: [
          { id: 'e2', text: 'e², es decir, α' },
          { id: 'e4', text: 'e⁴, es decir, α²', correct: true, feedback: 'Con α ≈ 1/137, cada par de vértices extra suprime la probabilidad unas 137 veces. Por eso funciona la teoría de perturbaciones.' },
          { id: 'e8', text: 'e⁸' },
        ],
        hints: ['Eleva al cuadrado lo que obtuviste antes.', 'La constante de estructura fina es α = e²/(4πε₀ħc) ≈ 1/137.'],
      },
    ],
    success: 'Has creado materia a partir de luz y has calculado su orden perturbativo.',
    explanation: {
      intuitive: 'La energía de la luz puede convertirse en materia y antimateria: E = mc² en acción.',
      scientific:
        'Es el proceso de Breit–Wheeler (γγ → e⁻e⁺), el cruce de la aniquilación en dos fotones. Tiene dos diagramas de orden árbol (canales t y u). Necesita fotones con energía total suficiente para crear dos masas de electrón.',
      math: 'σ ∝ α² · f(s/m²). Cada orden adicional de la teoría de perturbaciones (dos vértices más, con un bucle) aporta un factor α ≈ 1/137.',
    },
    concepts: ['pair-production', 'order'],
  },
  {
    id: 23,
    chapter: 5,
    title: 'El juicio',
    mechanic: 'debug',
    intro: 'Tres candidatos a contribuir a la dispersión de Bhabha (e⁻e⁺ → e⁻e⁺). Uno de ellos es un impostor.',
    steps: [
      {
        id: 'impostor',
        kind: 'choice',
        prompt: '¿Cuál NO es una contribución válida a e⁻e⁺ → e⁻e⁺?',
        options: [
          { id: 'A', text: 'A', diagram: bhabhaS(), feedback: 'A es el canal s, la aniquilación: es válido.' },
          { id: 'B', text: 'B', diagram: bhabhaT(), feedback: 'B es el canal t, la dispersión: es válido.' },
          { id: 'C', text: 'C', diagram: bogusBhabhaU(), correct: true, feedback: 'En C, el electrón inicial y el positrón final comparten vértice y las flechas no fluyen.' },
        ],
        hints: ['Revisa las flechas en cada vértice de cada candidato.', 'Busca un vértice al que lleguen dos flechas.'],
      },
      {
        id: 'where',
        kind: 'tap',
        prompt: 'Toca un vértice del impostor donde se rompe la regla de QED.',
        diagram: bogusBhabhaU(),
        targets: ['vA', 'vB'],
        mode: 'any',
        tappable: 'nodes',
        wrongDefault: 'Ese punto es una partícula externa. Busca los vértices.',
        hints: ['En este caso, los dos vértices fallan.', 'En el de arriba entran dos flechas; en el de abajo salen dos.'],
        solved: 'Ahí falla: en un vértice, una flecha debe entrar y otra salir. La carga no se conserva.',
      },
    ],
    success: 'Has juzgado diagramas como un físico: con las reglas, no con la intuición visual.',
    explanation: {
      intuitive: 'Un dibujo puede parecer razonable y estar prohibido. Las reglas no fallan.',
      scientific:
        'Para e⁻e⁺ → e⁻e⁺, el emparejamiento «u» une el e⁻ inicial con el e⁺ final. El e⁻ que entra lleva carga −1 al vértice y el e⁺ que sale se lleva +1, así que la línea interna tendría que transportar carga −2. Un fotón es neutro, así que ese diagrama no existe. Visualmente, dos flechas entran en el mismo vértice.',
      math: 'La conservación de la corriente en cada vértice anula cualquier término de este tipo en la expansión perturbativa: solo 𝓜_s y 𝓜_t contribuyen.',
    },
    concepts: [],
  },
  {
    id: 24,
    chapter: 5,
    title: 'Gran final: Møller completo',
    mechanic: 'build',
    intro: 'El examen final de un estudiante de física de partículas: escribir todos los diagramas de orden árbol de la dispersión electrón–electrón y decir cómo se combinan.',
    steps: [
      {
        id: 't',
        kind: 'build',
        prompt: 'Construye la contribución del canal t: 1 → 3 y 2 → 4.',
        diagram: withTags(puzzle(process('moller', 't'), []), TAGS),
        palette: ['fermion', 'photon'],
        validation: { kinematics: true, channel: 't' },
        hints: ['1 y 3 comparten vértice; 2 y 4, el otro.', 'Un fotón entre los vértices.'],
      },
      {
        id: 'u',
        kind: 'build',
        prompt: 'Ahora la contribución cruzada, la del canal u: 1 → 4 y 2 → 3.',
        diagram: withTags(puzzle(process('moller', 'u'), []), TAGS),
        palette: ['fermion', 'photon'],
        validation: { kinematics: true, channel: 'u' },
        hints: ['Las líneas tendrán que cruzarse.', '1 y 4 al vértice de arriba; 2 y 3 al de abajo.'],
      },
      {
        id: 'sign',
        kind: 'choice',
        prompt: 'Para obtener la amplitud total hay que combinar los dos diagramas. Como los electrones son fermiones idénticos, ¿cómo se combinan?',
        diagrams: [
          { label: 't', diagram: withTags(plain(process('moller', 't')), TAGS) },
          { label: 'u', diagram: withTags(plain(process('moller', 'u')), TAGS) },
        ],
        options: [
          { id: 'minus', text: 'Se restan sus amplitudes: 𝓜 = 𝓜_t − 𝓜_u', correct: true, feedback: 'Intercambiar dos fermiones idénticos cambia el signo de la amplitud (principio de exclusión de Pauli).' },
          { id: 'probs', text: 'Se suman sus probabilidades por separado', feedback: 'En mecánica cuántica se suman amplitudes, no probabilidades, y por eso aparecen interferencias.' },
          { id: 'simple', text: 'Solo cuenta el más sencillo', feedback: 'Los dos son igual de sencillos (dos vértices) y contribuyen al mismo orden e².' },
        ],
        hints: ['En cuántica se suman amplitudes, no probabilidades.', 'Los fermiones son antisimétricos bajo intercambio.'],
      },
    ],
    success: 'Dominas el orden árbol: lees, construyes y juzgas diagramas de Feynman. Ahora empieza lo de verdad: más vértices y bucles cuánticos.',
    explanation: {
      intuitive: 'Dos historias indistinguibles producen el mismo resultado final, y la naturaleza las combina con un signo menos que viene de la propia esencia de los electrones.',
      scientific:
        'La amplitud de Møller a orden árbol es la diferencia de los canales t y u. La interferencia entre ambos es una predicción medible, confirmada experimentalmente, y una consecuencia directa del principio de Pauli.',
      math: '𝓜 = e² { [ū₃γ^μu₁][ū₄γ_μu₂]/t − [ū₄γ^μu₁][ū₃γ_μu₂]/u }, con t = (p₁ − p₃)² y u = (p₁ − p₄)².',
    },
    concepts: ['interference'],
  },
];
