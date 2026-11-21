package dev.mmartos.feynmanquest.core.content

import dev.mmartos.feynmanquest.core.engine.Diagram
import dev.mmartos.feynmanquest.core.engine.EdgeType
import dev.mmartos.feynmanquest.core.engine.ValidationOptions
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/* Content model — mirrors src/game/types.ts. Loaded from shared/content/es.json. */

@Serializable
enum class Mechanic {
  @SerialName("decode") Decode,
  @SerialName("build") Build,
  @SerialName("debug") Debug,
}

@Serializable
data class Explanation(val intuitive: String, val scientific: String, val math: String)

@Serializable
enum class Tappable {
  @SerialName("none") None,
  @SerialName("edges") Edges,
  @SerialName("nodes") Nodes,
  @SerialName("all") All,
}

@Serializable
enum class TapMode {
  @SerialName("any") Any,
  @SerialName("all") All,
}

@Serializable
data class ChoiceOption(
  val id: String,
  val text: String,
  val correct: Boolean = false,
  val feedback: String? = null,
  val diagram: Diagram? = null,
)

@Serializable
data class LabelledDiagram(val label: String, val diagram: Diagram)

@Serializable
sealed interface Step {
  val id: String
  val prompt: String
  val hints: List<String>
  val solved: String?
}

@Serializable
@SerialName("tap")
data class TapStep(
  override val id: String,
  override val prompt: String,
  override val hints: List<String>,
  override val solved: String? = null,
  val diagram: Diagram,
  val targets: List<String>,
  val mode: TapMode,
  val tappable: Tappable,
  val wrong: Map<String, String>? = null,
  val wrongDefault: String,
) : Step

@Serializable
@SerialName("choice")
data class ChoiceStep(
  override val id: String,
  override val prompt: String,
  override val hints: List<String>,
  override val solved: String? = null,
  val diagram: Diagram? = null,
  val playback: Boolean = false,
  val diagrams: List<LabelledDiagram>? = null,
  val options: List<ChoiceOption>,
) : Step

@Serializable
@SerialName("build")
data class BuildStep(
  override val id: String,
  override val prompt: String,
  override val hints: List<String>,
  override val solved: String? = null,
  val diagram: Diagram,
  val palette: List<EdgeType>,
  val validation: ValidationOptions,
  val reference: LabelledDiagram? = null,
) : Step

@Serializable
data class Level(
  val id: Int,
  val chapter: Int,
  val title: String,
  val mechanic: Mechanic,
  val intro: String,
  val steps: List<Step>,
  val success: String,
  val explanation: Explanation,
  val concepts: List<String>,
)

@Serializable
data class Chapter(val id: Int, val title: String, val subtitle: String, val goals: String, val color: String)

@Serializable
enum class ConceptKind {
  @SerialName("particle") Particle,
  @SerialName("rule") Rule,
  @SerialName("process") Process,
  @SerialName("idea") Idea,
}

@Serializable
data class Concept(
  val id: String,
  val title: String,
  val kind: ConceptKind,
  val summary: String,
  val body: String,
  val diagram: Diagram? = null,
  val symbol: String? = null,
)

@Serializable
data class Rank(val title: String, val minXp: Int)

@Serializable
data class Scoring(val xpBase: Int, val xpPerStar: Int, val ranks: List<Rank>)

@Serializable
data class Art(val home: Diagram, val onboarding: Diagram)

@Serializable
data class Content(
  val locale: String,
  val chapters: List<Chapter>,
  val levels: List<Level>,
  val concepts: List<Concept>,
  val scoring: Scoring,
  val art: Art,
) {
  val conceptById: Map<String, Concept> by lazy { concepts.associateBy { it.id } }
  fun level(id: Int): Level? = levels.firstOrNull { it.id == id }
  fun chapter(id: Int): Chapter? = chapters.firstOrNull { it.id == id }
  fun levelsOf(chapter: Int): List<Level> = levels.filter { it.chapter == chapter }

  companion object {
    val json = Json {
      ignoreUnknownKeys = true
      classDiscriminator = "kind"
      explicitNulls = false
    }

    fun parse(text: String): Content = json.decodeFromString(serializer(), text)
  }
}

/** First diagram of a level, used as the hero illustration. */
fun Level.firstDiagram(): Diagram? = steps.firstNotNullOfOrNull { s ->
  when (s) {
    is BuildStep -> s.diagram
    is TapStep -> s.diagram
    is ChoiceStep -> s.diagram ?: s.diagrams?.firstOrNull()?.diagram
  }
}
