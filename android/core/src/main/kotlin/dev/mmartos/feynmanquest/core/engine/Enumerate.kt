package dev.mmartos.feynmanquest.core.engine

import kotlinx.serialization.Serializable

@Serializable
data class ExternalSpec(val id: String, val kind: NodeKind, val species: Species)

/** Does the arrow of this external leg point into the vertex it attaches to? */
private fun arrowIntoVertex(ext: ExternalSpec): Boolean? = when {
  ext.species == Species.Photon -> null
  ext.kind == NodeKind.In -> ext.species == Species.Electron
  else -> ext.species == Species.Positron
}

private fun legEdge(ext: ExternalSpec, vertex: String): DiagramEdge {
  val id = "${ext.id}-$vertex"
  if (ext.species == Species.Photon) return DiagramEdge(id, EdgeType.Photon, ext.id, vertex)
  return if (arrowIntoVertex(ext) == true) DiagramEdge(id, EdgeType.Fermion, ext.id, vertex)
  else DiagramEdge(id, EdgeType.Fermion, vertex, ext.id)
}

private sealed interface Missing {
  data object Photon : Missing
  data class Fermion(val into: Boolean) : Missing
}

/** Third line needed at a vertex that already holds two legs. */
private fun missingLine(legs: List<ExternalSpec>): Missing? {
  var photons = 0
  var ins = 0
  var outs = 0
  for (l in legs) when (arrowIntoVertex(l)) {
    null -> photons++
    true -> ins++
    false -> outs++
  }
  return when {
    photons == 0 && ins == 1 && outs == 1 -> Missing.Photon
    photons == 1 && ins == 1 && outs == 0 -> Missing.Fermion(into = false)
    photons == 1 && ins == 0 && outs == 1 -> Missing.Fermion(into = true)
    else -> null
  }
}

private val EXT_IN = listOf(8.0 to 12.0, 8.0 to 60.0)
private val EXT_OUT = listOf(92.0 to 12.0, 92.0 to 60.0)
private val VERTEX_POS = mapOf(
  Channel.T to listOf(50.0 to 22.0, 50.0 to 50.0),
  Channel.S to listOf(32.0 to 36.0, 68.0 to 36.0),
  Channel.U to listOf(50.0 to 24.0, 50.0 to 48.0),
)

/**
 * Every tree-level QED diagram of a 2 → 2 process built from electrons,
 * positrons and photons, laid out with conventional geometry.
 */
fun enumerateTree2to2(externals: List<ExternalSpec>): List<Diagram> {
  val ins = externals.filter { it.kind == NodeKind.In }.sortedBy { it.id }
  val outs = externals.filter { it.kind == NodeKind.Out }.sortedBy { it.id }
  require(ins.size == 2 && outs.size == 2) { "enumerateTree2to2 expects 2 → 2" }
  val all = ins + outs
  val a = all.first()
  val rest = all.drop(1)
  val result = mutableListOf<Diagram>()

  for (partner in rest) {
    val groupA = listOf(a, partner)
    val groupB = rest.filter { it != partner }
    val lineA = missingLine(groupA) ?: continue
    val lineB = missingLine(groupB) ?: continue
    if (lineA::class != lineB::class) continue
    if (lineA is Missing.Fermion && lineB is Missing.Fermion && lineA.into == lineB.into) continue

    val extNodes = ins.mapIndexed { i, e -> DiagramNode(e.id, NodeKind.In, EXT_IN[i].first, EXT_IN[i].second, e.species) } +
      outs.mapIndexed { i, e -> DiagramNode(e.id, NodeKind.Out, EXT_OUT[i].first, EXT_OUT[i].second, e.species) }
    val edges = groupA.map { legEdge(it, "vA") } + groupB.map { legEdge(it, "vB") } + when (lineA) {
      Missing.Photon -> DiagramEdge("int", EdgeType.Photon, "vA", "vB")
      is Missing.Fermion -> if (lineA.into) DiagramEdge("int", EdgeType.Fermion, "vB", "vA") else DiagramEdge("int", EdgeType.Fermion, "vA", "vB")
    }
    val draft = Diagram(extNodes + listOf(DiagramNode("vA", NodeKind.Vertex, 0.0, 0.0), DiagramNode("vB", NodeKind.Vertex, 0.0, 0.0)), edges)
    val ch = channelOf(draft)!!
    val (pa, pb) = VERTEX_POS.getValue(ch)
    val placed = draft.copy(nodes = extNodes + listOf(DiagramNode("vA", NodeKind.Vertex, pa.first, pa.second), DiagramNode("vB", NodeKind.Vertex, pb.first, pb.second)))
    if (validate(placed, ValidationOptions(kinematics = true)).ok) result += placed
  }
  return result
}

private fun spec(id: String, kind: NodeKind, s: Species) = ExternalSpec(id, kind, s)
private val E = Species.Electron
private val P = Species.Positron
private val G = Species.Photon

val PROCESSES: Map<String, List<ExternalSpec>> = linkedMapOf(
  "moller" to listOf(spec("in1", NodeKind.In, E), spec("in2", NodeKind.In, E), spec("out1", NodeKind.Out, E), spec("out2", NodeKind.Out, E)),
  "bhabha" to listOf(spec("in1", NodeKind.In, E), spec("in2", NodeKind.In, P), spec("out1", NodeKind.Out, E), spec("out2", NodeKind.Out, P)),
  "annihilation" to listOf(spec("in1", NodeKind.In, E), spec("in2", NodeKind.In, P), spec("out1", NodeKind.Out, G), spec("out2", NodeKind.Out, G)),
  "compton" to listOf(spec("in1", NodeKind.In, E), spec("in2", NodeKind.In, G), spec("out1", NodeKind.Out, E), spec("out2", NodeKind.Out, G)),
  "pairProduction" to listOf(spec("in1", NodeKind.In, G), spec("in2", NodeKind.In, G), spec("out1", NodeKind.Out, E), spec("out2", NodeKind.Out, P)),
  "positronScattering" to listOf(spec("in1", NodeKind.In, P), spec("in2", NodeKind.In, P), spec("out1", NodeKind.Out, P), spec("out2", NodeKind.Out, P)),
)

/**
 * Every topologically distinct tree-level QED diagram for any set of external
 * particles (n ≥ 3). Unrooted trivalent trees with labelled leaves are grown
 * one leaf at a time; each shape gets every assignment of internal lines and
 * is kept if it satisfies the QED vertex rule. Geometry is not computed.
 */
fun enumerateTrees(externals: List<ExternalSpec>): List<Diagram> {
  val n = externals.size
  if (n < 3) return emptyList()
  data class Shape(val edges: List<Pair<String, String>>, val v: Int)
  fun leaf(i: Int) = externals[i].id
  var shapes = listOf(Shape(listOf(leaf(0) to "v0", leaf(1) to "v0", leaf(2) to "v0"), 1))
  for (i in 3 until n) {
    shapes = shapes.flatMap { s ->
      s.edges.mapIndexed { k, (a, b) ->
        val nv = "v${s.v}"
        Shape(s.edges.filterIndexed { j, _ -> j != k } + listOf(a to nv, nv to b, leaf(i) to nv), s.v + 1)
      }
    }
  }

  val specs = externals.associateBy { it.id }
  val result = mutableListOf<Diagram>()
  for (s in shapes) {
    val nodes = externals.map { DiagramNode(it.id, it.kind, 0.0, 0.0, it.species) } +
      (0 until s.v).map { DiagramNode("v$it", NodeKind.Vertex, 0.0, 0.0) }
    val ext = mutableListOf<DiagramEdge>()
    val internal = mutableListOf<Pair<String, String>>()
    for ((a, b) in s.edges) {
      val spec = specs[a] ?: specs[b]
      if (spec == null) {
        internal += a to b
        continue
      }
      val v = if (spec.id == a) b else a
      ext += when {
        spec.species == Species.Photon -> DiagramEdge(spec.id, EdgeType.Photon, spec.id, v)
        arrowIntoVertex(spec) == true -> DiagramEdge(spec.id, EdgeType.Fermion, spec.id, v)
        else -> DiagramEdge(spec.id, EdgeType.Fermion, v, spec.id)
      }
    }
    var combos = 1
    repeat(internal.size) { combos *= 3 }
    for (c in 0 until combos) {
      var k = c
      val edges = ext.toMutableList()
      internal.forEachIndexed { i, (a, b) ->
        val t = k % 3
        k /= 3
        val id = "i$i"
        edges += when (t) {
          0 -> DiagramEdge(id, EdgeType.Photon, a, b)
          1 -> DiagramEdge(id, EdgeType.Fermion, a, b)
          else -> DiagramEdge(id, EdgeType.Fermion, b, a)
        }
      }
      val d = Diagram(nodes, edges)
      if (validate(d).ok && result.none { sameTopology(it, d) }) result += d
    }
  }
  return result
}
