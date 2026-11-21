package dev.mmartos.feynmanquest.core.content

import dev.mmartos.feynmanquest.core.engine.Issue
import dev.mmartos.feynmanquest.core.engine.IssueCode
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.intOrNull

/** Pedagogical message for a validation issue (Spanish). Port of src/content/es/issues.ts. */
@Serializable
data class IssueText(val title: String, val body: String)

private val SPECIES = mapOf("e-" to "un electrón (e⁻)", "e+" to "un positrón (e⁺)", "gamma" to "un fotón (γ)", "?" to "otra cosa")
private val CHANNEL = mapOf(
  "s" to "canal s (las partículas iniciales se unen en un vértice)",
  "t" to "canal t (cada partícula conserva su «lado»)",
  "u" to "canal u (las líneas se cruzan)",
  "?" to "otro tipo",
)

private fun Issue.str(key: String): String = data?.get(key)?.content ?: "undefined"
private fun Issue.int(key: String): Int? = (data?.get(key) as JsonPrimitive?)?.intOrNull

fun issueText(i: Issue): IssueText = when (i.code) {
  IssueCode.EXTERNAL_UNCONNECTED -> IssueText(
    "Falta una conexión",
    "Hay una partícula externa sin línea. Todas las partículas que entran y salen deben participar en el diagrama.",
  )
  IssueCode.EXTERNAL_OVERCONNECTED -> IssueText(
    "Demasiadas líneas",
    "Cada partícula externa se representa con una única línea que llega a un vértice.",
  )
  IssueCode.EXTERNAL_TO_EXTERNAL -> IssueText(
    "Una línea que no interactúa",
    "Has unido dos partículas externas directamente. Sin vértice no hay interacción: las líneas deben encontrarse en un vértice.",
  )
  IssueCode.SELF_LOOP -> IssueText("Línea en bucle", "Una línea no puede empezar y terminar en el mismo punto en esta campaña.")
  IssueCode.VERTEX_UNUSED -> IssueText(
    "Vértice vacío",
    "Hay un vértice sin usar. En este desafío todos los vértices deben formar parte del diagrama.",
  )
  IssueCode.VERTEX_DEGREE -> IssueText(
    "Vértice con ${i.int("degree") ?: "?"} líneas",
    "Un vértice fundamental de QED une exactamente tres líneas: dos de fermión (una flecha entra y otra sale) y un fotón.",
  )
  IssueCode.VERTEX_PHOTON_COUNT -> if (i.int("photons") == 0) IssueText(
    "Vértice sin fotón",
    "Este vértice une tres líneas de fermión. En QED, el electrón interactúa emitiendo o absorbiendo un fotón: cada vértice necesita exactamente un fotón.",
  ) else IssueText(
    "Demasiados fotones en un vértice",
    "Un vértice QED tiene un único fotón. El fotón no tiene carga, así que dos fotones no pueden interactuar directamente en un vértice fundamental.",
  )
  IssueCode.VERTEX_FERMION_FLOW -> IssueText(
    "Las flechas no fluyen",
    "En este vértice ${if (i.int("arrowsIn") == 0) "ninguna flecha entra" else "entran dos flechas"}. En cada vértice una flecha debe entrar y otra salir: es la forma visual de la conservación de la carga eléctrica.",
  )
  IssueCode.DISCONNECTED -> IssueText(
    "Partes separadas",
    "El diagrama está dividido en trozos que no se tocan. Para que haya interacción entre todas las partículas, todo debe estar conectado.",
  )
  IssueCode.LOOP -> IssueText(
    "Hay un bucle",
    "Tu diagrama contiene un circuito cerrado (un bucle). Los bucles son correcciones de orden superior; en este desafío buscamos diagramas de orden árbol.",
  )
  IssueCode.FURRY -> IssueText(
    "Un bucle que se anula",
    "Tu bucle de electrones tiene ${i.str("photons")} ${if (i.int("photons") == 1) "fotón" else "fotones"} enganchados: un número impar. Por el teorema de Furry, este bucle y el mismo recorrido en sentido contrario se cancelan exactamente.",
  )
  IssueCode.EXTERNAL_MISMATCH -> IssueText(
    "Partícula equivocada",
    "Ahí debería haber ${SPECIES[i.str("expected")]}, pero tu línea representa ${SPECIES[i.str("got")]}. Recuerda: la flecha a favor del tiempo es un electrón; en contra del tiempo, un positrón.",
  )
  IssueCode.CHARGE_NOT_CONSERVED -> IssueText(
    "La carga no se conserva",
    "La carga inicial es ${i.str("initial")} y la final ${i.str("final")}. Ningún proceso de QED puede cambiar la carga total.",
  )
  IssueCode.KINEMATICALLY_FORBIDDEN -> IssueText(
    "Admisible, pero no realizable",
    "El vértice es correcto, pero un proceso de un solo vértice con partículas libres reales no puede conservar a la vez la energía y el momento.",
  )
  IssueCode.WRONG_CHANNEL -> IssueText(
    "Diagrama válido, pero no el pedido",
    "Has construido un diagrama de ${CHANNEL[i.str("got")]}. Se pedía uno de ${CHANNEL[i.str("expected")]}.",
  )
  IssueCode.SAME_AS_REFERENCE -> IssueText(
    "Es el mismo diagrama",
    "Aunque lo dibujes de otra forma, conecta las mismas partículas en los mismos vértices: es la misma contribución. Busca otra forma de emparejar las partículas.",
  )
}
