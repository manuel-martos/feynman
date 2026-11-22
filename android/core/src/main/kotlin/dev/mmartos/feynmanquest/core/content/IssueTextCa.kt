package dev.mmartos.feynmanquest.core.content

import dev.mmartos.feynmanquest.core.engine.Issue
import dev.mmartos.feynmanquest.core.engine.IssueCode

/** Port of src/content/ca/issues.ts. */
private val SPECIES = mapOf("e-" to "un electró (e⁻)", "e+" to "un positró (e⁺)", "gamma" to "un fotó (γ)", "?" to "una altra cosa")
private val CHANNEL = mapOf(
  "s" to "canal s (les partícules inicials s'uneixen en un vèrtex)",
  "t" to "canal t (cada partícula conserva el seu «costat»)",
  "u" to "canal u (les línies es creuen)",
  "?" to "un altre tipus",
)

internal fun issueTextCa(i: Issue): IssueText = when (i.code) {
  IssueCode.EXTERNAL_UNCONNECTED -> IssueText(
    "Falta una connexió",
    "Hi ha una partícula externa sense línia. Totes les partícules que entren i surten han de participar en el diagrama.",
  )
  IssueCode.EXTERNAL_OVERCONNECTED -> IssueText(
    "Massa línies",
    "Cada partícula externa es representa amb una única línia que arriba a un vèrtex.",
  )
  IssueCode.EXTERNAL_TO_EXTERNAL -> IssueText(
    "Una línia que no interactua",
    "Has unit dues partícules externes directament. Sense vèrtex no hi ha interacció: les línies s'han de trobar en un vèrtex.",
  )
  IssueCode.SELF_LOOP -> IssueText("Línia en bucle", "En aquesta campanya una línia no pot començar i acabar al mateix punt.")
  IssueCode.VERTEX_UNUSED -> IssueText(
    "Vèrtex buit",
    "Hi ha un vèrtex sense fer servir. En aquest repte tots els vèrtexs han de formar part del diagrama.",
  )
  IssueCode.VERTEX_DEGREE -> IssueText(
    "Vèrtex amb ${i.int("degree") ?: "?"} línies",
    "Un vèrtex fonamental de QED uneix exactament tres línies: dues de fermió (una fletxa entra i una altra surt) i un fotó.",
  )
  IssueCode.VERTEX_PHOTON_COUNT -> if (i.int("photons") == 0) IssueText(
    "Vèrtex sense fotó",
    "Aquest vèrtex uneix tres línies de fermió. En QED, l'electró interactua emetent o absorbint un fotó: cada vèrtex necessita exactament un fotó.",
  ) else IssueText(
    "Massa fotons en un vèrtex",
    "Un vèrtex QED té un únic fotó. El fotó no té càrrega, així que dos fotons no poden interactuar directament en un vèrtex fonamental.",
  )
  IssueCode.VERTEX_FERMION_FLOW -> IssueText(
    "Les fletxes no flueixen",
    "En aquest vèrtex ${if (i.int("arrowsIn") == 0) "no hi entra cap fletxa" else "hi entren dues fletxes"}. A cada vèrtex una fletxa ha d'entrar i una altra sortir: és la forma visual de la conservació de la càrrega elèctrica.",
  )
  IssueCode.DISCONNECTED -> IssueText(
    "Parts separades",
    "El diagrama està dividit en trossos que no es toquen. Perquè hi hagi interacció entre totes les partícules, tot ha d'estar connectat.",
  )
  IssueCode.LOOP -> IssueText(
    "Hi ha un bucle",
    "El teu diagrama conté un circuit tancat (un bucle). Els bucles són correccions d'ordre superior; en aquest repte busquem diagrames d'ordre arbre.",
  )
  IssueCode.FURRY -> IssueText(
    "Un bucle que s'anul·la",
    "El teu bucle d'electrons té ${i.str("photons")} ${if (i.int("photons") == 1) "fotó enganxat" else "fotons enganxats"}: un nombre senar. Pel teorema de Furry, aquest bucle i el mateix recorregut en sentit contrari es cancel·len exactament.",
  )
  IssueCode.EXTERNAL_MISMATCH -> IssueText(
    "Partícula equivocada",
    "Aquí hi hauria d'haver ${SPECIES[i.str("expected")]}, però la teva línia representa ${SPECIES[i.str("got")]}. Recorda: la fletxa a favor del temps és un electró; contra el temps, un positró.",
  )
  IssueCode.CHARGE_NOT_CONSERVED -> IssueText(
    "La càrrega no es conserva",
    "La càrrega inicial és ${i.str("initial")} i la final ${i.str("final")}. Cap procés de QED no pot canviar la càrrega total.",
  )
  IssueCode.KINEMATICALLY_FORBIDDEN -> IssueText(
    "Admissible, però no realitzable",
    "El vèrtex és correcte, però un procés d'un sol vèrtex amb partícules lliures reals no pot conservar alhora l'energia i el moment.",
  )
  IssueCode.WRONG_CHANNEL -> IssueText(
    "Diagrama vàlid, però no el demanat",
    "Has construït un diagrama de ${CHANNEL[i.str("got")]}. Se'n demanava un de ${CHANNEL[i.str("expected")]}.",
  )
  IssueCode.SAME_AS_REFERENCE -> IssueText(
    "És el mateix diagrama",
    "Encara que el dibuixis d'una altra manera, connecta les mateixes partícules als mateixos vèrtexs: és la mateixa contribució. Busca una altra manera d'aparellar les partícules.",
  )
}
