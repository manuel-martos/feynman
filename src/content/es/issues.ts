import type { Issue, IssueCode } from '../../engine';

const SPECIES: Record<string, string> = { 'e-': 'un electrón (e⁻)', 'e+': 'un positrón (e⁺)', gamma: 'un fotón (γ)', '?': 'otra cosa' };
const CHANNEL: Record<string, string> = {
  s: 'canal s (las partículas iniciales se unen en un vértice)',
  t: 'canal t (cada partícula conserva su «lado»)',
  u: 'canal u (las líneas se cruzan)',
  '?': 'otro tipo',
};

export interface IssueText {
  title: string;
  body: string;
}

const MESSAGES: Record<IssueCode, (i: Issue) => IssueText> = {
  EXTERNAL_UNCONNECTED: () => ({
    title: 'Falta una conexión',
    body: 'Hay una partícula externa sin línea. Todas las partículas que entran y salen deben participar en el diagrama.',
  }),
  EXTERNAL_OVERCONNECTED: () => ({
    title: 'Demasiadas líneas',
    body: 'Cada partícula externa se representa con una única línea que llega a un vértice.',
  }),
  EXTERNAL_TO_EXTERNAL: () => ({
    title: 'Una línea que no interactúa',
    body: 'Has unido dos partículas externas directamente. Sin vértice no hay interacción: las líneas deben encontrarse en un vértice.',
  }),
  SELF_LOOP: () => ({ title: 'Línea en bucle', body: 'Una línea no puede empezar y terminar en el mismo punto en esta campaña.' }),
  VERTEX_UNUSED: () => ({
    title: 'Vértice vacío',
    body: 'Hay un vértice sin usar. En este desafío todos los vértices deben formar parte del diagrama.',
  }),
  VERTEX_DEGREE: (i) => ({
    title: `Vértice con ${i.data?.degree ?? '?'} líneas`,
    body: 'Un vértice fundamental de QED une exactamente tres líneas: dos de fermión (una flecha entra y otra sale) y un fotón.',
  }),
  VERTEX_PHOTON_COUNT: (i) => ({
    title: i.data?.photons === 0 ? 'Vértice sin fotón' : 'Demasiados fotones en un vértice',
    body:
      i.data?.photons === 0
        ? 'Este vértice une tres líneas de fermión. En QED, el electrón interactúa emitiendo o absorbiendo un fotón: cada vértice necesita exactamente un fotón.'
        : 'Un vértice QED tiene un único fotón. El fotón no tiene carga, así que dos fotones no pueden interactuar directamente en un vértice fundamental.',
  }),
  VERTEX_FERMION_FLOW: (i) => ({
    title: 'Las flechas no fluyen',
    body: `En este vértice ${i.data?.arrowsIn === 0 ? 'ninguna flecha entra' : 'entran dos flechas'}. En cada vértice una flecha debe entrar y otra salir: es la forma visual de la conservación de la carga eléctrica.`,
  }),
  DISCONNECTED: () => ({
    title: 'Partes separadas',
    body: 'El diagrama está dividido en trozos que no se tocan. Para que haya interacción entre todas las partículas, todo debe estar conectado.',
  }),
  LOOP: () => ({
    title: 'Hay un bucle',
    body: 'Tu diagrama contiene un circuito cerrado (un bucle). Los bucles son correcciones de orden superior; en esta campaña buscamos diagramas de orden árbol.',
  }),
  EXTERNAL_MISMATCH: (i) => ({
    title: 'Partícula equivocada',
    body: `Ahí debería haber ${SPECIES[String(i.data?.expected)]}, pero tu línea representa ${SPECIES[String(i.data?.got)]}. Recuerda: la flecha a favor del tiempo es un electrón; en contra del tiempo, un positrón.`,
  }),
  CHARGE_NOT_CONSERVED: (i) => ({
    title: 'La carga no se conserva',
    body: `La carga inicial es ${i.data?.initial} y la final ${i.data?.final}. Ningún proceso de QED puede cambiar la carga total.`,
  }),
  KINEMATICALLY_FORBIDDEN: () => ({
    title: 'Admisible, pero no realizable',
    body: 'El vértice es correcto, pero un proceso de un solo vértice con partículas libres reales no puede conservar a la vez la energía y el momento.',
  }),
  WRONG_CHANNEL: (i) => ({
    title: 'Diagrama válido, pero no el pedido',
    body: `Has construido un diagrama de ${CHANNEL[String(i.data?.got)]}. Se pedía uno de ${CHANNEL[String(i.data?.expected)]}.`,
  }),
  SAME_AS_REFERENCE: () => ({
    title: 'Es el mismo diagrama',
    body: 'Aunque lo dibujes de otra forma, conecta las mismas partículas en los mismos vértices: es la misma contribución. Busca otra forma de emparejar las partículas.',
  }),
};

export function issueText(i: Issue): IssueText {
  return MESSAGES[i.code](i);
}
