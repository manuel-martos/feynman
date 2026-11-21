import type { Diagram } from '../../engine';
import type { Level } from '../../game/types';
import { graph, keepEdges, plain, type NodeSpec } from '../diagrams';

/* ---------- e⁻e⁻ → e⁻e⁻γ (bremsstrahlung in Møller scattering) ---------- */

const BREMS_NODES: Record<string, NodeSpec> = {
  in1: ['in', 8, 10, 'e-', '1'],
  in2: ['in', 8, 62, 'e-', '2'],
  out1: ['out', 92, 8, 'e-', '3'],
  g: ['out', 92, 32, 'gamma'],
  out2: ['out', 92, 62, 'e-', '4'],
  vA: ['vertex', 38, 18],
  vE: ['vertex', 66, 13],
  vB: ['vertex', 38, 54],
};

/** Electron 1 exchanges a photon with electron 2, then radiates a real photon. */
export const bremsAfter = (): Diagram =>
  graph(BREMS_NODES, ['in1>vA', 'vA>vE', 'vE>out1', 'vE~g', 'vA~vB', 'in2>vB', 'vB>out2']);

/** Electron 2 radiates the real photon before the exchange. */
export const bremsBefore = (): Diagram =>
  graph(
    {
      in1: ['in', 8, 10, 'e-', '1'],
      in2: ['in', 8, 62, 'e-', '2'],
      out1: ['out', 92, 10, 'e-', '3'],
      g: ['out', 92, 38, 'gamma'],
      out2: ['out', 92, 64, 'e-', '4'],
      vA: ['vertex', 60, 18],
      vE: ['vertex', 32, 58],
      vB: ['vertex', 60, 56],
    },
    ['in1>vA', 'vA>out1', 'vA~vB', 'in2>vE', 'vE>vB', 'vE~g@-0.25', 'vB>out2'],
  );

/* ---------- e⁻e⁺ → γγγ ---------- */

const THREE_NODES: Record<string, NodeSpec> = {
  in1: ['in', 8, 12, 'e-'],
  in2: ['in', 8, 60, 'e+'],
  out1: ['out', 92, 8, 'gamma', '1'],
  out2: ['out', 92, 36, 'gamma', '2'],
  out3: ['out', 92, 64, 'gamma', '3'],
  v1: ['vertex', 42, 16],
  v2: ['vertex', 54, 36],
  v3: ['vertex', 42, 56],
};

export const threePhotons = (): Diagram =>
  graph(THREE_NODES, ['in1>v1', 'v1>v2', 'v2>v3', 'v3>in2', 'v1~out1', 'v2~out2', 'v3~out3']);

/** The same process with photons 1 and 2 swapped along the electron line. */
export const threePhotonsSwapped = (): Diagram =>
  graph(THREE_NODES, ['in1>v1', 'v1>v2', 'v2>v3', 'v3>in2', 'v1~out2', 'v2~out1', 'v3~out3']);

export const chapter6: Level[] = [
  {
    id: 25,
    chapter: 6,
    title: 'Un fotón de regalo',
    mechanic: 'build',
    intro:
      'Cuando dos electrones chocan, a veces sale despedido un fotón extra: la radiación de frenado. Ya no basta con dos vértices.',
    steps: [
      {
        id: 'build',
        kind: 'build',
        prompt: 'Construye e⁻e⁻ → e⁻e⁻γ usando los tres vértices: los electrones intercambian un fotón y el de arriba emite después un fotón real.',
        diagram: keepEdges(bremsAfter(), []),
        palette: ['fermion', 'photon'],
        validation: { kinematics: true },
        hints: [
          'Sigue la línea del electrón 1: entra, interactúa, emite y sale. Cada parada es un vértice.',
          'Arriba: 1 → vértice izquierdo → vértice derecho → 3. El vértice derecho emite el fotón real; el izquierdo intercambia un fotón con el electrón 2.',
        ],
      },
      {
        id: 'order',
        kind: 'choice',
        prompt: 'Este proceso tiene un vértice más que la dispersión de Møller. ¿Cómo cambia su probabilidad?',
        options: [
          { id: 'same', text: 'Es igual de probable', feedback: 'Cada vértice añade un factor e a la amplitud: no puede ser igual.' },
          { id: 'alpha', text: 'Es unas 137 veces menos probable (un factor α)', correct: true, feedback: 'La amplitud gana un factor e; la probabilidad, e², es decir, α ≈ 1/137.' },
          { id: 'more', text: 'Es más probable, porque hay más partículas', feedback: 'Más vértices significa más factores de e, y e es pequeña.' },
        ],
        hints: ['Amplitud ∝ eⁿ, con n el número de vértices.', 'La probabilidad es |𝓜|²: cada vértice extra la multiplica por e², que es proporcional a α.'],
      },
    ],
    success: 'Has construido tu primer diagrama de tres vértices: un proceso con radiación.',
    explanation: {
      intuitive: 'Una carga que cambia bruscamente de dirección emite luz. Aquí, la luz sale del electrón que acaba de recibir el empujón.',
      scientific:
        'Es la radiación de frenado (bremsstrahlung) en la dispersión de Møller. Es un proceso de orden e³ en la amplitud: está suprimido por un factor α respecto a la dispersión sin fotón, pero domina la pérdida de energía de electrones rápidos en la materia.',
      math: '𝓜 ∝ e³. dσ(ee → eeγ) ∼ α · dσ(ee → ee) · (factor de emisión), con dσ ∝ α³ en total.',
    },
    concepts: ['bremsstrahlung'],
  },
  {
    id: 26,
    chapter: 6,
    title: '¿Cuántas historias?',
    mechanic: 'decode',
    intro: 'Con tres vértices, el fotón extra puede salir de muchos sitios. Antes de calcular, un físico cuenta todas las historias posibles.',
    steps: [
      {
        id: 'when',
        kind: 'choice',
        prompt: 'Reproduce el diagrama en el tiempo. ¿Cuándo se emite el fotón real?',
        diagram: plain(bremsAfter()),
        playback: true,
        options: [
          { id: 'before', text: 'Antes del intercambio', feedback: 'Mira el orden de los vértices: el fotón real sale del último.' },
          { id: 'after', text: 'Después del intercambio', correct: true },
          { id: 'never', text: 'No hay fotón real, solo el virtual', feedback: 'La línea ondulada que acaba en el borde derecho es un fotón real que sale.' },
        ],
        hints: ['Pulsa ▶ y observa qué vértice se enciende al final.', 'El vértice de la derecha, que emite el fotón real, es el último en el tiempo.'],
      },
      {
        id: 'where',
        kind: 'tap',
        prompt: 'En esta otra historia, toca el vértice donde nace el fotón real.',
        diagram: plain(bremsBefore()),
        targets: ['vE'],
        mode: 'any',
        tappable: 'nodes',
        wrong: { vA: 'En ese vértice se emite el fotón virtual que intercambian los electrones.', vB: 'Ese vértice absorbe el fotón virtual.' },
        wrongDefault: 'Busca un vértice: los puntos de los bordes son partículas externas.',
        hints: ['Sigue la línea ondulada que acaba en el borde.', 'Está en la línea del electrón 2, antes del intercambio.'],
        solved: 'Aquí el electrón 2 radia antes de interactuar. Es otra contribución al mismo proceso.',
      },
      {
        id: 'count',
        kind: 'choice',
        prompt: 'El fotón real puede salir de cualquiera de las 4 líneas de electrón, y hay 2 formas de emparejar los electrones (t y u). ¿Cuántos diagramas de orden árbol tiene e⁻e⁻ → e⁻e⁻γ?',
        options: [
          { id: '2', text: '2' },
          { id: '4', text: '4', feedback: 'Eso solo cuenta un emparejamiento. Recuerda los canales t y u.' },
          { id: '8', text: '8', correct: true, feedback: '4 líneas donde enganchar el fotón × 2 canales = 8 historias.' },
          { id: '16', text: '16', feedback: 'El fotón no puede salir de la línea virtual: un fotón no tiene carga y no emite otro fotón.' },
        ],
        hints: ['Multiplica las posibilidades independientes.', '4 líneas externas de electrón × 2 emparejamientos.'],
      },
    ],
    success: 'Contar bien las historias es el primer paso de cualquier cálculo real.',
    explanation: {
      intuitive: 'Cada lugar donde puede nacer el fotón es una historia distinta. La naturaleza las recorre todas a la vez.',
      scientific:
        'Hay 8 diagramas de orden árbol para e⁻e⁻ → e⁻e⁻γ: el fotón se engancha a cualquiera de las 4 líneas de electrón externas, en los canales t y u. Las 8 amplitudes se suman (con el signo relativo de Pauli entre t y u) antes de elevar al cuadrado.',
      math: '𝓜 = Σᵢ 𝓜ᵢ, con 8 términos ∝ e³. El juego lo comprueba enumerando todos los árboles trivalentes con 5 hojas que cumplen la regla del vértice.',
    },
    concepts: [],
  },
  {
    id: 27,
    chapter: 6,
    title: 'Tres destellos',
    mechanic: 'build',
    intro: 'El positronio es un átomo efímero: un electrón y un positrón orbitando entre sí. Una de sus formas muere emitiendo tres fotones.',
    steps: [
      {
        id: 'build',
        kind: 'build',
        prompt: 'Construye e⁻e⁺ → γγγ. Una sola línea de fermión recorre los tres vértices y cada vértice emite un fotón.',
        diagram: keepEdges(threePhotons(), []),
        palette: ['fermion', 'photon'],
        validation: { kinematics: true },
        hints: [
          'La flecha entra por el electrón, pasa por los tres vértices y sale hacia el positrón.',
          'Electrón → vértice de arriba → vértice central → vértice de abajo → positrón (flecha hacia el positrón). Un fotón en cada vértice.',
        ],
      },
      {
        id: 'count',
        kind: 'choice',
        prompt: 'Los tres fotones son idénticos. ¿Cuántos diagramas distintos hay, cambiando qué fotón sale de cada vértice?',
        options: [
          { id: '1', text: '1', feedback: 'Prueba a intercambiar dos fotones: conecta las mismas partículas de otra forma.' },
          { id: '3', text: '3' },
          { id: '6', text: '6', correct: true, feedback: '3 · 2 · 1 = 6 formas de repartir tres fotones entre tres vértices.' },
          { id: '9', text: '9' },
        ],
        hints: ['El primer vértice puede emitir cualquiera de los 3 fotones; el segundo, cualquiera de los 2 restantes.', '3! = 3 · 2 · 1.'],
      },
    ],
    success: 'Has dibujado la desintegración del orto-positronio.',
    explanation: {
      intuitive: 'La materia y la antimateria se encuentran y se convierten en tres destellos de luz.',
      scientific:
        'El positronio con espines paralelos (orto-positronio) no puede desintegrarse en dos fotones: la simetría de conjugación de carga lo prohíbe. Por eso emite tres, vive unas mil veces más que el para-positronio (que emite dos) y su ritmo de desintegración es un test de precisión de la QED.',
      math: '6 diagramas, cada uno ∝ e³. Γ(o-Ps → 3γ) ∝ α⁶ mₑ, frente a Γ(p-Ps → 2γ) ∝ α⁵ mₑ.',
    },
    concepts: ['positronium'],
  },
  {
    id: 28,
    chapter: 6,
    title: 'Permutaciones',
    mechanic: 'build',
    intro: 'Los fotones idénticos no tienen nombre propio. Intercambiarlos da otra historia que también cuenta.',
    steps: [
      {
        id: 'other',
        kind: 'build',
        prompt: 'Construye una contribución a e⁻e⁺ → γγγ distinta de la de referencia.',
        diagram: keepEdges(threePhotons(), ['in1', 'in2', 'v1-v2', 'v2-v3']),
        reference: { label: 'Referencia', diagram: plain(threePhotons()) },
        palette: ['photon'],
        validation: { kinematics: true, differentFrom: [threePhotons()] },
        hints: ['La línea del electrón ya está. Solo tienes que decidir qué fotón sale de cada vértice.', 'Intercambia dos fotones respecto a la referencia: por ejemplo, el 1 desde el vértice central y el 2 desde el de arriba.'],
      },
      {
        id: 'sign',
        kind: 'choice',
        prompt: 'En Møller, los dos diagramas se restaban. ¿Cómo se combinan estas seis contribuciones con fotones idénticos?',
        options: [
          { id: 'plus', text: 'Se suman todas con el mismo signo', correct: true, feedback: 'Los fotones son bosones: intercambiarlos no cambia el signo de la amplitud.' },
          { id: 'minus', text: 'Se alternan los signos, como en Møller', feedback: 'El signo menos aparece al intercambiar fermiones idénticos, no bosones.' },
          { id: 'one', text: 'Solo cuenta una, porque los fotones son iguales', feedback: 'Precisamente porque son indistinguibles, todas las historias contribuyen.' },
        ],
        hints: ['¿Los fotones son fermiones o bosones?', 'El signo menos de Pauli solo aparece con fermiones idénticos.'],
      },
    ],
    success: 'Ya distingues cómo se combinan bosones y fermiones idénticos.',
    explanation: {
      intuitive: 'Intercambiar dos fotones idénticos da una historia nueva, igual de válida, que se suma a las demás.',
      scientific:
        'Para bosones idénticos la amplitud es simétrica bajo intercambio: las 6 permutaciones se suman con signo +. Para fermiones idénticos es antisimétrica (el signo − de Møller). Esta diferencia explica la estadística de Bose–Einstein y el principio de exclusión de Pauli.',
      math: '𝓜 = Σ_{σ ∈ S₃} 𝓜(k_σ(1), k_σ(2), k_σ(3)), con signo + para todos los términos.',
    },
    concepts: ['bosons'],
  },
];
