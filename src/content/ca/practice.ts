import type { PracticeText } from '../practice';

export const practiceText: PracticeText = {
  processes: {
    moller: 'Dispersió de Møller (e⁻e⁻ → e⁻e⁻)',
    bhabha: 'Dispersió de Bhabha (e⁻e⁺ → e⁻e⁺)',
    annihilation: 'Anihilació (e⁻e⁺ → γγ)',
    compton: 'Dispersió Compton (e⁻γ → e⁻γ)',
    pairProduction: 'Creació de parells (γγ → e⁻e⁺)',
    positronScattering: 'Dispersió positró–positró (e⁺e⁺ → e⁺e⁺)',
  },
  identify: {
    prompt: 'Quin procés representa aquest diagrama?',
    feedback: 'Llegeix primer les partícules de l\'esquerra (entren) i després les de la dreta (surten).',
    hints: ['Identifica les partícules que entren per l\'esquerra.', 'Fletxa a favor del temps: e⁻. Contra el temps: e⁺. Ondulada: γ.'],
  },
  internal: {
    prompt: 'Toca la línia interna (la partícula virtual).',
    wrongDefault: 'Aquesta línia toca una vora: és externa.',
    hints: ['Busca la línia que uneix dos vèrtexs.', 'No toca cap vora del diagrama.'],
  },
  species: {
    prompts: {
      'e-': { in: { one: 'Toca l\'electró que entra.', many: 'Toca un electró que entra.' }, out: { one: 'Toca l\'electró que surt.', many: 'Toca un electró que surt.' } },
      'e+': { in: { one: 'Toca el positró que entra.', many: 'Toca un positró que entra.' }, out: { one: 'Toca el positró que surt.', many: 'Toca un positró que surt.' } },
      gamma: { in: { one: 'Toca el fotó que entra.', many: 'Toca un fotó que entra.' }, out: { one: 'Toca el fotó que surt.', many: 'Toca un fotó que surt.' } },
    },
    wrongDefault: "Fixa't en el tipus de línia, en la seva fletxa i en el costat on és.",
    hintIn: 'El que entra és a l\'esquerra.',
    hintOut: 'El que surt és a la dreta.',
    hint: 'Fletxa a favor del temps: e⁻. Contra el temps: e⁺. Ondulada: γ.',
  },
  validity: {
    prompt: 'Compleix aquest diagrama les regles de QED?',
    yes: 'Sí, és vàlid',
    no: 'No, trenca alguna regla',
    valid: 'Cada vèrtex té un fotó, una fletxa que entra i una altra que surt.',
    hints: ['Revisa els vèrtexs un per un.', 'A cada vèrtex: exactament un fotó, una fletxa que entra i una que surt.'],
  },
  channel: {
    prompt: 'Quin tipus de contribució (canal) és aquest diagrama?',
    options: {
      s: 'Canal s: les dues partícules inicials comparteixen vèrtex',
      t: 'Canal t: cada partícula inicial comparteix vèrtex amb la final del mateix costat',
      u: 'Canal u: les línies es creuen',
    },
    feedback: 'Mira quines partícules comparteixen el vèrtex amb la de dalt a l\'esquerra.',
    hints: ['Fixa\'t en la partícula de dalt a l\'esquerra.', 'Comparteix vèrtex amb l\'altra inicial (s), amb la final de dalt (t) o amb la final de baix (u)?'],
  },
};
