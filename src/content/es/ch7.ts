import { loopEdges, type Diagram } from '../../engine';
import type { Level } from '../../game/types';
import { graph, keepEdges, plain, type NodeSpec } from '../diagrams';

const MOLLER_EXT: Record<string, NodeSpec> = {
  in1: ['in', 8, 10, 'e-', '1'],
  in2: ['in', 8, 62, 'e-', '2'],
  out1: ['out', 92, 10, 'e-', '3'],
  out2: ['out', 92, 62, 'e-', '4'],
};

/** Møller t-channel with a vertex correction on the upper vertex. */
export const vertexCorrection = (): Diagram =>
  graph(
    { ...MOLLER_EXT, v1: ['vertex', 26, 14], v0: ['vertex', 50, 22], v2: ['vertex', 74, 14], vB: ['vertex', 50, 56] },
    ['in1>v1', 'v1>v0', 'v0>v2', 'v2>out1', 'v1~v2@-0.32', 'v0~vB', 'in2>vB', 'vB>out2'],
  );

/** Møller t-channel with vacuum polarization: the virtual photon splits into an e⁻e⁺ pair. */
export const vacuumPolarization = (): Diagram =>
  graph(
    { ...MOLLER_EXT, vA: ['vertex', 50, 14], v1: ['vertex', 50, 27], v2: ['vertex', 50, 45], vB: ['vertex', 50, 58] },
    ['in1>vA', 'vA>out1', 'vA~v1', 'v1>v2@-0.5', 'v2>v1@-0.5', 'v2~vB', 'in2>vB', 'vB>out2'],
  );

/** An electron scattering off an external field, with the one-loop vertex correction. */
export const schwinger = (): Diagram =>
  graph(
    {
      in1: ['in', 8, 58, 'e-'],
      out1: ['out', 92, 58, 'e-'],
      F: ['in', 50, 6, 'gamma', 'campo'],
      v1: ['vertex', 28, 50],
      v0: ['vertex', 50, 36],
      v2: ['vertex', 72, 50],
    },
    ['in1>v1', 'v1>v0', 'v0>v2', 'v2>out1', 'v1~v2', 'F~v0'],
  );

/** Light-by-light scattering γγ → γγ through an electron box. */
export const lightByLight = (): Diagram =>
  graph(
    {
      in1: ['in', 8, 10, 'gamma', '1'],
      in2: ['in', 8, 62, 'gamma', '2'],
      out1: ['out', 92, 10, 'gamma', '3'],
      out2: ['out', 92, 62, 'gamma', '4'],
      a: ['vertex', 32, 22],
      b: ['vertex', 68, 22],
      c: ['vertex', 68, 50],
      d: ['vertex', 32, 50],
    },
    ['in1~a', 'out1~b', 'out2~c', 'in2~d', 'a>b', 'b>c', 'c>d', 'd>a'],
  );

/** A photon splitting into two through an electron triangle (cancelled by Furry's theorem). */
export const triangle = (reversed = false): Diagram =>
  graph(
    { in1: ['in', 8, 36, 'gamma'], out1: ['out', 92, 10, 'gamma'], out2: ['out', 92, 62, 'gamma'], a: ['vertex', 36, 36], b: ['vertex', 64, 20], c: ['vertex', 64, 52] },
    ['in1~a', 'b~out1', 'c~out2', ...(reversed ? ['b>a', 'c>b', 'a>c'] : ['a>b', 'b>c', 'c>a'])],
  );

/** The photon propagator with its one-loop correction, on its own. */
export const photonSelfEnergy = (): Diagram =>
  graph({ in1: ['in', 8, 36, 'gamma'], out1: ['out', 92, 36, 'gamma'], a: ['vertex', 36, 36], b: ['vertex', 64, 36] }, ['in1~a', 'a>b@0.4', 'b>a@0.4', 'b~out1']);

/** One-loop box contribution to Møller scattering: two photons exchanged. */
export const mollerBox = (): Diagram =>
  graph(
    { ...MOLLER_EXT, v1: ['vertex', 32, 16], v2: ['vertex', 68, 16], v3: ['vertex', 32, 56], v4: ['vertex', 68, 56] },
    ['in1>v1', 'v1>v2', 'v2>out1', 'in2>v3', 'v3>v4', 'v4>out2', 'v1~v3', 'v2~v4'],
  );

export const chapter7: Level[] = [
  {
    id: 29,
    chapter: 7,
    title: 'Un circuito cerrado',
    mechanic: 'decode',
    intro: 'Hasta ahora todo eran árboles. Pero la naturaleza también permite historias que vuelven sobre sí mismas: los bucles.',
    steps: [
      {
        id: 'loop',
        kind: 'tap',
        prompt: 'Este diagrama tiene un bucle. Selecciona todas las líneas que forman el circuito cerrado.',
        diagram: plain(vertexCorrection()),
        targets: loopEdges(vertexCorrection()),
        mode: 'all',
        tappable: 'edges',
        wrongDefault: 'Esa línea no forma parte del circuito. Busca un camino que salga de un vértice y vuelva a él.',
        hints: ['Parte del vértice de arriba a la izquierda y busca un camino que vuelva a él sin repetir líneas.', 'El bucle lo forman el fotón curvo de arriba y los dos tramos de electrón que hay debajo de él.'],
        solved: 'Ese es el bucle: un fotón emitido y reabsorbido por el mismo electrón.',
      },
      {
        id: 'momentum',
        kind: 'choice',
        prompt: 'En un árbol, la conservación del momento fija el momento de cada línea interna. ¿Qué pasa con las líneas de un bucle?',
        playback: true,
        diagram: plain(vertexCorrection()),
        options: [
          { id: 'fixed', text: 'Su momento también queda fijado', feedback: 'En un circuito cerrado el momento puede «dar vueltas» sin que lo noten las partículas externas.' },
          { id: 'all', text: 'Puede tener cualquier valor y hay que sumarlos todos', correct: true, feedback: 'Cada bucle añade una integral sobre un momento libre.' },
          { id: 'zero', text: 'Su momento es siempre cero', feedback: 'Nada obliga a que sea cero: cualquier valor es compatible con la conservación.' },
        ],
        hints: ['Imagina que una cantidad de momento entra en el bucle y lo recorre entero.', 'Las partículas externas no pueden saber cuánto momento circula dentro.'],
      },
      {
        id: 'order',
        kind: 'choice',
        prompt: 'Este diagrama tiene 4 vértices. ¿Cuánto más pequeña es su amplitud que la del árbol de Møller?',
        options: [
          { id: 'e', text: 'Un factor e' },
          { id: 'e2', text: 'Un factor e², es decir, ∝ α', correct: true, feedback: 'Dos vértices más: e⁴ frente a e². Por eso los bucles son correcciones pequeñas.' },
          { id: 'same', text: 'Es igual', feedback: 'Cuenta los vértices: 4 frente a 2.' },
        ],
        hints: ['Amplitud ∝ eⁿ, con n el número de vértices.', 'e⁴ / e² = e².'],
      },
    ],
    success: 'Ya reconoces un bucle y sabes por qué es una corrección pequeña.',
    explanation: {
      intuitive: 'En un bucle, la partícula virtual puede llevar cualquier cantidad de movimiento. La naturaleza las prueba todas.',
      scientific:
        'Cada bucle independiente deja un momento sin fijar por la conservación en los vértices; hay que integrar sobre él. Estas integrales pueden divergir y la renormalización es la técnica que las domestica. Cada bucle añade dos vértices: un factor α a la amplitud relativa.',
      math: '𝓜₁ ∝ e⁴ ∫ d⁴ℓ/(2π)⁴ [propagadores con ℓ]. Bucles: L = I − V + 1, con I líneas internas y V vértices.',
    },
    concepts: ['loop'],
  },
  {
    id: 30,
    chapter: 7,
    title: 'El vacío hierve',
    mechanic: 'build',
    intro: 'El fotón que intercambian dos electrones puede convertirse, por un instante, en un par electrón–positrón y volver a ser fotón.',
    steps: [
      {
        id: 'build',
        kind: 'build',
        prompt: 'Completa el bucle entre los dos vértices centrales: el fotón virtual se convierte en un par e⁻e⁺ que se aniquila de nuevo.',
        diagram: keepEdges(vacuumPolarization(), ['in1', 'out1', 'vA-v1', 'v2-vB', 'in2', 'out2']),
        palette: ['fermion', 'photon'],
        validation: { kinematics: true, loops: 1 },
        hints: [
          'Cada vértice central ya tiene su fotón. Le faltan las dos líneas de fermión.',
          'Traza dos líneas de fermión entre los dos vértices centrales, con flechas en sentidos opuestos. La segunda se curva sola.',
        ],
      },
      {
        id: 'effect',
        kind: 'choice',
        prompt: 'Estos pares virtuales rodean a cada electrón como una nube que apantalla su carga. ¿Qué ocurre al acercarse mucho al electrón (a energías altas)?',
        options: [
          { id: 'more', text: 'Se atraviesa la nube y la carga efectiva aumenta', correct: true, feedback: 'α crece con la energía: de ≈ 1/137 a ≈ 1/128 a la energía del bosón Z.' },
          { id: 'less', text: 'La carga efectiva disminuye', feedback: 'Ocurre lo contrario: la nube apantalla, así que dentro de ella se ve más carga.' },
          { id: 'same', text: 'La carga es siempre la misma', feedback: 'La carga «desnuda» no cambia, pero la que medimos depende de la distancia.' },
        ],
        hints: ['Piensa en la nube de pares como en un dieléctrico que rodea la carga.', 'Dentro de la nube queda menos apantallamiento.'],
      },
    ],
    success: 'Has dibujado la polarización del vacío: el vacío cuántico no está vacío.',
    explanation: {
      intuitive: 'El espacio vacío está lleno de pares partícula–antipartícula que aparecen y desaparecen. Rodean a cada carga y la apantallan.',
      scientific:
        'La polarización del vacío hace que la constante de acoplamiento dependa de la energía: α(0) ≈ 1/137, pero α(m_Z) ≈ 1/128. Es la primera «constante» que se vio cambiar, y la contribución es medible en el desplazamiento Lamb del hidrógeno.',
      math: 'Π(q²) ≈ (α/3π) ln(−q²/m²) para |q²| ≫ m²; α_ef(q²) = α / (1 − Π(q²)).',
    },
    concepts: ['vacuum-polarization'],
  },
  {
    id: 31,
    chapter: 7,
    title: 'El número de Schwinger',
    mechanic: 'build',
    intro: 'Un electrón atraviesa un campo magnético. En 1948, Julian Schwinger calculó cómo un bucle cambia su imán interno. El resultado está grabado en su lápida.',
    steps: [
      {
        id: 'build',
        kind: 'build',
        prompt: 'Construye la corrección de vértice: el electrón emite un fotón virtual, interactúa con el campo y reabsorbe el fotón.',
        diagram: keepEdges(schwinger(), ['F']),
        palette: ['fermion', 'photon'],
        validation: { loops: 1 },
        hints: [
          'La línea del electrón pasa por los tres vértices: izquierdo, central y derecho.',
          'Electrón → izquierdo → central → derecho → salida, y un fotón une el vértice izquierdo con el derecho.',
        ],
      },
      {
        id: 'g2',
        kind: 'choice',
        prompt: 'Sin el bucle, el «factor g» del electrón vale exactamente 2. El bucle lo corrige: a = (g − 2)/2. ¿Cuánto vale esa corrección?',
        options: [
          { id: 'half', text: 'a = 1/2', feedback: 'Es una corrección de un bucle: debe ser del orden de α.' },
          { id: 'schwinger', text: 'a = α/2π ≈ 0,00116', correct: true, feedback: 'El resultado de Schwinger. Hoy se conoce hasta cinco bucles y coincide con el experimento en más de 10 cifras.' },
          { id: 'zero', text: 'a = 0', feedback: 'Si fuera cero, el bucle no tendría ningún efecto. Sí lo tiene y se mide.' },
        ],
        hints: ['Un bucle aporta un factor α respecto al árbol.', 'α ≈ 1/137, y aparece dividido por 2π.'],
      },
    ],
    success: 'Has dibujado uno de los diagramas más famosos de la física.',
    explanation: {
      intuitive: 'El electrón no está solo: lleva consigo una nube de fotones virtuales que modifica ligeramente cómo responde a un imán.',
      scientific:
        'El momento magnético anómalo del electrón, a = α/2π a un bucle, es la predicción más precisa de la física: teoría y experimento coinciden en más de 10 cifras significativas. Con esta disposición de vértices también es válida otra corrección de un bucle: la autoenergía de una línea externa.',
      math: 'Γ^μ = γ^μ F₁(q²) + (iσ^{μν}q_ν / 2m) F₂(q²), con a = F₂(0) = α/2π + 𝒪(α²).',
    },
    concepts: ['g-2'],
  },
  {
    id: 32,
    chapter: 7,
    title: 'Luz contra luz',
    mechanic: 'build',
    intro: 'Dos haces de luz se cruzan sin tocarse... casi siempre. ¿Puede un fotón rebotar en otro?',
    steps: [
      {
        id: 'tree',
        kind: 'choice',
        prompt: '¿Existe algún diagrama de orden árbol (sin bucles) para γγ → γγ?',
        options: [
          { id: 'yes', text: 'Sí, uniendo los cuatro fotones en dos vértices', feedback: 'Cada vértice QED necesita dos líneas de fermión. Aquí no entra ni sale ningún fermión.' },
          { id: 'no', text: 'No: sin fermiones externos, las líneas de fermión tienen que cerrarse en un bucle', correct: true },
        ],
        hints: ['Cuenta cuántas líneas de fermión necesita cada vértice.', 'Una línea de fermión solo puede acabar en un borde o continuar. Si no hay fermiones en los bordes...'],
      },
      {
        id: 'box',
        kind: 'build',
        prompt: 'Construye el diagrama de caja: une los cuatro vértices con líneas de fermión.',
        diagram: keepEdges(lightByLight(), ['in1', 'in2', 'out1', 'out2']),
        palette: ['fermion'],
        validation: { kinematics: true, loops: 1 },
        hints: ['Cada vértice ya tiene su fotón. Le falta una flecha que entra y otra que sale.', 'Recorre el cuadrado en un solo sentido: arriba-izquierda → arriba-derecha → abajo-derecha → abajo-izquierda → vuelta al principio.'],
      },
    ],
    success: 'La luz puede dispersar la luz, pero solo a través de un bucle de materia virtual.',
    explanation: {
      intuitive: 'Los fotones no interactúan directamente: necesitan que el vacío les preste, por un instante, un electrón y un positrón.',
      scientific:
        'La dispersión luz–luz no existe en física clásica y en QED aparece por primera vez a un bucle. Hay 6 diagramas de caja. ATLAS la observó en 2017 en colisiones de iones de plomo, cuyos enormes campos eléctricos actúan como haces de fotones.',
      math: '𝓜(γγ → γγ) ∝ e⁴, σ ∝ α⁴. A baja energía, el efecto está descrito por el lagrangiano de Euler–Heisenberg.',
    },
    concepts: ['light-by-light'],
  },
  {
    id: 33,
    chapter: 7,
    title: 'El teorema de Furry',
    mechanic: 'debug',
    intro: 'Algunos diagramas cumplen todas las reglas y, aun así, su contribución total es exactamente cero.',
    steps: [
      {
        id: 'impostor',
        kind: 'choice',
        prompt: '¿Cuál de estos bucles NO contribuye a ningún proceso?',
        options: [
          { id: 'box', text: 'A', diagram: plain(lightByLight()), feedback: 'La caja de cuatro fotones existe: es la dispersión luz–luz.' },
          { id: 'bubble', text: 'B', diagram: plain(photonSelfEnergy()), feedback: 'Esta burbuja es la polarización del vacío: tiene efectos medibles.' },
          { id: 'triangle', text: 'C', diagram: plain(triangle()), correct: true, feedback: 'Un bucle de electrones con un número impar de fotones se anula.' },
        ],
        hints: ['Cuenta cuántos fotones se enganchan a cada bucle de electrones.', 'Busca el bucle con un número impar de fotones.'],
      },
      {
        id: 'cancel',
        kind: 'choice',
        prompt: 'El triángulo puede recorrerse en los dos sentidos. Ambos diagramas son válidos. ¿Qué ocurre al sumarlos?',
        diagrams: [
          { label: 'Horario', diagram: plain(triangle()) },
          { label: 'Antihorario', diagram: plain(triangle(true)) },
        ],
        options: [
          { id: 'double', text: 'Se suman: el efecto se duplica', feedback: 'Invertir el bucle equivale a cambiar electrón por positrón, y cada fotón cambia de signo con esa operación.' },
          { id: 'cancel', text: 'Se cancelan exactamente', correct: true, feedback: 'Con 3 fotones, invertir el bucle da un signo (−1)³ = −1.' },
          { id: 'partial', text: 'Se cancelan solo en parte', feedback: 'La cancelación es exacta, para cualquier momento de los fotones.' },
        ],
        hints: ['Invertir las flechas equivale a cambiar electrones por positrones.', 'Cada fotón aporta un signo −1 bajo esa operación.'],
      },
    ],
    success: 'Has detectado un diagrama válido que no aporta nada: una simetría lo anula.',
    explanation: {
      intuitive: 'Dos historias idénticas pero recorridas en sentido contrario se compensan perfectamente.',
      scientific:
        'El teorema de Furry (1937) dice que un bucle cerrado de electrones con un número impar de fotones no contribuye. Es consecuencia de la simetría de conjugación de carga: el fotón es impar bajo C. El validador del juego lo aplica: si construyes un bucle así, te avisará.',
      math: 'C A_μ C⁻¹ = −A_μ ⇒ ⟨0|T{A_μ₁ ⋯ A_μₙ}|0⟩ = 0 para n impar. Las dos orientaciones suman 𝓜 + (−1)ⁿ𝓜.',
    },
    concepts: ['furry'],
  },
  {
    id: 34,
    chapter: 7,
    title: 'Gran final: Møller a un bucle',
    mechanic: 'build',
    intro: 'El examen de un doctorando: ir más allá del árbol en la dispersión electrón–electrón.',
    steps: [
      {
        id: 'box',
        kind: 'build',
        prompt: 'Construye una corrección de un bucle a e⁻e⁻ → e⁻e⁻ usando los cuatro vértices. Prueba con el diagrama de caja: los electrones intercambian dos fotones.',
        diagram: keepEdges(mollerBox(), []),
        palette: ['fermion', 'photon'],
        validation: { kinematics: true, loops: 1 },
        hints: [
          'Cada electrón recorre dos vértices: el de arriba los dos de arriba, el de abajo los dos de abajo.',
          '1 → arriba-izquierda → arriba-derecha → 3; 2 → abajo-izquierda → abajo-derecha → 4; y dos fotones verticales entre las dos líneas.',
        ],
      },
      {
        id: 'interference',
        kind: 'choice',
        prompt: 'La probabilidad es |𝓜_árbol + 𝓜_bucle|². El primer efecto del bucle es el término cruzado 2·Re(𝓜_árbol* · 𝓜_bucle). ¿A qué orden contribuye?',
        options: [
          { id: 'a2', text: 'α², como el árbol', feedback: 'El árbol solo ya da α². El cruce tiene más vértices.' },
          { id: 'a3', text: 'α³: una corrección de orden α al resultado del árbol', correct: true, feedback: 'e² · e⁴ = e⁶ ∝ α³. Por eso basta con el árbol para una precisión de ~1 %.' },
          { id: 'a4', text: 'α⁴', feedback: 'Eso es |𝓜_bucle|², que es aún más pequeño.' },
        ],
        hints: ['𝓜_árbol ∝ e², 𝓜_bucle ∝ e⁴.', 'Multiplica: e² · e⁴, y recuerda que α ∝ e².'],
      },
    ],
    success: 'Campaña completada. Has ido del alfabeto cuántico hasta las correcciones de un bucle.',
    explanation: {
      intuitive: 'Cada nivel de detalle añade historias más complicadas, y cada una pesa unas cien veces menos que la anterior. Así puede la QED predecir con una precisión asombrosa.',
      scientific:
        'A un bucle, la dispersión de Møller recibe correcciones de vértice, de polarización del vacío, de autoenergía y de cajas (directas y cruzadas). Todas son ∝ α respecto al árbol, y algunas tienen divergencias infrarrojas que solo se cancelan al sumar la radiación de frenado del capítulo 6.',
      math: 'σ = σ₀ [1 + (α/π) C + 𝒪(α²)], con σ₀ ∝ α². Las divergencias infrarrojas se cancelan entre ee → ee (un bucle) y ee → eeγ (teorema de Bloch–Nordsieck).',
    },
    concepts: [],
  },
];
