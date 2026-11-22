package dev.mmartos.feynmanquest.core.engine

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonPrimitive

/*
 * Diagram Engine — typed graph model for QED Feynman diagrams.
 *
 * Port of src/engine (TypeScript). Conventions:
 * - Time flows from left (initial state) to right (final state).
 * - Fermion edges are directed: from → to is the arrow (fermion-number flow).
 *   An electron has its arrow along time, a positron against time.
 * - Photon edges are undirected.
 * - Geometry (x, y) is purely presentational and never affects validation.
 */

@Serializable
enum class EdgeType {
  @SerialName("fermion") Fermion,
  @SerialName("photon") Photon,
}

@Serializable
enum class Species(val symbol: String, val charge: Int) {
  @SerialName("e-") Electron("e⁻", -1),
  @SerialName("e+") Positron("e⁺", 1),
  @SerialName("gamma") Photon("γ", 0);

  /** The id used in data and messages ("e-", "e+", "gamma"). */
  val id: String get() = when (this) { Electron -> "e-"; Positron -> "e+"; Photon -> "gamma" }
}

@Serializable
enum class NodeKind {
  @SerialName("in") In,
  @SerialName("out") Out,
  @SerialName("vertex") Vertex,
}

@Serializable
data class DiagramNode(
  val id: String,
  val kind: NodeKind,
  val x: Double,
  val y: Double,
  /** For external nodes in Build levels: which particle must end here. */
  val expect: Species? = null,
  /** Optional short tag shown next to an external node. */
  val tag: String? = null,
) {
  val isExternal: Boolean get() = kind != NodeKind.Vertex
}

@Serializable
data class DiagramEdge(
  val id: String,
  val type: EdgeType,
  val from: String,
  val to: String,
  /** Locked edges are part of the puzzle and cannot be edited. */
  val locked: Boolean? = null,
  /** Presentation: curvature as a fraction of the edge length. */
  val bend: Double? = null,
  /** Presentation override of the label. */
  val labelOverride: String? = null,
) {
  val isLocked: Boolean get() = locked != false
}

@Serializable
data class Diagram(val nodes: List<DiagramNode>, val edges: List<DiagramEdge>)

@Serializable
enum class Channel {
  @SerialName("s") S,
  @SerialName("t") T,
  @SerialName("u") U;

  val id: String get() = name.lowercase()
}

@Serializable
enum class ValidationLayer {
  @SerialName("structural") Structural,
  @SerialName("theory") Theory,
  @SerialName("physical") Physical,
  @SerialName("goal") Goal,
}

@Serializable
enum class IssueCode {
  EXTERNAL_UNCONNECTED,
  EXTERNAL_OVERCONNECTED,
  EXTERNAL_TO_EXTERNAL,
  SELF_LOOP,
  VERTEX_UNUSED,
  VERTEX_DEGREE,
  VERTEX_PHOTON_COUNT,
  VERTEX_FERMION_FLOW,
  DISCONNECTED,
  LOOP,
  FURRY,
  EXTERNAL_MISMATCH,
  CHARGE_NOT_CONSERVED,
  KINEMATICALLY_FORBIDDEN,
  WRONG_CHANNEL,
  SAME_AS_REFERENCE,
}

@Serializable
data class Issue(
  val code: IssueCode,
  val layer: ValidationLayer,
  /** Ids of nodes and/or edges involved, to be highlighted by the UI. */
  val elements: List<String>,
  /** Extra data for message interpolation (numbers or strings). */
  val data: Map<String, JsonPrimitive>? = null,
)

@Serializable
data class ValidationOptions(
  /** Treat the diagram as a complete process with real external particles. */
  val kinematics: Boolean? = null,
  /** Require a specific Mandelstam channel (2 → 2 only). */
  val channel: Channel? = null,
  /** Require a contribution topologically different from these diagrams. */
  val differentFrom: List<Diagram>? = null,
  /** Number of independent loops allowed (0 = tree level). */
  val loops: Int? = null,
)

data class ValidationResult(val ok: Boolean, val issues: List<Issue>)
