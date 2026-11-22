import type { PracticeText } from '../practice';

export const practiceText: PracticeText = {
  processes: {
    moller: 'Møller scattering (e⁻e⁻ → e⁻e⁻)',
    bhabha: 'Bhabha scattering (e⁻e⁺ → e⁻e⁺)',
    annihilation: 'Annihilation (e⁻e⁺ → γγ)',
    compton: 'Compton scattering (e⁻γ → e⁻γ)',
    pairProduction: 'Pair production (γγ → e⁻e⁺)',
    positronScattering: 'Positron–positron scattering (e⁺e⁺ → e⁺e⁺)',
  },
  identify: {
    prompt: 'What process does this diagram represent?',
    feedback: 'First read the particles on the left (coming in), then the ones on the right (going out).',
    hints: ['Identify the particles coming in on the left.', 'Arrow forward in time: e⁻. Against time: e⁺. Wavy: γ.'],
  },
  internal: {
    prompt: 'Tap the internal line (the virtual particle).',
    wrongDefault: 'That line touches an edge: it\'s external.',
    hints: ['Look for the line joining two vertices.', 'It doesn\'t touch any edge of the diagram.'],
  },
  species: {
    prompts: {
      'e-': { in: { one: 'Tap the electron coming in.', many: 'Tap an electron coming in.' }, out: { one: 'Tap the electron going out.', many: 'Tap an electron going out.' } },
      'e+': { in: { one: 'Tap the positron coming in.', many: 'Tap a positron coming in.' }, out: { one: 'Tap the positron going out.', many: 'Tap a positron going out.' } },
      gamma: { in: { one: 'Tap the photon coming in.', many: 'Tap a photon coming in.' }, out: { one: 'Tap the photon going out.', many: 'Tap a photon going out.' } },
    },
    wrongDefault: 'Look at the kind of line, its arrow and which side it\'s on.',
    hintIn: 'What comes in is on the left.',
    hintOut: 'What goes out is on the right.',
    hint: 'Arrow forward in time: e⁻. Against time: e⁺. Wavy: γ.',
  },
  validity: {
    prompt: 'Does this diagram follow the rules of QED?',
    yes: 'Yes, it\'s valid',
    no: 'No, it breaks a rule',
    valid: 'Each vertex has a photon, an arrow coming in and another going out.',
    hints: ['Check the vertices one by one.', 'At each vertex: exactly one photon, one arrow coming in and one going out.'],
  },
  channel: {
    prompt: 'What kind of contribution (channel) is this diagram?',
    options: {
      s: 's channel: the two initial particles share a vertex',
      t: 't channel: each initial particle shares a vertex with the final one on the same side',
      u: 'u channel: the lines cross',
    },
    feedback: 'Look at which particles share the vertex with the top-left one.',
    hints: ['Look at the top-left particle.', 'Does it share a vertex with the other initial particle (s), with the top final one (t) or with the bottom final one (u)?'],
  },
};
