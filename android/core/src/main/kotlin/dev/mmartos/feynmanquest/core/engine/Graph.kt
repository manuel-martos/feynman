package dev.mmartos.feynmanquest.core.engine

fun Diagram.nodeMap(): Map<String, DiagramNode> = nodes.associateBy { it.id }

fun Diagram.incidentEdges(nodeId: String): List<DiagramEdge> = edges.filter { it.from == nodeId || it.to == nodeId }

/** A self loop counts twice, as in graph theory. */
fun Diagram.degree(nodeId: String): Int =
  edges.sumOf { (if (it.from == nodeId) 1 else 0) + (if (it.to == nodeId) 1 else 0) }

fun DiagramEdge.otherEnd(nodeId: String): String = if (from == nodeId) to else from

/**
 * Species carried by an edge attached to an external node, derived from the
 * arrow direction and the side of the diagram (initial / final state).
 */
fun Diagram.externalSpecies(edge: DiagramEdge): Species? {
  if (edge.type == EdgeType.Photon) return Species.Photon
  val nodes = nodeMap()
  val a = nodes[edge.from]
  val b = nodes[edge.to]
  val ext = when {
    a != null && a.isExternal -> a
    b != null && b.isExternal -> b
    else -> return null
  }
  val arrowIntoDiagram = edge.from == ext.id
  return if (ext.kind == NodeKind.In) {
    if (arrowIntoDiagram) Species.Electron else Species.Positron
  } else {
    if (arrowIntoDiagram) Species.Positron else Species.Electron
  }
}

enum class EdgeRole { External, Internal }

fun Diagram.edgeRole(edge: DiagramEdge): EdgeRole {
  val nodes = nodeMap()
  val a = nodes[edge.from]
  val b = nodes[edge.to]
  return if ((a != null && a.isExternal) || (b != null && b.isExternal)) EdgeRole.External else EdgeRole.Internal
}

/** Display label for an edge: e⁻, e⁺, γ, or the virtual internal lines. */
fun Diagram.edgeLabel(edge: DiagramEdge): String {
  edge.labelOverride?.takeIf { it.isNotEmpty() }?.let { return it }
  if (edgeRole(edge) == EdgeRole.Internal) return if (edge.type == EdgeType.Photon) "γ*" else "e*"
  return externalSpecies(edge)?.symbol ?: ""
}

/** The edge attached to an external node, if exactly one. */
fun Diagram.externalEdge(nodeId: String): DiagramEdge? = incidentEdges(nodeId).singleOrNull()

/** Union–find helper used for connectivity and cycle detection. */
class DisjointSet {
  private val parent = HashMap<String, String>()

  fun find(x: String): String {
    val p = parent.getOrPut(x) { x }
    if (p == x) return x
    val root = find(p)
    parent[x] = root
    return root
  }

  /** Returns false if x and y were already connected. */
  fun union(x: String, y: String): Boolean {
    val rx = find(x)
    val ry = find(y)
    if (rx == ry) return false
    parent[rx] = ry
    return true
  }
}

/** Perturbative order: each QED vertex contributes one power of e. */
fun Diagram.couplingOrder(): Int = nodes.count { it.kind == NodeKind.Vertex }
