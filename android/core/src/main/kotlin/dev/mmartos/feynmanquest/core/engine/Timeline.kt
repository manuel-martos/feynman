package dev.mmartos.feynmanquest.core.engine

data class Traversal(
  val edge: DiagramEdge,
  /** Node where the particle starts (earlier in time) and where it ends. */
  val start: String,
  val end: String,
  /** Species as seen moving forward in time along this line. */
  val species: Species,
  val virtual: Boolean,
)

data class VertexEvent(
  val vertex: String,
  /** Lines arriving from the past and leaving towards the future. */
  val ins: List<Traversal>,
  val outs: List<Traversal>,
)

data class Timeline(
  /** Rank in time of every node: incoming 0, vertices 1..n, outgoing n+1. */
  val rank: Map<String, Int>,
  val steps: Int,
  val traversals: List<Traversal>,
  val events: List<VertexEvent>,
)

/**
 * Reads a diagram as a story in time (left → right). Vertices are ordered by
 * horizontal position (ties broken top to bottom). Every line is travelled
 * from its earlier to its later end; a fermion line whose arrow points
 * backwards in time is seen as a positron.
 */
fun timeline(d: Diagram): Timeline {
  val nodes = d.nodeMap()
  val vertices = d.nodes.filter { it.kind == NodeKind.Vertex }.sortedWith(compareBy({ it.x }, { it.y }))
  val rank = LinkedHashMap<String, Int>()
  d.nodes.filter { it.kind == NodeKind.In }.forEach { rank[it.id] = 0 }
  vertices.forEachIndexed { i, v -> rank[v.id] = i + 1 }
  d.nodes.filter { it.kind == NodeKind.Out }.forEach { rank[it.id] = vertices.size + 1 }

  val traversals = mutableListOf<Traversal>()
  for (e in d.edges) {
    val a = nodes[e.from] ?: continue
    val b = nodes[e.to] ?: continue
    if (a.id == b.id) continue
    val forward = rank.getValue(a.id) <= rank.getValue(b.id)
    val (start, end) = if (forward) a.id to b.id else b.id to a.id
    val species = when {
      e.type == EdgeType.Photon -> Species.Photon
      e.from == start -> Species.Electron
      else -> Species.Positron
    }
    traversals += Traversal(e, start, end, species, d.edgeRole(e) == EdgeRole.Internal && !a.isExternal && !b.isExternal)
  }
  val events = vertices.map { v ->
    VertexEvent(v.id, traversals.filter { it.end == v.id }, traversals.filter { it.start == v.id })
  }
  return Timeline(rank, vertices.size + 1, traversals, events)
}
