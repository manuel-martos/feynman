package dev.mmartos.feynmanquest.core.engine

/** Leaf ids reachable from [start] without crossing [cut]. */
private fun leavesOnSide(d: Diagram, start: String, cut: DiagramEdge): List<String> {
  val nodes = d.nodeMap()
  val seen = hashSetOf(start)
  val stack = ArrayDeque(listOf(start))
  val leaves = mutableListOf<String>()
  while (stack.isNotEmpty()) {
    val id = stack.removeLast()
    if (nodes[id]?.isExternal == true) leaves += id
    for (e in d.edges) {
      if (e === cut) continue
      if (e.from != id && e.to != id) continue
      val nxt = e.otherEnd(id)
      if (seen.add(nxt)) stack.addLast(nxt)
    }
  }
  return leaves.sorted()
}

/**
 * Canonical, drawing-independent signature of a tree diagram: the set of leaf
 * bipartitions ("splits") induced by its internal edges, with their types.
 */
fun topologySignature(d: Diagram): String {
  val allLeaves = d.nodes.filter { it.isExternal }.map { it.id }.sorted()
  val first = allLeaves.firstOrNull()
  val splits = mutableListOf<String>()
  for (e in d.edges) {
    if (d.edgeRole(e) != EdgeRole.Internal) continue
    var side = leavesOnSide(d, e.from, e)
    if (first != null && first !in side) side = allLeaves.filter { it !in side }
    val type = if (e.type == EdgeType.Photon) "photon" else "fermion"
    splits += "$type:{${side.joinToString(",")}}"
  }
  return "[${allLeaves.joinToString(",")}]|${splits.sorted().joinToString("|")}"
}

fun sameTopology(a: Diagram, b: Diagram): Boolean = topologySignature(a) == topologySignature(b)

/**
 * Mandelstam channel of a 2 → 2 tree diagram with a single internal line.
 * The first initial-state leg (by id) is paired with the other initial leg
 * (s), the first final leg (t) or the second final leg (u).
 */
fun channelOf(d: Diagram): Channel? {
  val ins = d.nodes.filter { it.kind == NodeKind.In }.map { it.id }.sorted()
  val outs = d.nodes.filter { it.kind == NodeKind.Out }.map { it.id }.sorted()
  if (ins.size != 2 || outs.size != 2) return null
  val internal = d.edges.filter { d.edgeRole(it) == EdgeRole.Internal }
  if (internal.size != 1) return null
  val side = leavesOnSide(d, internal[0].from, internal[0])
  val withFirst = if (ins[0] in side) side else (ins + outs).filter { it !in side }
  if (withFirst.size != 2) return null
  return when (withFirst.firstOrNull { it != ins[0] }) {
    ins[1] -> Channel.S
    outs[0] -> Channel.T
    outs[1] -> Channel.U
    else -> null
  }
}

/** Edges that lie on a closed loop (removing them keeps the graph connected). */
fun loopEdges(d: Diagram): List<String> = d.edges.filter { cut ->
  if (cut.from == cut.to) return@filter true
  val seen = hashSetOf(cut.from)
  val stack = ArrayDeque(listOf(cut.from))
  while (stack.isNotEmpty()) {
    val id = stack.removeLast()
    for (e in d.edges) {
      if (e === cut || (e.from != id && e.to != id)) continue
      val nxt = e.otherEnd(id)
      if (seen.add(nxt)) stack.addLast(nxt)
    }
  }
  cut.to in seen
}.map { it.id }

/** Number of independent loops: E − N + (connected components). */
fun loopCount(d: Diagram): Int {
  val used = LinkedHashSet<String>()
  d.edges.forEach { used += it.from; used += it.to }
  val parent = HashMap<String, String>()
  fun find(x: String): String {
    val p = parent[x] ?: x
    return if (p == x) x else find(p)
  }
  var components = used.size
  for (e in d.edges) {
    val a = find(e.from)
    val b = find(e.to)
    if (a != b) {
      parent[a] = b
      components--
    }
  }
  return d.edges.size - used.size + components
}
