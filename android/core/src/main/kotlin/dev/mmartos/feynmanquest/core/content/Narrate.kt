package dev.mmartos.feynmanquest.core.content

import dev.mmartos.feynmanquest.core.engine.Species
import dev.mmartos.feynmanquest.core.engine.Timeline
import dev.mmartos.feynmanquest.core.engine.Traversal
import kotlinx.serialization.Serializable

/** One caption of "watch it in time". Port of src/content/es/narrate.ts. */
@Serializable
data class Caption(
  val title: String,
  val text: String,
  /** Charge balance at a vertex, e.g. "−1 → −1 + 0". */
  val charge: String? = null,
)

private fun Species.word() = when (this) { Species.Electron -> "electrón"; Species.Positron -> "positrón"; Species.Photon -> "fotón" }
private fun name(t: Traversal) = "un ${t.species.word()}${if (t.virtual) " virtual" else ""}"
private fun cap(s: String) = s.replaceFirstChar { it.uppercaseChar() }
private fun list(xs: List<String>) = if (xs.size <= 1) xs.joinToString("") else "${xs.dropLast(1).joinToString(", ")} y ${xs.last()}"
private fun num(q: Int) = if (q < 0) "−${-q}" else if (q > 0) "+$q" else "0"
private fun sum(ts: List<Traversal>): String {
  if (ts.isEmpty()) return "0"
  val qs = ts.map { it.species.charge }
  return (listOf(num(qs[0])) + qs.drop(1).map { q -> if (q < 0) "− ${-q}" else "+ $q" }).joinToString(" ")
}

private fun summary(ts: List<Traversal>): String {
  val counts = LinkedHashMap<Species, Int>()
  for (t in ts) counts[t.species] = (counts[t.species] ?: 0) + 1
  return list(counts.map { (s, n) ->
    val base = s.word()
    if (n == 1) "un $base"
    else {
      val plural = if (base.endsWith("n")) base.replace(Regex("ón$"), "ones") else "${base}s"
      "${when (n) { 2 -> "dos"; 3 -> "tres"; else -> n.toString() }} $plural"
    }
  })
}

private fun sup(n: Int) = n.toString().map { "⁰¹²³⁴⁵⁶⁷⁸⁹"[it - '0'] }.joinToString("")

/** Plain-language description of one moment of a diagram read in time. */
fun narrate(tl: Timeline, step: Int): Caption {
  val vertices = tl.events.size
  if (step <= 0) {
    val ins = tl.traversals.filter { tl.rank[it.start] == 0 }
    val positron = ins.any { it.species == Species.Positron }
    return Caption(
      "Al principio",
      if (ins.isNotEmpty()) "Entran ${summary(ins)}.${if (positron) " El positrón avanza en el tiempo como todo lo demás, aunque su flecha apunte hacia atrás." else ""}"
      else "No entra ninguna partícula: todo empieza en el vacío.",
    )
  }
  if (step > vertices) {
    val outs = tl.traversals.filter { tl.rank[it.end] == vertices + 1 }
    return Caption(
      "Al final",
      "${if (outs.isNotEmpty()) "Salen ${summary(outs)}." else "No sale ninguna partícula."} Con $vertices ${if (vertices == 1) "vértice" else "vértices"}, la amplitud de esta historia es proporcional a e${sup(vertices)}.",
    )
  }
  val ev = tl.events[step - 1]
  val fIn = ev.ins.filter { it.species != Species.Photon }
  val gIn = ev.ins.filter { it.species == Species.Photon }
  val fOut = ev.outs.filter { it.species != Species.Photon }
  val gOut = ev.outs.filter { it.species == Species.Photon }
  val text = when {
    ev.ins.isEmpty() -> "Del vacío surgen, por un instante, ${list(ev.outs.map(::name))}."
    ev.outs.isEmpty() -> "${cap(list(ev.ins.map(::name)))} se encuentran y desaparecen por completo."
    fIn.size == 1 && fOut.size == 1 && gOut.size == 1 ->
      "${cap(name(fIn[0]))} emite ${name(gOut[0])}" + if (fIn[0].virtual == fOut[0].virtual) " y sigue su camino." else " y continúa como ${name(fOut[0])}."
    fIn.size == 1 && gIn.size == 1 && fOut.size == 1 ->
      "${cap(name(fIn[0]))} absorbe ${name(gIn[0])}" + if (fIn[0].virtual == fOut[0].virtual) "." else " y continúa como ${name(fOut[0])}."
    fIn.size == 2 -> "${cap(name(fIn[0]))} y ${name(fIn[1])} se aniquilan en ${name(gOut[0])}."
    else -> "${cap(name(gIn[0]))} se convierte en un par: ${name(fOut[0])} y ${name(fOut[1])}."
  }
  return Caption("Vértice $step", text, "${sum(ev.ins)} → ${sum(ev.outs)}")
}
