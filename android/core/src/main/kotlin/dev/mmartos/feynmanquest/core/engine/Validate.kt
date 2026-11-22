package dev.mmartos.feynmanquest.core.engine

import kotlinx.serialization.json.JsonPrimitive

/**
 * Deterministic validator organised in layers: structural, theoretical (QED
 * vertex rules), level goals and physical (charge, Furry, kinematics).
 * Issues are ordered by priority, exactly as the TypeScript engine does.
 */
fun validate(d: Diagram, opts: ValidationOptions = ValidationOptions()): ValidationResult {
  val issues = mutableListOf<Issue>()
  issues += structuralIssues(d, opts.loops ?: 0)
  issues += theoryIssues(d)
  if (issues.isEmpty()) issues += goalIssues(d, opts)
  if (issues.isEmpty()) issues += physicalIssues(d, opts)
  return ValidationResult(issues.isEmpty(), issues)
}

private fun data(vararg pairs: Pair<String, Any>): Map<String, JsonPrimitive> =
  pairs.associate { (k, v) -> k to if (v is Number) JsonPrimitive(v) else JsonPrimitive(v.toString()) }

fun structuralIssues(d: Diagram, maxLoops: Int = 0): List<Issue> {
  val issues = mutableListOf<Issue>()
  val nodes = d.nodeMap()

  for (e in d.edges) {
    if (e.from == e.to) issues += Issue(IssueCode.SELF_LOOP, ValidationLayer.Structural, listOf(e.id, e.from))
    val a = nodes[e.from]
    val b = nodes[e.to]
    if (a != null && b != null && a.isExternal && b.isExternal) {
      issues += Issue(IssueCode.EXTERNAL_TO_EXTERNAL, ValidationLayer.Structural, listOf(e.id, a.id, b.id))
    }
  }

  for (n in d.nodes) {
    val deg = d.degree(n.id)
    val inc = d.incidentEdges(n.id).map { it.id }
    if (n.isExternal) {
      if (deg == 0) issues += Issue(IssueCode.EXTERNAL_UNCONNECTED, ValidationLayer.Structural, listOf(n.id))
      else if (deg > 1) issues += Issue(IssueCode.EXTERNAL_OVERCONNECTED, ValidationLayer.Structural, listOf(n.id) + inc)
    } else if (deg == 0) {
      issues += Issue(IssueCode.VERTEX_UNUSED, ValidationLayer.Structural, listOf(n.id))
    } else if (deg != 3) {
      issues += Issue(IssueCode.VERTEX_DEGREE, ValidationLayer.Structural, listOf(n.id) + inc, data("degree" to deg))
    }
  }

  // Connectivity and loops.
  val ds = DisjointSet()
  d.nodes.forEach { ds.find(it.id) }
  val cycleEdges = mutableListOf<String>()
  for (e in d.edges) {
    if (e.from == e.to) continue
    if (!ds.union(e.from, e.to)) cycleEdges += e.id
  }
  val used = d.nodes.filter { d.degree(it.id) > 0 }
  val groups = LinkedHashMap<String, MutableList<String>>()
  for (n in used) groups.getOrPut(ds.find(n.id)) { mutableListOf() } += n.id
  if (groups.size > 1) {
    val sorted = groups.values.sortedByDescending { it.size }
    val detached = sorted.drop(1).flatten()
    val edgeIds = d.edges.filter { it.from in detached }.map { it.id }
    issues += Issue(IssueCode.DISCONNECTED, ValidationLayer.Structural, detached + edgeIds)
  }
  if (cycleEdges.size > maxLoops) issues += Issue(IssueCode.LOOP, ValidationLayer.Structural, cycleEdges)

  return issues
}

/** QED: every vertex joins one incoming arrow, one outgoing arrow and one photon. */
fun theoryIssues(d: Diagram): List<Issue> {
  val issues = mutableListOf<Issue>()
  for (v in d.nodes) {
    if (v.kind != NodeKind.Vertex) continue
    val inc = d.incidentEdges(v.id).filter { it.from != it.to }
    if (inc.size != 3) continue
    val photons = inc.filter { it.type == EdgeType.Photon }
    val ids = listOf(v.id) + inc.map { it.id }
    if (photons.size != 1) {
      issues += Issue(IssueCode.VERTEX_PHOTON_COUNT, ValidationLayer.Theory, ids, data("photons" to photons.size))
      continue
    }
    val fermions = inc.filter { it.type == EdgeType.Fermion }
    val arrowsIn = fermions.count { it.to == v.id }
    if (arrowsIn != 1) {
      issues += Issue(IssueCode.VERTEX_FERMION_FLOW, ValidationLayer.Theory, listOf(v.id) + fermions.map { it.id }, data("arrowsIn" to arrowsIn))
    }
  }
  return issues
}

fun goalIssues(d: Diagram, opts: ValidationOptions): List<Issue> {
  val issues = mutableListOf<Issue>()
  for (n in d.nodes) {
    val expect = n.expect ?: continue
    if (!n.isExternal) continue
    val e = d.externalEdge(n.id) ?: continue
    val got = d.externalSpecies(e)
    if (got != expect) {
      issues += Issue(IssueCode.EXTERNAL_MISMATCH, ValidationLayer.Goal, listOf(n.id, e.id), data("expected" to expect.id, "got" to (got?.id ?: "?")))
    }
  }
  if (issues.isNotEmpty()) return issues

  opts.channel?.let { wanted ->
    val ch = channelOf(d)
    if (ch != wanted) {
      val internal = d.edges.filter { d.edgeRole(it) == EdgeRole.Internal }.map { it.id }
      issues += Issue(IssueCode.WRONG_CHANNEL, ValidationLayer.Goal, internal, data("expected" to wanted.id, "got" to (ch?.id ?: "?")))
    }
  }
  if (opts.differentFrom?.any { sameTopology(it, d) } == true) {
    issues += Issue(IssueCode.SAME_AS_REFERENCE, ValidationLayer.Goal, d.edges.map { it.id })
  }
  return issues
}

data class ChargeBalance(val initial: Int, val final: Int)

fun chargeBalance(d: Diagram): ChargeBalance {
  var initial = 0
  var final = 0
  for (n in d.nodes) {
    if (!n.isExternal) continue
    val e = d.externalEdge(n.id) ?: continue
    val s = d.externalSpecies(e) ?: continue
    if (n.kind == NodeKind.In) initial += s.charge else final += s.charge
  }
  return ChargeBalance(initial, final)
}

fun physicalIssues(d: Diagram, opts: ValidationOptions): List<Issue> {
  val issues = mutableListOf<Issue>()
  val (initial, final) = chargeBalance(d)
  if (initial != final) {
    issues += Issue(IssueCode.CHARGE_NOT_CONSERVED, ValidationLayer.Physical, emptyList(), data("initial" to initial, "final" to final))
  }
  // Furry's theorem: a closed electron loop with an odd number of photons cancels.
  for (loop in fermionLoops(d)) {
    if (loop.size % 2 == 1) issues += Issue(IssueCode.FURRY, ValidationLayer.Physical, loop, data("photons" to loop.size))
  }
  if (opts.kinematics == true) {
    val vertices = d.nodes.filter { it.kind == NodeKind.Vertex }
    val externals = d.nodes.filter { it.isExternal }
    // Every 3-point QED process with free, real particles violates energy–momentum conservation.
    if (vertices.size == 1 && externals.size == 3) {
      issues += Issue(IssueCode.KINEMATICALLY_FORBIDDEN, ValidationLayer.Physical, listOf(vertices[0].id))
    }
  }
  return issues
}

/**
 * Closed fermion loops: groups of vertices joined by fermion lines that never
 * reach an external particle. Returns the vertex ids of each loop.
 */
fun fermionLoops(d: Diagram): List<List<String>> {
  val ds = DisjointSet()
  val fermions = d.edges.filter { it.type == EdgeType.Fermion && it.from != it.to }
  fermions.forEach { ds.union(it.from, it.to) }
  val groups = LinkedHashMap<String, LinkedHashSet<String>>()
  for (e in fermions) {
    val g = groups.getOrPut(ds.find(e.from)) { LinkedHashSet() }
    g += e.from
    g += e.to
  }
  val nodes = d.nodeMap()
  return groups.values.map { it.toList() }.filter { g -> g.all { nodes[it]?.kind == NodeKind.Vertex } }
}
