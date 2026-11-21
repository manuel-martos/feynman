import type { Level } from '../../game/types';
import { move, plain, process, puzzle } from '../diagrams';

const moller = () => plain(process('moller', 't'));
const annihilation = () => plain(process('annihilation', 't'));

export const chapter3: Level[] = [
  {
    id: 11,
    chapter: 3,
    title: 'Dentro y fuera',
    mechanic: 'decode',
    intro: 'Con dos vértices aparece algo nuevo: líneas que no entran ni salen, sino que unen un vértice con otro. Son las líneas internas.',
    steps: [
      {
        id: 'internal',
        kind: 'tap',
        prompt: 'Toca todas las líneas internas (las que unen dos vértices) y pulsa Comprobar.',
        diagram: moller(),
        targets: ['int'],
        mode: 'all',
        tappable: 'edges',
        wrongDefault: 'Esa línea llega a un borde del diagrama: es externa.',
        hints: ['Una línea interna no toca ningún borde.', 'Solo hay una, y es ondulada.'],
      },
      {
        id: 'external',
        kind: 'tap',
        prompt: 'Ahora selecciona todas las líneas externas y pulsa Comprobar.',
        diagram: moller(),
        targets: ['in1', 'in2', 'out1', 'out2'],
        mode: 'all',
        tappable: 'edges',
        wrong: { int: 'Ese fotón une dos vértices: es interno.' },
        wrongDefault: 'Esa no es externa.',
        hints: ['Las externas tocan el borde izquierdo o el derecho.', 'Son cuatro.'],
      },
      {
        id: 'vertices',
        kind: 'choice',
        prompt: '¿Cuántos vértices tiene este diagrama?',
        diagram: moller(),
        options: [
          { id: '1', text: '1' },
          { id: '2', text: '2', correct: true, feedback: 'Dos vértices unidos por una línea interna.' },
          { id: '4', text: '4', feedback: 'Los extremos de las líneas externas no son vértices: ahí no ocurre ninguna interacción.' },
        ],
        hints: ['Un vértice es donde se unen tres líneas.', 'Los extremos de los bordes no cuentan.'],
      },
    ],
    success: 'Externas: lo que se observa. Internas: lo que ocurre entre medias.',
    explanation: {
      intuitive: 'Las líneas externas son las partículas que preparamos y detectamos. Las internas son el «mensaje» que pasa de un vértice a otro y que nunca vemos directamente.',
      scientific:
        'Las líneas internas representan partículas virtuales, que se propagan entre dos vértices. No están en la capa de masas, es decir, no cumplen E² = p²c² + m²c⁴. Las externas son partículas reales que sí la cumplen.',
      math: 'Cada línea interna aporta un propagador. El del fotón es −ig_μν/q², donde q es el cuadrimomento que transporta.',
    },
    concepts: ['internal-external'],
  },
  {
    id: 12,
    chapter: 3,
    title: 'El mensajero invisible',
    mechanic: 'build',
    intro: 'Dos electrones entran y dos electrones salen. Cada uno toca un vértice, pero entre los vértices falta algo. ¿Qué partícula puede llevar la interacción de uno a otro?',
    steps: [
      {
        id: 'exchange',
        kind: 'build',
        prompt: 'Completa el diagrama de intercambio de un único fotón virtual: elige la partícula correcta y une los dos vértices.',
        diagram: puzzle(process('moller', 't'), ['in1', 'out1', 'in2', 'out2']),
        palette: ['fermion', 'photon'],
        validation: { kinematics: true },
        hints: ['Cada vértice tiene ya dos líneas de fermión. ¿Qué le falta según la regla QED?', 'Un vértice QED necesita exactamente un fotón: elige la línea ondulada y une los dos vértices.'],
      },
    ],
    success: 'Has construido una contribución válida de orden árbol a la dispersión de electrones. Cada vértice conecta dos líneas fermiónicas y una fotónica.',
    explanation: {
      intuitive: 'Los dos electrones nunca se tocan. Se «comunican» intercambiando un fotón virtual, y por eso se repelen.',
      scientific:
        'Es una contribución de orden árbol a la dispersión de Møller (e⁻e⁻ → e⁻e⁻) en el canal t. El fotón virtual conecta dos vértices QED y transporta el momento que se intercambian los electrones.',
      math: '𝓜_t ∝ [ū(p₃) γ^μ u(p₁)] (1/t) [ū(p₄) γ_μ u(p₂)] · e², con t = (p₁ − p₃)². Cuanto menor es el momento transferido, mayor es la contribución: de ahí el largo alcance de la fuerza eléctrica.',
    },
    concepts: ['moller', 'virtual'],
  },
  {
    id: 13,
    chapter: 3,
    title: 'Electrón contra positrón',
    mechanic: 'build',
    intro: 'Un electrón pasa por arriba. Un positrón entra por abajo, pero sus líneas aún no están dibujadas. Completa la interacción.',
    steps: [
      {
        id: 'bhabha',
        kind: 'build',
        prompt: 'Dibuja el positrón que entra, el positrón que sale y la partícula que intercambian.',
        diagram: puzzle(process('bhabha', 't'), ['in1', 'out1']),
        palette: ['fermion', 'photon'],
        validation: { kinematics: true },
        hints: ['El positrón lleva la flecha contra el tiempo, tanto al entrar como al salir.', 'Desde el vértice de abajo hacia la entrada; desde la salida hacia el vértice. Y un fotón entre los dos vértices.'],
      },
    ],
    success: 'Has dibujado la dispersión de Bhabha. Materia y antimateria interactuando.',
    explanation: {
      intuitive: 'El electrón y el positrón se atraen (sus cargas son opuestas), y lo hacen intercambiando un fotón, igual que dos electrones.',
      scientific:
        'Es la dispersión de Bhabha en el canal t. El mismo intercambio de un fotón describe la atracción entre cargas opuestas y la repulsión entre cargas iguales: el signo lo deciden los factores de carga y los espinores.',
      math: 'La contribución del canal t es ∝ e²/t. En la aproximación no relativista, este intercambio reproduce el potencial de Coulomb V(r) ∝ ±e²/r.',
    },
    concepts: ['bhabha'],
  },
  {
    id: 14,
    chapter: 3,
    title: 'Virtual',
    mechanic: 'decode',
    intro: 'Las líneas internas no tienen por qué ser fotones. En la aniquilación, ¿qué viaja entre los dos vértices?',
    steps: [
      {
        id: 'find',
        kind: 'tap',
        prompt: 'Toca la línea interna del diagrama.',
        diagram: annihilation(),
        targets: ['int'],
        mode: 'any',
        tappable: 'edges',
        wrongDefault: 'Esa línea toca un borde: es externa.',
        hints: ['Busca la línea que une los dos vértices.', 'Es recta y vertical.'],
        solved: 'Una línea recta interna: un electrón virtual.',
      },
      {
        id: 'meaning',
        kind: 'choice',
        prompt: 'Esa línea interna es un electrón virtual. ¿Qué significa «virtual»?',
        diagram: annihilation(),
        options: [
          {
            id: 'offshell',
            text: 'Es una línea interna: no se observa directamente y no cumple la relación energía–momento de una partícula libre',
            correct: true,
            feedback: 'Los físicos dicen que está «fuera de la capa de masas».',
          },
          { id: 'fake', text: 'Que es imaginario y no influye en nada', feedback: 'Influye mucho: sin él no habría proceso. Su contribución a la amplitud es real, aunque no se detecte.' },
          { id: 'fast', text: 'Que viaja más rápido que la luz', feedback: 'No se puede hablar de una velocidad: un diagrama no describe trayectorias.' },
        ],
        hints: ['¿Llega esta línea a algún detector?', 'Piensa en la diferencia entre líneas internas y externas.'],
      },
    ],
    success: 'Has comprendido una de las ideas más profundas y peor contadas de la física: las partículas virtuales.',
    explanation: {
      intuitive: 'Un electrón virtual es un «electrón de paso»: existe solo como parte del cálculo de la interacción y nunca aparece en un detector.',
      scientific:
        'Una partícula virtual corresponde a un propagador en la amplitud, no a una partícula observable. Su cuadrimomento q no cumple q² = m²c². Por eso es incorrecto imaginarla como una bolita que viaja de verdad entre dos puntos.',
      math: 'El propagador del electrón es i(q̸ + m)/(q² − m²). Si la partícula fuera real (q² = m²), el denominador se anularía: la línea interna está siempre fuera de la capa de masas.',
    },
    concepts: ['virtual-electron'],
  },
  {
    id: 15,
    chapter: 3,
    title: 'Luz de la aniquilación',
    mechanic: 'build',
    intro: 'Un electrón y un positrón se aniquilan en dos fotones. Tienes los dos vértices y las cuatro partículas externas. Construye el diagrama completo.',
    steps: [
      {
        id: 'build',
        kind: 'build',
        prompt: 'Une las cuatro partículas externas con los dos vértices y conecta los vértices entre sí.',
        diagram: puzzle(process('annihilation', 't'), []),
        palette: ['fermion', 'photon'],
        validation: { kinematics: true },
        hints: [
          'Cada vértice necesita un fotón, una flecha que entra y otra que sale. Pon un fotón saliente en cada vértice.',
          'Electrón al vértice de arriba, positrón al de abajo (flecha del vértice hacia la entrada) y una línea de fermión entre los vértices, de arriba abajo.',
        ],
      },
    ],
    success: 'Has construido la aniquilación completa a orden árbol, sin ninguna línea dibujada de antemano.',
    explanation: {
      intuitive: 'El electrón emite un fotón, se convierte en una línea virtual y se encuentra con el positrón, que lo «absorbe» emitiendo el segundo fotón.',
      scientific:
        'Es la aniquilación e⁻e⁺ → γγ a orden árbol. Los dos vértices están unidos por un propagador fermiónico. Si conectaste los fotones al revés (con las líneas cruzadas), construiste la otra contribución, igualmente válida.',
      math: 'La amplitud total es 𝓜 = 𝓜_t + 𝓜_u, ambas ∝ e². Aquí el signo relativo es +, porque se intercambian dos bosones idénticos (los fotones).',
    },
    concepts: ['tree-level'],
  },
  {
    id: 16,
    chapter: 3,
    title: 'Luz que rebota',
    mechanic: 'build',
    intro: 'Un fotón choca con un electrón y ambos salen desviados. Es la dispersión Compton, la prueba de que la luz se comporta como partícula.',
    steps: [
      {
        id: 'build',
        kind: 'build',
        prompt: 'Construye un diagrama de dispersión Compton: e⁻ γ → e⁻ γ.',
        diagram: puzzle(move(process('compton', 's'), { in1: [8, 14], in2: [8, 58], out1: [92, 14], out2: [92, 58] }), []),
        palette: ['fermion', 'photon'],
        validation: { kinematics: true },
        hints: [
          'Ningún vértice puede tener dos fotones. Cada fotón externo va a un vértice distinto.',
          'Electrón y fotón entrantes al vértice izquierdo; electrón y fotón salientes al derecho; un electrón virtual entre ambos.',
        ],
      },
      {
        id: 'inside',
        kind: 'choice',
        prompt: 'En tu diagrama, ¿qué partícula recorre la línea interna?',
        diagram: plain(process('compton', 's')),
        options: [
          { id: 'electron', text: 'Un electrón virtual', correct: true, feedback: 'El electrón absorbe el fotón, viaja como línea virtual y emite un fotón nuevo.' },
          { id: 'photon', text: 'Un fotón virtual', feedback: 'Si la línea interna fuese un fotón, un vértice tendría dos fotones y el otro dos electrones sin fotón.' },
        ],
        hints: ['Cuenta los fotones de cada vértice.', 'Cada vértice ya tiene un fotón externo.'],
      },
    ],
    success: 'Has construido la dispersión Compton, el experimento que confirmó que la luz tiene momento.',
    explanation: {
      intuitive: 'El electrón «se traga» el fotón y escupe otro. La luz rebota en el electrón como una partícula.',
      scientific:
        'La dispersión Compton tiene dos contribuciones de orden árbol: la del canal s (absorción y después emisión) y la del canal u (emisión y después absorción). En ambas, la línea interna es un electrón virtual.',
      math: 'El cambio de longitud de onda observado por Compton en 1923 es Δλ = (h/mc)(1 − cos θ). La sección eficaz de Klein–Nishina sale de |𝓜_s + 𝓜_u|².',
    },
    concepts: ['compton'],
  },
];
