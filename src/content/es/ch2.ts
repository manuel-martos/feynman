import type { Diagram } from '../../engine';
import type { Level } from '../../game/types';
import { emission, patchEdges, plain, process, puzzle, vertex } from '../diagrams';

/** e⁻ e⁺ meeting at a vertex with a photon leaving (fragment). */
const annihilationVertex = () =>
  vertex(
    [
      { id: 'in1', kind: 'in', species: 'e-', x: 10, y: 14 },
      { id: 'in2', kind: 'in', species: 'e+', x: 10, y: 58 },
      { id: 'g', kind: 'out', species: 'gamma', x: 90, y: 36 },
    ],
    [50, 36],
  );

const pairCreationVertex = () =>
  vertex(
    [
      { id: 'g', kind: 'in', species: 'gamma', x: 10, y: 36 },
      { id: 'out1', kind: 'out', species: 'e-', x: 90, y: 14 },
      { id: 'out2', kind: 'out', species: 'e+', x: 90, y: 58 },
    ],
    [50, 36],
  );

const positronEmission = () =>
  vertex(
    [
      { id: 'in1', kind: 'in', species: 'e+', x: 10, y: 50 },
      { id: 'out1', kind: 'out', species: 'e+', x: 90, y: 50 },
      { id: 'g', kind: 'out', species: 'gamma', x: 82, y: 12 },
    ],
    [48, 50],
  );

/** The invalid four-line "vertex" from the design document. */
export const fourLineVertex = (): Diagram => ({
  nodes: [
    { id: 'in1', kind: 'in', x: 10, y: 50 },
    { id: 'out1', kind: 'out', x: 90, y: 50 },
    { id: 'g1', kind: 'out', x: 78, y: 10 },
    { id: 'g2', kind: 'in', x: 22, y: 10 },
    { id: 'v', kind: 'vertex', x: 50, y: 44 },
  ],
  edges: [
    { id: 'in1', type: 'fermion', from: 'in1', to: 'v' },
    { id: 'out1', type: 'fermion', from: 'v', to: 'out1' },
    { id: 'g1', type: 'photon', from: 'v', to: 'g1' },
    { id: 'g2', type: 'photon', from: 'g2', to: 'v' },
  ],
});

/** Møller diagram with the outgoing electron's arrow reversed (editable). */
export const brokenMoller = (): Diagram =>
  patchEdges(process('moller', 't'), { out1: { from: 'out1', to: 'vA', locked: false } });

export const chapter2: Level[] = [
  {
    id: 6,
    chapter: 2,
    title: 'El punto de encuentro',
    mechanic: 'decode',
    intro: 'Las líneas no se cruzan sin más: se encuentran en puntos llamados vértices. Ahí, y solo ahí, ocurre la interacción. Este es un vértice aislado: la pieza básica de todos los diagramas.',
    steps: [
      {
        id: 'find',
        kind: 'tap',
        prompt: 'Toca el vértice del diagrama.',
        diagram: plain(emission()),
        targets: ['v'],
        mode: 'any',
        tappable: 'nodes',
        wrongDefault: 'Ese punto es un extremo: una partícula que entra o sale. El vértice es donde se unen las líneas.',
        hints: ['Busca el punto donde se juntan varias líneas.', 'Es el punto brillante del centro.'],
        solved: 'Ese es el vértice: el lugar de la interacción.',
      },
      {
        id: 'count',
        kind: 'choice',
        prompt: '¿Cuántas líneas se unen en este vértice?',
        diagram: plain(emission()),
        options: [
          { id: '2', text: '2', feedback: 'Cuenta también la línea ondulada.' },
          { id: '3', text: '3', correct: true, feedback: 'Tres líneas: siempre tres en QED.' },
          { id: '4', text: '4', feedback: 'Vuelve a contar las líneas que llegan al punto central.' },
        ],
        hints: ['Cuenta las líneas que tocan el punto central.', 'Hay dos rectas y una ondulada.'],
      },
      {
        id: 'rule',
        kind: 'choice',
        prompt: '¿Qué combinación de líneas forma un vértice de QED?',
        diagram: plain(emission()),
        options: [
          { id: 'qed', text: 'Dos de fermión (una flecha entra y otra sale) y un fotón', correct: true, feedback: 'Esta es la única regla de interacción de la QED.' },
          { id: 'photons', text: 'Tres fotones', feedback: 'Los fotones no tienen carga: no interactúan directamente entre sí en QED.' },
          { id: 'electrons', text: 'Tres electrones', feedback: 'La carga no se conservaría, y en QED la interacción siempre pasa por un fotón.' },
        ],
        hints: ['Fíjate en qué tipos de línea tocan el vértice.', 'Una de las flechas llega al vértice y la otra sale de él.'],
      },
    ],
    success: 'Has descubierto la regla fundamental de la QED: un vértice, tres líneas.',
    explanation: {
      intuitive: 'Un electrón puede emitir o absorber un fotón. Toda la electricidad, el magnetismo y la luz salen de esta única regla.',
      scientific:
        'El vértice de QED acopla el campo del electrón con el campo del fotón. Une siempre una línea fermiónica que entra, otra que sale y una línea fotónica. El mismo vértice, girado, describe la emisión, la absorción, la aniquilación o la creación de pares.',
      math: 'Cada vértice aporta un factor −ieγ^μ, donde e es la carga elemental y γ^μ son las matrices de Dirac.',
    },
    concepts: ['vertex'],
  },
  {
    id: 7,
    chapter: 2,
    title: 'La flecha no se rompe',
    mechanic: 'build',
    intro: 'Ahora te toca construir. En cada vértice, la flecha que entra debe continuar saliendo. Así se dibuja la conservación de la carga eléctrica.',
    steps: [
      {
        id: 'out-electron',
        kind: 'build',
        prompt: 'Completa el vértice: el electrón debe salir por la derecha. Arrastra desde el vértice hasta el punto de salida.',
        diagram: puzzle(emission(), ['in1', 'g']),
        palette: ['fermion'],
        validation: {},
        hints: ['La flecha sigue el sentido de tu gesto.', 'Un electrón que sale lleva la flecha hacia la derecha: arrastra desde el vértice hacia fuera.'],
        solved: 'La flecha entra y sale: la carga se conserva.',
      },
      {
        id: 'in-positron',
        kind: 'build',
        prompt: 'Un positrón entra por abajo y se encuentra con un electrón. Dibuja la línea del positrón con la flecha correcta.',
        diagram: puzzle(annihilationVertex(), ['in1', 'g']),
        palette: ['fermion'],
        validation: {},
        hints: ['Un positrón que entra tiene la flecha apuntando contra el tiempo.', 'Arrastra desde el vértice hacia el punto de entrada de abajo: así la flecha apunta hacia la izquierda.'],
      },
    ],
    success: 'Has dibujado la conservación de la carga con una simple flecha.',
    explanation: {
      intuitive: 'Lo que entra por un lado sale por el otro: la flecha nunca se corta ni se duplica.',
      scientific:
        'Las flechas forman líneas continuas que atraviesan los vértices. Esto expresa la conservación del número fermiónico y, en QED, de la carga eléctrica. Un electrón que entra (−1) y un positrón que entra (+1) suman 0, la carga del fotón.',
      math: 'La conservación de la carga se deriva de la simetría gauge U(1) de la QED (teorema de Noether). En cada vértice, la corriente ψ̄γ^μψ se conserva.',
    },
    concepts: ['charge'],
  },
  {
    id: 8,
    chapter: 2,
    title: 'Vértices imposibles',
    mechanic: 'debug',
    intro: 'Un ingeniero del laboratorio ha dibujado algunos diagramas con errores. Usa las reglas que conoces para encontrar qué falla.',
    steps: [
      {
        id: 'four',
        kind: 'choice',
        prompt: 'Este vértice conecta dos electrones y dos fotones. ¿Qué tiene de incorrecto como vértice fundamental?',
        diagram: fourLineVertex(),
        options: [
          { id: 'three', text: 'Un vértice QED une exactamente tres líneas: dos de fermión y un fotón', correct: true, feedback: 'En QED no existe ningún vértice fundamental de cuatro líneas.' },
          { id: 'fine', text: 'Nada: un vértice puede tener tantos fotones como quiera', feedback: 'La QED solo tiene un tipo de vértice, con exactamente un fotón.' },
          { id: 'emit', text: 'Los electrones no pueden absorber fotones', feedback: 'Sí pueden: es justo lo que describe un vértice correcto de tres líneas.' },
        ],
        hints: ['Cuenta las líneas del vértice.', 'La regla del nivel 6: tres líneas, una de ellas un fotón.'],
        solved: 'Ese proceso existe, pero se dibuja con dos vértices encadenados, no con uno de cuatro líneas.',
      },
      {
        id: 'fix-flow',
        kind: 'build',
        prompt: 'En este diagrama hay un vértice que viola la conservación de la carga. Toca la línea culpable e invierte su flecha.',
        diagram: brokenMoller(),
        palette: ['fermion', 'photon'],
        validation: { kinematics: true },
        hints: ['Revisa las flechas vértice a vértice: en cada uno, una debe entrar y otra salir.', 'En el vértice de arriba entran dos flechas. La línea editable es la de la salida superior.'],
      },
    ],
    success: 'Detectas vértices que la naturaleza no permite. Eres el control de calidad del laboratorio.',
    explanation: {
      intuitive: 'La QED solo tiene una regla de interacción. Si un dibujo se la salta, no describe nada que pueda ocurrir.',
      scientific:
        'El lagrangiano de la QED solo contiene un término de interacción, ψ̄γ^μψA_μ, con dos campos fermiónicos y un fotón. Por eso existe un único vértice fundamental de tres líneas. Procesos como e⁻γ → e⁻γ (Compton) se describen encadenando dos vértices.',
      math: 'Un término con dos fotones y dos electrones tendría dimensión de masa 5 y haría la teoría no renormalizable. En QED no aparece.',
    },
    concepts: ['qed-rule'],
  },
  {
    id: 9,
    chapter: 2,
    title: 'Admisible no es posible',
    mechanic: 'decode',
    intro: 'Un vértice correcto es una pieza válida del lenguaje. Pero ¿puede ocurrir por sí solo en la naturaleza? Aquí la física te hace una pequeña trampa.',
    steps: [
      {
        id: 'emission',
        kind: 'choice',
        prompt: 'Este vértice cumple las reglas de QED. ¿Puede un electrón libre y aislado emitir un fotón real así, sin nada más?',
        diagram: plain(emission()),
        options: [
          { id: 'no', text: 'No: no puede conservar a la vez la energía y el momento', correct: true, feedback: 'En el sistema de referencia en reposo del electrón inicial, no hay energía disponible para crear un fotón.' },
          { id: 'yes', text: 'Sí: los electrones emiten luz constantemente', feedback: 'Los electrones emiten luz cuando interactúan con algo (un núcleo, un campo, otro electrón). Un electrón solitario en el vacío no puede.' },
        ],
        hints: ['Imagina el electrón en reposo antes de emitir.', '¿De dónde saldría la energía del fotón si el electrón no puede perder masa?'],
      },
      {
        id: 'pair',
        kind: 'choice',
        prompt: '¿Y un fotón solitario en el vacío? ¿Puede convertirse en un electrón y un positrón?',
        diagram: plain(pairCreationVertex()),
        options: [
          { id: 'needs', text: 'No por sí solo: necesita otra partícula cercana, como un núcleo, que absorba momento', correct: true, feedback: 'Por eso la creación de pares se observa cuando un fotón de alta energía pasa cerca de un núcleo.' },
          { id: 'energy', text: 'Sí, si tiene suficiente energía', feedback: 'Ni con toda la energía del mundo. En el sistema donde el par tiene momento total cero, el fotón debería tener momento cero y energía no nula, y eso es imposible para un fotón.' },
        ],
        hints: ['Un fotón siempre se mueve a la velocidad de la luz y siempre tiene momento.', 'El par e⁻e⁺ puede estar en reposo en conjunto; el fotón nunca.'],
      },
      {
        id: 'meaning',
        kind: 'choice',
        prompt: 'Entonces, ¿para qué sirve un vértice aislado?',
        options: [
          { id: 'piece', text: 'Es una pieza: los procesos reales se construyen combinando vértices', correct: true, feedback: 'Con dos o más vértices, las líneas internas pueden ser virtuales y el proceso sí puede ocurrir.' },
          { id: 'useless', text: 'Para nada: es un error del formalismo', feedback: 'Es la pieza con la que se construye todo lo demás.' },
        ],
        hints: ['Piensa en las letras y las palabras.', 'En el siguiente capítulo combinarás dos vértices.'],
      },
    ],
    success: 'Has aprendido una sutileza que confunde a muchos estudiantes: admisible no significa realizable.',
    explanation: {
      intuitive: 'Las reglas del dibujo dicen qué piezas existen. Las leyes de conservación dicen qué procesos completos pueden ocurrir de verdad.',
      scientific:
        'Un diagrama formalmente admisible no garantiza que el proceso pueda ocurrir con partículas externas reales. Los procesos de tres partículas libres en QED (e → eγ, γ → e⁺e⁻, e⁺e⁻ → γ) violan la conservación del cuadrimomento. Dentro de diagramas mayores, las líneas internas virtuales esquivan esta restricción.',
      math: 'Para e(p) → e(p′) + γ(k): (p − k)² = m² implica m² − 2p·k = m², es decir, p·k = 0. Pero para un electrón masivo y un fotón real con energía positiva, p·k > 0. Contradicción.',
    },
    concepts: ['admissible'],
  },
  {
    id: 10,
    chapter: 2,
    title: 'Diseña tu vértice',
    mechanic: 'build',
    intro: 'Un mismo vértice, girado, describe procesos distintos. Construye dos versiones desde cero, como piezas de diagramas mayores.',
    steps: [
      {
        id: 'pair',
        kind: 'build',
        prompt: 'Construye el vértice donde un fotón se convierte en un electrón (arriba) y un positrón (abajo).',
        diagram: puzzle(pairCreationVertex(), []),
        palette: ['photon', 'fermion'],
        validation: {},
        hints: ['Primero el fotón: elige la línea ondulada y únela al vértice.', 'Electrón que sale: del vértice hacia fuera. Positrón que sale: desde fuera hacia el vértice.'],
        solved: 'Creación de pares: una flecha continua que «da la vuelta» en el vértice.',
      },
      {
        id: 'positron',
        kind: 'build',
        prompt: 'Ahora un positrón que emite un fotón y sigue su camino.',
        diagram: puzzle(positronEmission(), []),
        palette: ['fermion', 'photon'],
        validation: {},
        hints: ['El positrón entra y sale: las dos flechas apuntan contra el tiempo.', 'Arrastra desde la salida hasta el vértice y desde el vértice hasta la entrada.'],
      },
    ],
    success: 'Has descubierto la simetría de cruce: un solo vértice, muchas historias.',
    explanation: {
      intuitive: 'Gira el vértice y lo que era una emisión se convierte en una creación de pares. Es la misma regla vista desde otro ángulo.',
      scientific:
        'La simetría de cruce relaciona procesos en los que una partícula entrante se sustituye por su antipartícula saliente. Emisión, absorción, aniquilación y creación de pares son el mismo vértice con distintas orientaciones respecto al tiempo.',
      math: 'Las amplitudes de procesos cruzados se obtienen por continuación analítica, cambiando p → −p para la partícula cruzada.',
    },
    concepts: ['crossing'],
  },
];
