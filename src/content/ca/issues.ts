import type { Issue, IssueCode } from '../../engine';
import type { IssueText } from '../es/issues';

const SPECIES: Record<string, string> = { 'e-': 'un electró (e⁻)', 'e+': 'un positró (e⁺)', gamma: 'un fotó (γ)', '?': 'una altra cosa' };
const CHANNEL: Record<string, string> = {
  s: 'canal s (les partícules inicials s\'uneixen en un vèrtex)',
  t: 'canal t (cada partícula conserva el seu «costat»)',
  u: 'canal u (les línies es creuen)',
  '?': 'un altre tipus',
};

const MESSAGES: Record<IssueCode, (i: Issue) => IssueText> = {
  EXTERNAL_UNCONNECTED: () => ({
    title: 'Falta una connexió',
    body: 'Hi ha una partícula externa sense línia. Totes les partícules que entren i surten han de participar en el diagrama.',
  }),
  EXTERNAL_OVERCONNECTED: () => ({
    title: 'Massa línies',
    body: 'Cada partícula externa es representa amb una única línia que arriba a un vèrtex.',
  }),
  EXTERNAL_TO_EXTERNAL: () => ({
    title: 'Una línia que no interactua',
    body: 'Has unit dues partícules externes directament. Sense vèrtex no hi ha interacció: les línies s\'han de trobar en un vèrtex.',
  }),
  SELF_LOOP: () => ({ title: 'Línia en bucle', body: 'En aquesta campanya una línia no pot començar i acabar al mateix punt.' }),
  VERTEX_UNUSED: () => ({
    title: 'Vèrtex buit',
    body: 'Hi ha un vèrtex sense fer servir. En aquest repte tots els vèrtexs han de formar part del diagrama.',
  }),
  VERTEX_DEGREE: (i) => ({
    title: `Vèrtex amb ${i.data?.degree ?? '?'} línies`,
    body: 'Un vèrtex fonamental de QED uneix exactament tres línies: dues de fermió (una fletxa entra i una altra surt) i un fotó.',
  }),
  VERTEX_PHOTON_COUNT: (i) => ({
    title: i.data?.photons === 0 ? 'Vèrtex sense fotó' : 'Massa fotons en un vèrtex',
    body:
      i.data?.photons === 0
        ? 'Aquest vèrtex uneix tres línies de fermió. En QED, l\'electró interactua emetent o absorbint un fotó: cada vèrtex necessita exactament un fotó.'
        : 'Un vèrtex QED té un únic fotó. El fotó no té càrrega, així que dos fotons no poden interactuar directament en un vèrtex fonamental.',
  }),
  VERTEX_FERMION_FLOW: (i) => ({
    title: 'Les fletxes no flueixen',
    body: `En aquest vèrtex ${i.data?.arrowsIn === 0 ? 'no hi entra cap fletxa' : 'hi entren dues fletxes'}. A cada vèrtex una fletxa ha d'entrar i una altra sortir: és la forma visual de la conservació de la càrrega elèctrica.`,
  }),
  DISCONNECTED: () => ({
    title: 'Parts separades',
    body: 'El diagrama està dividit en trossos que no es toquen. Perquè hi hagi interacció entre totes les partícules, tot ha d\'estar connectat.',
  }),
  LOOP: () => ({
    title: 'Hi ha un bucle',
    body: 'El teu diagrama conté un circuit tancat (un bucle). Els bucles són correccions d\'ordre superior; en aquest repte busquem diagrames d\'ordre arbre.',
  }),
  FURRY: (i) => ({
    title: 'Un bucle que s\'anul·la',
    body: `El teu bucle d'electrons té ${i.data?.photons} ${i.data?.photons === 1 ? 'fotó enganxat' : 'fotons enganxats'}: un nombre senar. Pel teorema de Furry, aquest bucle i el mateix recorregut en sentit contrari es cancel·len exactament.`,
  }),
  EXTERNAL_MISMATCH: (i) => ({
    title: 'Partícula equivocada',
    body: `Aquí hi hauria d'haver ${SPECIES[String(i.data?.expected)]}, però la teva línia representa ${SPECIES[String(i.data?.got)]}. Recorda: la fletxa a favor del temps és un electró; contra el temps, un positró.`,
  }),
  CHARGE_NOT_CONSERVED: (i) => ({
    title: 'La càrrega no es conserva',
    body: `La càrrega inicial és ${i.data?.initial} i la final ${i.data?.final}. Cap procés de QED no pot canviar la càrrega total.`,
  }),
  KINEMATICALLY_FORBIDDEN: () => ({
    title: 'Admissible, però no realitzable',
    body: 'El vèrtex és correcte, però un procés d\'un sol vèrtex amb partícules lliures reals no pot conservar alhora l\'energia i el moment.',
  }),
  WRONG_CHANNEL: (i) => ({
    title: 'Diagrama vàlid, però no el demanat',
    body: `Has construït un diagrama de ${CHANNEL[String(i.data?.got)]}. Se'n demanava un de ${CHANNEL[String(i.data?.expected)]}.`,
  }),
  SAME_AS_REFERENCE: () => ({
    title: 'És el mateix diagrama',
    body: 'Encara que el dibuixis d\'una altra manera, connecta les mateixes partícules als mateixos vèrtexs: és la mateixa contribució. Busca una altra manera d\'aparellar les partícules.',
  }),
};

export function issueText(i: Issue): IssueText {
  return MESSAGES[i.code](i);
}
