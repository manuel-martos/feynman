import type { Diagram } from '../../engine';
import type { Level } from '../../game/types';
import { move, patchEdges, plain, process, puzzle, withTags } from '../diagrams';

const TAGS = { in1: '1', in2: '2', out1: '3', out2: '4' };

export const mollerT = () => withTags(plain(process('moller', 't')), TAGS);
export const mollerU = () => withTags(plain(process('moller', 'u')), TAGS);

/** Same topology as mollerT, drawn differently. */
export const mollerTRedrawn = (): Diagram =>
  patchEdges(move(mollerT(), { vA: [34, 26], vB: [66, 46], in1: [8, 20], out1: [92, 6], in2: [8, 66], out2: [92, 50] }), {
    int: { bend: 0.25 },
  });

export const bhabhaT = () => withTags(plain(process('bhabha', 't')), TAGS);
export const bhabhaS = () => withTags(plain(process('bhabha', 's')), TAGS);

export const chapter4: Level[] = [
  {
    id: 17,
    chapter: 4,
    title: 'Mismo diagrama, otro dibujo',
    mechanic: 'decode',
    intro: 'Hemos numerado las partículas: 1 y 2 entran, 3 y 4 salen. Dos dibujos distintos ¿son dos diagramas distintos? Decide qué importa de verdad.',
    steps: [
      {
        id: 'same',
        kind: 'choice',
        prompt: '¿Representan A y B el mismo diagrama de Feynman?',
        diagrams: [
          { label: 'A', diagram: mollerT() },
          { label: 'B', diagram: mollerTRedrawn() },
        ],
        options: [
          { id: 'yes', text: 'Sí: conectan las mismas partículas a los mismos vértices', correct: true, feedback: 'La forma del dibujo no importa: solo la topología, es decir, qué se conecta con qué.' },
          { id: 'no', text: 'No: en B el fotón está inclinado y curvado', feedback: 'La geometría no tiene significado. Mover vértices o curvar líneas no cambia el diagrama.' },
        ],
        hints: ['Sigue cada número hasta su vértice.', 'En ambos, 1 y 3 comparten vértice, y 2 y 4 también.'],
      },
      {
        id: 'different',
        kind: 'choice',
        prompt: '¿Y estos dos? ¿Son el mismo diagrama?',
        diagrams: [
          { label: 'A', diagram: mollerT() },
          { label: 'C', diagram: mollerU() },
        ],
        options: [
          { id: 'no', text: 'No: en C el electrón 1 comparte vértice con la salida 4', correct: true, feedback: 'Cambia qué partícula final está conectada con cada inicial: es otra contribución distinta.' },
          { id: 'yes', text: 'Sí: ambos tienen dos vértices y un fotón', feedback: 'Tener las mismas piezas no basta: importa cómo se conectan. En C las líneas se cruzan y 1 acaba en 4.' },
        ],
        hints: ['Mira con qué salida comparte vértice la partícula 1 en cada dibujo.', 'En A, 1 va con 3. En C, 1 va con 4.'],
      },
    ],
    success: 'Has descubierto la topología: un diagrama es una red de conexiones, no un dibujo.',
    explanation: {
      intuitive: 'Como en un mapa de metro, puedes estirar y doblar las líneas sin cambiar nada mientras las conexiones sean las mismas.',
      scientific:
        'Dos diagramas son equivalentes si existe una correspondencia entre sus vértices que conserva las conexiones, los tipos de línea y las partículas externas. Los diagramas topológicamente distintos son contribuciones distintas a la amplitud.',
      math: 'La amplitud total es la suma sobre todos los diagramas topológicamente distintos: 𝓜 = Σ 𝓜_i. Contar dos veces el mismo diagrama daría un resultado erróneo.',
    },
    concepts: ['topology'],
  },
  {
    id: 18,
    chapter: 4,
    title: 'El otro camino',
    mechanic: 'build',
    intro: 'Los electrones son idénticos: es imposible saber si el electrón 1 acabó en la salida 3 o en la 4. La naturaleza tiene en cuenta ambas posibilidades.',
    steps: [
      {
        id: 'u',
        kind: 'build',
        prompt: 'Arriba tienes la contribución conocida. Construye la otra contribución de orden árbol a e⁻e⁻ → e⁻e⁻.',
        diagram: withTags(puzzle(process('moller', 'u'), []), TAGS),
        reference: { label: 'Ya conocida', diagram: mollerT() },
        palette: ['fermion', 'photon'],
        validation: { kinematics: true, differentFrom: [mollerT()] },
        hints: ['En la conocida, 1 va con 3 y 2 va con 4. Prueba otro emparejamiento.', 'Une 1 y 4 a un vértice, y 2 y 3 al otro. Después conecta los vértices con un fotón.'],
      },
    ],
    success: 'Has encontrado la contribución cruzada (canal u). Para partículas idénticas, ambas historias cuentan.',
    explanation: {
      intuitive: 'Si no puedes distinguir los electrones, no puedes saber cuál fue a dónde. Las dos posibilidades contribuyen a la vez.',
      scientific:
        'La dispersión de Møller tiene dos diagramas de orden árbol: el canal t (1→3, 2→4) y el canal u (1→4, 2→3). El segundo existe porque los electrones finales son indistinguibles.',
      math: '𝓜 = 𝓜_t − 𝓜_u. El signo relativo negativo viene de la estadística de Fermi–Dirac: intercambiar dos fermiones idénticos cambia el signo de la amplitud.',
    },
    concepts: ['identical'],
  },
  {
    id: 19,
    chapter: 4,
    title: 'Bhabha: dos historias',
    mechanic: 'build',
    intro: 'Electrón y positrón pueden desviarse intercambiando un fotón, como ya viste. Pero tienen otra opción que dos electrones no tienen.',
    steps: [
      {
        id: 's',
        kind: 'build',
        prompt: 'Construye la contribución de aniquilación (canal s): el electrón 1 y el positrón 2 se unen en el mismo vértice.',
        diagram: withTags(puzzle(process('bhabha', 's'), []), TAGS),
        reference: { label: 'Canal t (conocido)', diagram: bhabhaT() },
        palette: ['fermion', 'photon'],
        validation: { kinematics: true, channel: 's' },
        hints: ['Las dos partículas iniciales van al vértice de la izquierda; las finales, al de la derecha.', 'Entre los dos vértices hace falta una línea que no lleve carga.'],
      },
      {
        id: 'meaning',
        kind: 'choice',
        prompt: 'En el diagrama que acabas de construir, ¿qué ocurre?',
        diagram: bhabhaS(),
        options: [
          { id: 'annihilate', text: 'El par se aniquila en un fotón virtual, que después crea un par nuevo', correct: true, feedback: 'El par inicial desaparece por completo y del fotón virtual nace un par nuevo.' },
          { id: 'bounce', text: 'El electrón y el positrón rebotan sin tocarse', feedback: 'Eso describe el canal t. Aquí se unen en el mismo vértice.' },
        ],
        hints: ['Mira qué partículas comparten el vértice de la izquierda.', 'Después de ese vértice solo queda un fotón.'],
      },
    ],
    success: 'Has dibujado dos historias distintas para el mismo proceso.',
    explanation: {
      intuitive: 'O se desvían intercambiando un fotón, o se convierten en un fotón y reaparecen. Las dos cosas contribuyen a lo que vemos.',
      scientific:
        'La dispersión de Bhabha tiene dos diagramas de orden árbol: el de dispersión (canal t) y el de aniquilación (canal s). A altas energías, el canal s es la base de los colisionadores e⁺e⁻ como LEP.',
      math: '𝓜 = 𝓜_t − 𝓜_s, con propagadores 1/t y 1/s, donde s = (p₁ + p₂)² es la energía total al cuadrado en el centro de masas.',
    },
    concepts: ['channels'],
  },
  {
    id: 20,
    chapter: 4,
    title: 'Cuenta las contribuciones',
    mechanic: 'decode',
    intro: 'Un físico que calcula un proceso debe encontrar todos los diagramas que contribuyen, ni uno más ni uno menos. Haz el recuento.',
    steps: [
      {
        id: 'moller',
        kind: 'choice',
        prompt: '¿Cuántos diagramas de orden árbol (dos vértices) contribuyen a e⁻e⁻ → e⁻e⁻?',
        options: [
          { id: '1', text: '1', feedback: 'Recuerda el nivel 18: los electrones idénticos dan una contribución más.' },
          { id: '2', text: '2: canales t y u', correct: true, feedback: 'Exacto: el directo y el cruzado.' },
          { id: '3', text: '3: canales s, t y u', feedback: 'El canal s no existe para dos electrones. ¿Por qué? Lo verás a continuación.' },
        ],
        hints: ['Hay tres formas de emparejar cuatro partículas en dos vértices.', 'Una de ellas viola la conservación de la carga.'],
      },
      {
        id: 'no-s',
        kind: 'choice',
        prompt: '¿Por qué no existe un diagrama de canal s para dos electrones?',
        diagram: mollerT(),
        options: [
          { id: 'charge', text: 'Dos electrones tienen carga −2, y un fotón no tiene carga: la flecha no podría continuar en el vértice', correct: true, feedback: 'En ese vértice entrarían dos flechas y no saldría ninguna.' },
          { id: 'touch', text: 'Porque los electrones nunca se tocan', feedback: 'En el canal s de Bhabha el electrón y el positrón sí comparten vértice. El problema es la carga.' },
        ],
        hints: ['Imagina un vértice con los dos electrones entrantes.', '¿Cuántas flechas entran y cuántas salen?'],
      },
      {
        id: 'bhabha',
        kind: 'choice',
        prompt: '¿Y cuántos diagramas de orden árbol contribuyen a e⁻e⁺ → e⁻e⁺?',
        options: [
          { id: '1', text: '1', feedback: 'En el nivel 19 construiste uno más.' },
          { id: '2', text: '2: canales s y t', correct: true, feedback: 'El canal u uniría el electrón inicial con el positrón final en un vértice: las flechas no fluirían.' },
          { id: '3', text: '3: canales s, t y u', feedback: 'El canal u es imposible aquí: violaría la conservación de la carga en el vértice.' },
        ],
        hints: ['Prueba los tres emparejamientos posibles.', 'Electrón inicial con positrón final: ¿se conserva la carga?'],
      },
    ],
    success: 'Haces la primera tarea de un cálculo real: encontrar todos los diagramas.',
    explanation: {
      intuitive: 'Hay pocas formas de conectar cuatro partículas con dos vértices, y las reglas descartan algunas. Las que quedan son todas las historias posibles.',
      scientific:
        'Con cuatro partículas externas hay tres emparejamientos (s, t, u). La conservación de la carga en los vértices elimina algunos. Møller conserva t y u; Bhabha, s y t. El motor de este juego enumera estos diagramas automáticamente para verificar los niveles.',
      math: 'A orden e², la amplitud total es la suma de los diagramas permitidos con sus signos relativos. La sección eficaz es ∝ |Σ 𝓜_i|² e incluye términos de interferencia entre diagramas.',
    },
    concepts: ['contributions'],
  },
];
