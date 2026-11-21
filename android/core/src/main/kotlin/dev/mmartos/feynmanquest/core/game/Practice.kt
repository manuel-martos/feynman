package dev.mmartos.feynmanquest.core.game

import dev.mmartos.feynmanquest.core.content.ChoiceOption
import dev.mmartos.feynmanquest.core.content.ChoiceStep
import dev.mmartos.feynmanquest.core.content.Step
import dev.mmartos.feynmanquest.core.content.TapMode
import dev.mmartos.feynmanquest.core.content.TapStep
import dev.mmartos.feynmanquest.core.content.Tappable
import dev.mmartos.feynmanquest.core.content.issueText
import dev.mmartos.feynmanquest.core.engine.Channel
import dev.mmartos.feynmanquest.core.engine.Diagram
import dev.mmartos.feynmanquest.core.engine.EdgeRole
import dev.mmartos.feynmanquest.core.engine.EdgeType
import dev.mmartos.feynmanquest.core.engine.NodeKind
import dev.mmartos.feynmanquest.core.engine.PROCESSES
import dev.mmartos.feynmanquest.core.engine.Species
import dev.mmartos.feynmanquest.core.engine.channelOf
import dev.mmartos.feynmanquest.core.engine.edgeRole
import dev.mmartos.feynmanquest.core.engine.enumerateTree2to2
import dev.mmartos.feynmanquest.core.engine.validate
import kotlin.random.Random

/**
 * "Dominio" mode — procedurally generated review questions. Diagrams come
 * from the engine's enumerator, so every question is new yet always correct.
 * Port of src/content/es/practice.ts.
 */
class PracticeGenerator(private val random: Random = Random.Default) {
  private val names = linkedMapOf(
    "moller" to "Dispersión de Møller (e⁻e⁻ → e⁻e⁻)",
    "bhabha" to "Dispersión de Bhabha (e⁻e⁺ → e⁻e⁺)",
    "annihilation" to "Aniquilación (e⁻e⁺ → γγ)",
    "compton" to "Dispersión Compton (e⁻γ → e⁻γ)",
    "pairProduction" to "Creación de pares (γγ → e⁻e⁺)",
    "positronScattering" to "Dispersión positrón–positrón (e⁺e⁺ → e⁺e⁺)",
  )
  private var uid = 0
  private fun sid(k: String) = "$k-${uid++}"
  private fun <T> List<T>.pick(): T = this[random.nextInt(size)]

  private fun randomDiagram(pool: List<String>): Pair<String, Diagram> {
    val p = pool.pick()
    val d = enumerateTree2to2(PROCESSES.getValue(p)).pick()
    // Rename edges like the campaign fixtures and drop goals.
    return p to Diagram(
      d.nodes.map { it.copy(expect = null) },
      d.edges.map { e -> e.copy(id = listOf(e.from, e.to).firstOrNull { it != "vA" && it != "vB" } ?: "int") },
    )
  }

  private fun identify(pool: List<String>): Step {
    val (p, d) = randomDiagram(pool)
    val others = names.keys.filter { it != p }.shuffled(random).take(2)
    return ChoiceStep(
      id = sid("identify"),
      prompt = "¿Qué proceso representa este diagrama?",
      diagram = d,
      options = (listOf(p) + others).shuffled(random).map { x ->
        ChoiceOption(x, names.getValue(x), correct = x == p, feedback = if (x == p) null else "Lee primero las partículas de la izquierda (entran) y después las de la derecha (salen).")
      },
      hints = listOf("Identifica las partículas que entran por la izquierda.", "Flecha a favor del tiempo: e⁻. Contra el tiempo: e⁺. Ondulada: γ."),
    )
  }

  private fun tapInternal(pool: List<String>): Step {
    val (_, d) = randomDiagram(pool)
    return TapStep(
      id = sid("internal"),
      prompt = "Toca la línea interna (la partícula virtual).",
      diagram = d,
      targets = d.edges.filter { d.edgeRole(it) == EdgeRole.Internal }.map { it.id },
      mode = TapMode.Any,
      tappable = Tappable.Edges,
      wrongDefault = "Esa línea toca un borde: es externa.",
      hints = listOf("Busca la línea que une dos vértices.", "No toca ningún borde del diagrama."),
    )
  }

  private fun tapSpecies(pool: List<String>): Step {
    val (p, d) = randomDiagram(pool)
    val legs = PROCESSES.getValue(p)
    val leg = legs.pick()
    val word = when (leg.species) { Species.Electron -> "electrón"; Species.Positron -> "positrón"; Species.Photon -> "fotón" }
    val side = if (leg.kind == NodeKind.In) "entra" else "sale"
    val targets = legs.filter { it.species == leg.species && it.kind == leg.kind }.map { it.id }
    return TapStep(
      id = sid("species"),
      prompt = "Toca ${if (targets.size > 1) "un" else "el"} $word que $side.",
      diagram = d,
      targets = targets,
      mode = TapMode.Any,
      tappable = Tappable.Edges,
      wrongDefault = "Fíjate en el tipo de línea, en su flecha y en el lado donde está.",
      hints = listOf(
        if (leg.kind == NodeKind.In) "Lo que entra está a la izquierda." else "Lo que sale está a la derecha.",
        "Flecha a favor del tiempo: e⁻. Contra el tiempo: e⁺. Ondulada: γ.",
      ),
    )
  }

  private fun validity(pool: List<String>): Step {
    val (_, d) = randomDiagram(pool)
    var shown = d
    if (random.nextDouble() < 0.6) {
      val edges = d.edges.toMutableList()
      val fermions = edges.indices.filter { edges[it].type == EdgeType.Fermion }
      if (random.nextDouble() < 0.5 || fermions.isEmpty()) {
        val k = random.nextInt(edges.size)
        edges[k] = edges[k].copy(type = if (edges[k].type == EdgeType.Photon) EdgeType.Fermion else EdgeType.Photon)
      } else {
        val k = fermions.pick()
        edges[k] = edges[k].copy(from = edges[k].to, to = edges[k].from)
      }
      shown = d.copy(edges = edges)
    }
    val r = validate(shown)
    val why = if (r.ok) "Cada vértice tiene un fotón, una flecha que entra y otra que sale." else issueText(r.issues[0]).body
    return ChoiceStep(
      id = sid("valid"),
      prompt = "¿Cumple este diagrama las reglas de QED?",
      diagram = shown,
      options = listOf(
        ChoiceOption("yes", "Sí, es válido", correct = r.ok, feedback = if (r.ok) null else why),
        ChoiceOption("no", "No, rompe alguna regla", correct = !r.ok, feedback = if (r.ok) why else null),
      ),
      hints = listOf("Revisa los vértices uno a uno.", "En cada vértice: exactamente un fotón, una flecha que entra y una que sale."),
      solved = why,
    )
  }

  private fun channel(pool: List<String>): Step {
    val (_, d) = randomDiagram(pool)
    val ch = channelOf(d)!!
    val text = mapOf(
      Channel.S to "Canal s: las dos partículas iniciales comparten vértice",
      Channel.T to "Canal t: cada partícula inicial comparte vértice con la final del mismo lado",
      Channel.U to "Canal u: las líneas se cruzan",
    )
    return ChoiceStep(
      id = sid("channel"),
      prompt = "¿Qué tipo de contribución (canal) es este diagrama?",
      diagram = d,
      options = Channel.entries.map { c ->
        ChoiceOption(c.id, text.getValue(c), correct = c == ch, feedback = if (c == ch) null else "Mira qué partículas comparten el vértice con la de arriba a la izquierda.")
      },
      hints = listOf("Fíjate en la partícula de arriba a la izquierda.", "¿Comparte vértice con la otra inicial (s), con la final de arriba (t) o con la final de abajo (u)?"),
    )
  }

  /** A session of six questions; harder kinds appear as the campaign advances. */
  fun session(levelsDone: Int): List<Step> {
    val pool = mutableListOf("moller", "bhabha", "annihilation")
    if (levelsDone >= 16) pool += "compton"
    if (levelsDone >= 22) pool += listOf("pairProduction", "positronScattering")
    val makers = mutableListOf(::identify, ::tapInternal, ::tapSpecies, ::validity)
    if (levelsDone >= 19) makers += ::channel
    val steps = mutableListOf(tapSpecies(pool), identify(pool))
    while (steps.size < 6) steps += makers.pick()(pool)
    return steps.shuffled(random)
  }
}
