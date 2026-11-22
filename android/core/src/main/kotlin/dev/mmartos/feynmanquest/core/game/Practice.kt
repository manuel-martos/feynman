package dev.mmartos.feynmanquest.core.game

import dev.mmartos.feynmanquest.core.content.ChoiceOption
import dev.mmartos.feynmanquest.core.content.ChoiceStep
import dev.mmartos.feynmanquest.core.content.PracticeText
import dev.mmartos.feynmanquest.core.content.Step
import dev.mmartos.feynmanquest.core.content.TapMode
import dev.mmartos.feynmanquest.core.content.TapStep
import dev.mmartos.feynmanquest.core.content.Tappable
import dev.mmartos.feynmanquest.core.engine.Channel
import dev.mmartos.feynmanquest.core.engine.Diagram
import dev.mmartos.feynmanquest.core.engine.EdgeRole
import dev.mmartos.feynmanquest.core.engine.EdgeType
import dev.mmartos.feynmanquest.core.engine.Issue
import dev.mmartos.feynmanquest.core.engine.NodeKind
import dev.mmartos.feynmanquest.core.engine.PROCESSES
import dev.mmartos.feynmanquest.core.engine.channelOf
import dev.mmartos.feynmanquest.core.engine.edgeRole
import dev.mmartos.feynmanquest.core.engine.enumerateTree2to2
import dev.mmartos.feynmanquest.core.engine.validate
import kotlin.random.Random

/**
 * Mastery mode — procedurally generated review questions. Diagrams come
 * from the engine's enumerator, so every question is new yet always correct.
 * Port of src/content/practice.ts; the wording comes from the content's `practice` table.
 */
class PracticeGenerator(
  private val text: PracticeText,
  /** Explanation of a validation issue, in the same language as [text]. */
  private val issueBody: (Issue) -> String,
  private val random: Random = Random.Default,
) {
  private val names = text.processes
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
      prompt = text.identify.prompt,
      diagram = d,
      options = (listOf(p) + others).shuffled(random).map { x ->
        ChoiceOption(x, names.getValue(x), correct = x == p, feedback = if (x == p) null else text.identify.feedback)
      },
      hints = text.identify.hints,
    )
  }

  private fun tapInternal(pool: List<String>): Step {
    val (_, d) = randomDiagram(pool)
    return TapStep(
      id = sid("internal"),
      prompt = text.internal.prompt,
      diagram = d,
      targets = d.edges.filter { d.edgeRole(it) == EdgeRole.Internal }.map { it.id },
      mode = TapMode.Any,
      tappable = Tappable.Edges,
      wrongDefault = text.internal.wrongDefault,
      hints = text.internal.hints,
    )
  }

  private fun tapSpecies(pool: List<String>): Step {
    val (p, d) = randomDiagram(pool)
    val legs = PROCESSES.getValue(p)
    val leg = legs.pick()
    val targets = legs.filter { it.species == leg.species && it.kind == leg.kind }.map { it.id }
    val prompts = text.species.prompts.getValue(leg.species.id)
    val side = if (leg.kind == NodeKind.In) prompts.incoming else prompts.outgoing
    return TapStep(
      id = sid("species"),
      prompt = if (targets.size > 1) side.many else side.one,
      diagram = d,
      targets = targets,
      mode = TapMode.Any,
      tappable = Tappable.Edges,
      wrongDefault = text.species.wrongDefault,
      hints = listOf(if (leg.kind == NodeKind.In) text.species.hintIn else text.species.hintOut, text.species.hint),
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
    val why = if (r.ok) text.validity.valid else issueBody(r.issues[0])
    return ChoiceStep(
      id = sid("valid"),
      prompt = text.validity.prompt,
      diagram = shown,
      options = listOf(
        ChoiceOption("yes", text.validity.yes, correct = r.ok, feedback = if (r.ok) null else why),
        ChoiceOption("no", text.validity.no, correct = !r.ok, feedback = if (r.ok) why else null),
      ),
      hints = text.validity.hints,
      solved = why,
    )
  }

  private fun channel(pool: List<String>): Step {
    val (_, d) = randomDiagram(pool)
    val ch = channelOf(d)!!
    return ChoiceStep(
      id = sid("channel"),
      prompt = text.channel.prompt,
      diagram = d,
      options = Channel.entries.map { c ->
        ChoiceOption(c.id, text.channel.options.getValue(c.id), correct = c == ch, feedback = if (c == ch) null else text.channel.feedback)
      },
      hints = text.channel.hints,
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
