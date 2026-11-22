package dev.mmartos.feynmanquest.core.content

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Fixed phrases of Mastery mode, per language. Mirrors `PracticeText` in src/content/practice.ts. */
@Serializable
data class PracticeText(
  /** Process id → display name, in the order the web app lists them. */
  val processes: Map<String, String>,
  val identify: Identify,
  val internal: Internal,
  val species: SpeciesText,
  val validity: Validity,
  val channel: ChannelText,
) {
  @Serializable
  data class Identify(val prompt: String, val feedback: String, val hints: List<String>)

  @Serializable
  data class Internal(val prompt: String, val wrongDefault: String, val hints: List<String>)

  @Serializable
  data class Side(val one: String, val many: String)

  @Serializable
  data class Sides(@SerialName("in") val incoming: Side, @SerialName("out") val outgoing: Side)

  @Serializable
  data class SpeciesText(
    /** Species id ("e-", "e+", "gamma") → prompts. */
    val prompts: Map<String, Sides>,
    val wrongDefault: String,
    val hintIn: String,
    val hintOut: String,
    val hint: String,
  )

  @Serializable
  data class Validity(val prompt: String, val yes: String, val no: String, val valid: String, val hints: List<String>)

  @Serializable
  data class ChannelText(val prompt: String, val options: Map<String, String>, val feedback: String, val hints: List<String>)
}
