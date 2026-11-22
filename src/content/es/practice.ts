import type { PracticeText } from '../practice';

export const practiceText: PracticeText = {
  processes: {
    moller: 'Dispersión de Møller (e⁻e⁻ → e⁻e⁻)',
    bhabha: 'Dispersión de Bhabha (e⁻e⁺ → e⁻e⁺)',
    annihilation: 'Aniquilación (e⁻e⁺ → γγ)',
    compton: 'Dispersión Compton (e⁻γ → e⁻γ)',
    pairProduction: 'Creación de pares (γγ → e⁻e⁺)',
    positronScattering: 'Dispersión positrón–positrón (e⁺e⁺ → e⁺e⁺)',
  },
  identify: {
    prompt: '¿Qué proceso representa este diagrama?',
    feedback: 'Lee primero las partículas de la izquierda (entran) y después las de la derecha (salen).',
    hints: ['Identifica las partículas que entran por la izquierda.', 'Flecha a favor del tiempo: e⁻. Contra el tiempo: e⁺. Ondulada: γ.'],
  },
  internal: {
    prompt: 'Toca la línea interna (la partícula virtual).',
    wrongDefault: 'Esa línea toca un borde: es externa.',
    hints: ['Busca la línea que une dos vértices.', 'No toca ningún borde del diagrama.'],
  },
  species: {
    prompts: {
      'e-': { in: { one: 'Toca el electrón que entra.', many: 'Toca un electrón que entra.' }, out: { one: 'Toca el electrón que sale.', many: 'Toca un electrón que sale.' } },
      'e+': { in: { one: 'Toca el positrón que entra.', many: 'Toca un positrón que entra.' }, out: { one: 'Toca el positrón que sale.', many: 'Toca un positrón que sale.' } },
      gamma: { in: { one: 'Toca el fotón que entra.', many: 'Toca un fotón que entra.' }, out: { one: 'Toca el fotón que sale.', many: 'Toca un fotón que sale.' } },
    },
    wrongDefault: 'Fíjate en el tipo de línea, en su flecha y en el lado donde está.',
    hintIn: 'Lo que entra está a la izquierda.',
    hintOut: 'Lo que sale está a la derecha.',
    hint: 'Flecha a favor del tiempo: e⁻. Contra el tiempo: e⁺. Ondulada: γ.',
  },
  validity: {
    prompt: '¿Cumple este diagrama las reglas de QED?',
    yes: 'Sí, es válido',
    no: 'No, rompe alguna regla',
    valid: 'Cada vértice tiene un fotón, una flecha que entra y otra que sale.',
    hints: ['Revisa los vértices uno a uno.', 'En cada vértice: exactamente un fotón, una flecha que entra y una que sale.'],
  },
  channel: {
    prompt: '¿Qué tipo de contribución (canal) es este diagrama?',
    options: {
      s: 'Canal s: las dos partículas iniciales comparten vértice',
      t: 'Canal t: cada partícula inicial comparte vértice con la final del mismo lado',
      u: 'Canal u: las líneas se cruzan',
    },
    feedback: 'Mira qué partículas comparten el vértice con la de arriba a la izquierda.',
    hints: ['Fíjate en la partícula de arriba a la izquierda.', '¿Comparte vértice con la otra inicial (s), con la final de arriba (t) o con la final de abajo (u)?'],
  },
};
